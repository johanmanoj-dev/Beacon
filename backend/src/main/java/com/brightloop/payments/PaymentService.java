package com.brightloop.payments;

import com.brightloop.invoices.Invoice;
import com.brightloop.invoices.InvoiceRepository;
import com.brightloop.invoices.InvoiceStatus;
import com.brightloop.payments.dto.*;
import com.brightloop.users.User;
import com.brightloop.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAttemptRepository paymentAttemptRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAllByOrderByPaymentDateDesc().stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByInvoiceId(Long invoiceId) {
        return paymentRepository.findByInvoiceIdOrderByPaymentDateDesc(invoiceId).stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentResponse recordManualPayment(ManualPaymentRequest request) {
        if (request.getInvoiceId() == null) {
            throw new IllegalArgumentException("Invoice ID is required");
        }
        if (request.getAmount() == null) {
            throw new IllegalArgumentException("Payment amount is required");
        }
        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException("Payment method is required");
        }

        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + request.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getBalanceDue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Invoice " + invoice.getInvoiceNumber() + " is already fully paid");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot record payment for a cancelled invoice");
        }
        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            invoice.setStatus(InvoiceStatus.CONFIRMED);
        }

        BigDecimal payAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);
        if (payAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        if (payAmount.compareTo(invoice.getBalanceDue()) > 0) {
            throw new IllegalArgumentException(String.format("Payment amount ($%s) cannot exceed outstanding balance due ($%s)",
                    payAmount, invoice.getBalanceDue()));
        }

        User recorder = null;
        if (request.getRecordedByUserId() != null) {
            recorder = userRepository.findById(request.getRecordedByUserId()).orElse(null);
        }

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(payAmount)
                .paymentMethod(request.getPaymentMethod())
                .referenceNumber(request.getReferenceNumber() != null && !request.getReferenceNumber().isBlank()
                        ? request.getReferenceNumber().trim()
                        : "REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paymentDate(LocalDateTime.now())
                .notes(request.getNotes())
                .recordedBy(recorder)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Atomic balance recalculation with strict BigDecimal precision
        BigDecimal currentPaid = invoice.getAmountPaid() != null
                ? invoice.getAmountPaid().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal newAmountPaid = currentPaid.add(payAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal newBalanceDue = invoice.getTotalAmount().subtract(newAmountPaid).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        invoice.setAmountPaid(newAmountPaid);
        invoice.setBalanceDue(newBalanceDue);

        if (newBalanceDue.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);
        log.info("Recorded manual payment {} of ${} for invoice {}. New balance: ${}",
                savedPayment.getId(), payAmount, invoice.getInvoiceNumber(), newBalanceDue);

        return PaymentResponse.fromEntity(savedPayment);
    }

    @Transactional
    public CheckoutSessionResponse initiateCheckoutSession(CheckoutSessionRequest request) {
        if (request.getInvoiceId() == null) {
            throw new IllegalArgumentException("Invoice ID is required");
        }

        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + request.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot initiate checkout for a cancelled invoice");
        }
        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getBalanceDue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Invoice " + invoice.getInvoiceNumber() + " has zero balance due");
        }

        BigDecimal amountToCharge = (request.getAmount() != null)
                ? request.getAmount().setScale(2, RoundingMode.HALF_UP)
                : invoice.getBalanceDue().setScale(2, RoundingMode.HALF_UP);

        if (amountToCharge.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Checkout amount must be greater than zero");
        }
        if (amountToCharge.compareTo(invoice.getBalanceDue()) > 0) {
            throw new IllegalArgumentException(String.format("Checkout amount ($%s) cannot exceed invoice balance due ($%s)",
                    amountToCharge, invoice.getBalanceDue()));
        }

        // Idempotent attempt reuse if idempotencyKey supplied
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            Optional<PaymentAttempt> existingAttempt = paymentAttemptRepository.findByIdempotencyKey(request.getIdempotencyKey().trim());
            if (existingAttempt.isPresent()) {
                PaymentAttempt existing = existingAttempt.get();
                return CheckoutSessionResponse.builder()
                        .transactionId(existing.getTransactionId())
                        .invoiceId(invoice.getId())
                        .amount(existing.getAmount())
                        .status(existing.getStatus())
                        .paymentMethod(existing.getPaymentMethod())
                        .build();
            }
        }

        String transactionId = "TXN-SIM-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String idempotencyKey = (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank())
                ? request.getIdempotencyKey().trim()
                : "IDEM-" + UUID.randomUUID().toString();

        PaymentAttempt attempt = PaymentAttempt.builder()
                .invoice(invoice)
                .transactionId(transactionId)
                .idempotencyKey(idempotencyKey)
                .amount(amountToCharge)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "SIMULATED_GATEWAY")
                .status("PENDING")
                .build();

        paymentAttemptRepository.save(attempt);

        return CheckoutSessionResponse.builder()
                .transactionId(transactionId)
                .invoiceId(invoice.getId())
                .amount(attempt.getAmount())
                .status("PENDING")
                .paymentMethod(attempt.getPaymentMethod())
                .build();
    }

    @Transactional
    public PaymentResponse confirmPayment(ConfirmPaymentRequest request) {
        if (request.getTransactionId() == null || request.getTransactionId().isBlank()) {
            throw new IllegalArgumentException("Transaction ID is required");
        }

        PaymentAttempt attempt = paymentAttemptRepository.findByTransactionId(request.getTransactionId().trim())
                .orElseThrow(() -> new IllegalArgumentException("Payment attempt not found: " + request.getTransactionId()));

        if ("SUCCESS".equalsIgnoreCase(attempt.getStatus())) {
            log.info("Idempotent confirmation replay: Transaction {} was already processed successfully", request.getTransactionId());
            Payment existingPayment = paymentRepository.findByInvoiceId(attempt.getInvoice().getId())
                    .stream()
                    .filter(p -> attempt.getTransactionId().equals(p.getReferenceNumber()))
                    .findFirst()
                    .orElse(null);

            if (existingPayment != null) {
                return PaymentResponse.fromEntity(existingPayment);
            }
        }

        Invoice invoice = attempt.getInvoice();

        if ("SUCCESS".equalsIgnoreCase(request.getSimulatedOutcome())) {
            if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getBalanceDue().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalStateException("Invoice " + invoice.getInvoiceNumber() + " is already fully paid");
            }
            if (attempt.getAmount().compareTo(invoice.getBalanceDue()) > 0) {
                throw new IllegalStateException(String.format("Payment attempt amount ($%s) exceeds current invoice balance due ($%s)",
                        attempt.getAmount(), invoice.getBalanceDue()));
            }

            attempt.setStatus("SUCCESS");
            attempt.setCompletedAt(LocalDateTime.now());
            paymentAttemptRepository.save(attempt);

            Payment payment = Payment.builder()
                    .invoice(invoice)
                    .amount(attempt.getAmount())
                    .paymentMethod(PaymentMethod.SIMULATED_GATEWAY)
                    .referenceNumber(attempt.getTransactionId())
                    .paymentDate(LocalDateTime.now())
                    .notes("Simulated checkout gateway via " + attempt.getPaymentMethod())
                    .build();

            Payment savedPayment = paymentRepository.save(payment);

            BigDecimal currentPaid = invoice.getAmountPaid() != null
                    ? invoice.getAmountPaid().setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            BigDecimal newPaid = currentPaid.add(attempt.getAmount()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal newBalance = invoice.getTotalAmount().subtract(newPaid).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            invoice.setAmountPaid(newPaid);
            invoice.setBalanceDue(newBalance);

            if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
                invoice.setStatus(InvoiceStatus.PAID);
            } else {
                invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
            }

            invoiceRepository.save(invoice);
            log.info("Simulated payment SUCCESS for invoice {}. New balance: ${}, status: {}",
                    invoice.getInvoiceNumber(), newBalance, invoice.getStatus());

            return PaymentResponse.fromEntity(savedPayment);
        } else {
            attempt.setStatus("FAILED");
            attempt.setFailureReason(request.getFailureReason() != null ? request.getFailureReason() : "Declined by issuing bank (Simulated failure test)");
            attempt.setCompletedAt(LocalDateTime.now());
            paymentAttemptRepository.save(attempt);

            log.warn("Simulated payment FAILED for transaction {}", attempt.getTransactionId());
            throw new RuntimeException("Simulated payment transaction failed: " + attempt.getFailureReason());
        }
    }

    @Transactional
    public GatewayCheckoutResponse initiateGatewayCheckout(GatewayCheckoutRequest req) {
        CheckoutSessionResponse res = initiateCheckoutSession(CheckoutSessionRequest.builder()
                .invoiceId(req.getInvoiceId())
                .amount(req.getAmount())
                .paymentMethod(req.getPaymentMethod())
                .idempotencyKey(req.getIdempotencyKey())
                .build());

        return GatewayCheckoutResponse.builder()
                .transactionId(res.getTransactionId())
                .invoiceId(res.getInvoiceId())
                .amount(res.getAmount())
                .currency("USD")
                .status("PENDING")
                .clientSecret("sim_sec_" + UUID.randomUUID())
                .paymentMethod(res.getPaymentMethod())
                .build();
    }

    @Transactional
    public GatewayConfirmResponse confirmGatewayPayment(GatewayConfirmRequest req) {
        if (req.getTransactionId() == null || req.getTransactionId().isBlank()) {
            throw new IllegalArgumentException("Transaction ID is required");
        }

        PaymentAttempt attempt = paymentAttemptRepository.findByTransactionId(req.getTransactionId().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid transaction ID: " + req.getTransactionId()));

        Invoice invoice = attempt.getInvoice();
        boolean isSuccess = req.getSimulatedStatus() == PaymentAttemptStatus.SUCCESS || "SUCCESS".equalsIgnoreCase(req.getSimulatedStatus() != null ? req.getSimulatedStatus().name() : "");

        if (isSuccess) {
            PaymentResponse pRes = confirmPayment(ConfirmPaymentRequest.builder()
                    .transactionId(req.getTransactionId())
                    .simulatedOutcome("SUCCESS")
                    .build());

            return GatewayConfirmResponse.builder()
                    .transactionId(attempt.getTransactionId())
                    .status(PaymentAttemptStatus.SUCCESS)
                    .invoiceId(invoice.getId())
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .amountPaid(attempt.getAmount())
                    .remainingBalance(invoice.getBalanceDue())
                    .updatedInvoiceStatus(invoice.getStatus())
                    .message("Simulated checkout payment successful! Invoice balance updated.")
                    .build();
        } else {
            attempt.setStatus("FAILED");
            attempt.setFailureReason(req.getSimulatedFailureReason() != null ? req.getSimulatedFailureReason() : "Simulated decline");
            attempt.setCompletedAt(LocalDateTime.now());
            paymentAttemptRepository.save(attempt);

            return GatewayConfirmResponse.builder()
                    .transactionId(attempt.getTransactionId())
                    .status(PaymentAttemptStatus.FAILED)
                    .invoiceId(invoice.getId())
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .amountPaid(BigDecimal.ZERO)
                    .remainingBalance(invoice.getBalanceDue())
                    .updatedInvoiceStatus(invoice.getStatus())
                    .message("Simulated payment failed: " + attempt.getFailureReason())
                    .build();
        }
    }
}

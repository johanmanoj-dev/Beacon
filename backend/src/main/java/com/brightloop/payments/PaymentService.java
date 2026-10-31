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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
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
        return paymentRepository.findAll().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByInvoiceId(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId).stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentResponse recordManualPayment(ManualPaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + request.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalStateException("Invoice " + invoice.getInvoiceNumber() + " is already fully paid");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot record payment for a cancelled invoice");
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
                .referenceNumber(request.getReferenceNumber() != null ? request.getReferenceNumber().trim() : "REF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paymentDate(LocalDateTime.now())
                .notes(request.getNotes())
                .recordedBy(recorder)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Update Invoice balances and status atomically
        BigDecimal newPaid = (invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO).add(payAmount);
        BigDecimal newBalance = invoice.getTotalAmount().subtract(newPaid).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        invoice.setAmountPaid(newPaid);
        invoice.setBalanceDue(newBalance);

        if (newBalance.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);
        log.info("Recorded manual payment of ${} for invoice {}. New balance: ${}, status: {}",
                payAmount, invoice.getInvoiceNumber(), newBalance, invoice.getStatus());

        return PaymentResponse.fromEntity(savedPayment);
    }

    @Transactional
    public CheckoutSessionResponse initiateCheckoutSession(CheckoutSessionRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + request.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getBalanceDue().compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalStateException("Invoice is already fully paid");
        }

        BigDecimal sessionAmount = request.getAmount() != null ? request.getAmount() : invoice.getBalanceDue();
        sessionAmount = sessionAmount.min(invoice.getBalanceDue()).setScale(2, RoundingMode.HALF_UP);

        String txnId = "TXN-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String idempKey = "IDEMP-" + UUID.randomUUID().toString();

        PaymentAttempt attempt = PaymentAttempt.builder()
                .invoice(invoice)
                .amount(sessionAmount)
                .transactionId(txnId)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "UPI")
                .status("PENDING")
                .idempotencyKey(idempKey)
                .build();

        PaymentAttempt saved = paymentAttemptRepository.save(attempt);

        return CheckoutSessionResponse.builder()
                .transactionId(saved.getTransactionId())
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .amount(saved.getAmount())
                .paymentMethod(saved.getPaymentMethod())
                .status(saved.getStatus())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Transactional
    public PaymentResponse confirmPayment(ConfirmPaymentRequest request) {
        PaymentAttempt attempt = paymentAttemptRepository.findByTransactionId(request.getTransactionId())
                .orElseThrow(() -> new IllegalArgumentException("Payment attempt not found with transaction ID: " + request.getTransactionId()));

        if (!"PENDING".equalsIgnoreCase(attempt.getStatus())) {
            log.info("Payment attempt {} is already in terminal status: {}", attempt.getTransactionId(), attempt.getStatus());
            // Idempotent response: find existing payment if SUCCESS
            List<Payment> existing = paymentRepository.findByInvoiceId(attempt.getInvoice().getId());
            for (Payment p : existing) {
                if (attempt.getTransactionId().equals(p.getReferenceNumber())) {
                    return PaymentResponse.fromEntity(p);
                }
            }
        }

        Invoice invoice = attempt.getInvoice();
        boolean isSuccess = "SUCCESS".equalsIgnoreCase(request.getSimulatedOutcome());

        if (isSuccess) {
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

            // Update Invoice balance and status
            BigDecimal newPaid = (invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO).add(attempt.getAmount());
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
            attempt.setFailureReason("Declined by issuing bank (Simulated failure test)");
            attempt.setCompletedAt(LocalDateTime.now());
            paymentAttemptRepository.save(attempt);

            log.warn("Simulated payment FAILED for transaction {}", attempt.getTransactionId());
            throw new RuntimeException("Simulated payment transaction failed: Declined by issuing bank");
        }
    }
}

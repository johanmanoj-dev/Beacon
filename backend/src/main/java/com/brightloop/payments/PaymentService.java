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
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAttemptRepository attemptRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    @Transactional
    public PaymentResponse recordManualPayment(ManualPaymentRequest req) {
        Invoice invoice = invoiceRepository.findById(req.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + req.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot record payment against a CANCELLED invoice");
        }

        if (invoice.getStatus() == InvoiceStatus.PAID || invoice.getBalanceDue().compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalStateException("Invoice is already fully PAID. Balance due is $0.00");
        }

        if (req.getAmount().compareTo(invoice.getBalanceDue()) > 0) {
            throw new IllegalArgumentException(String.format(
                    "Payment amount ($%s) cannot exceed invoice balance due ($%s)",
                    req.getAmount(), invoice.getBalanceDue()
            ));
        }

        User staffUser = null;
        if (req.getRecordedByUserId() != null) {
            staffUser = userRepository.findById(req.getRecordedByUserId()).orElse(null);
        }

        String refNum = req.getReferenceNumber();
        if (refNum == null || refNum.trim().isEmpty()) {
            refNum = "REF-" + System.currentTimeMillis();
        }

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(req.getAmount())
                .paymentMethod(req.getPaymentMethod())
                .referenceNumber(refNum)
                .paymentDate(LocalDateTime.now())
                .notes(req.getNotes())
                .recordedBy(staffUser)
                .build();

        payment = paymentRepository.save(payment);

        // Atomic balance recalculation
        BigDecimal newAmountPaid = invoice.getAmountPaid().add(req.getAmount());
        BigDecimal newBalanceDue = invoice.getTotalAmount().subtract(newAmountPaid).max(BigDecimal.ZERO);
        invoice.setAmountPaid(newAmountPaid);
        invoice.setBalanceDue(newBalanceDue);

        if (newBalanceDue.compareTo(BigDecimal.ZERO) == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);

        log.info("Recorded manual payment {} of ${} for invoice {}. New balance: ${}",
                payment.getId(), payment.getAmount(), invoice.getInvoiceNumber(), newBalanceDue);

        return PaymentResponse.fromEntity(payment);
    }

    @Transactional
    public GatewayCheckoutResponse initiateGatewayCheckout(GatewayCheckoutRequest req) {
        Invoice invoice = invoiceRepository.findById(req.getInvoiceId())
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + req.getInvoiceId()));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED || invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalStateException("Invoice cannot accept gateway payment in status " + invoice.getStatus());
        }

        String idempotencyKey = req.getIdempotencyKey();
        if (idempotencyKey == null || idempotencyKey.trim().isEmpty()) {
            idempotencyKey = "IDEM-" + UUID.randomUUID().toString().substring(0, 8);
        }

        // Return existing attempt if matching idempotency key already created
        var existingAttempt = attemptRepository.findByIdempotencyKey(idempotencyKey);
        if (existingAttempt.isPresent()) {
            PaymentAttempt att = existingAttempt.get();
            return GatewayCheckoutResponse.builder()
                    .transactionId(att.getTransactionId())
                    .idempotencyKey(att.getIdempotencyKey())
                    .invoiceId(invoice.getId())
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getCompanyName() : null)
                    .amount(att.getAmount())
                    .paymentMethod(att.getPaymentMethod())
                    .status(att.getStatus().name())
                    .message("Existing checkout session retrieved")
                    .build();
        }

        String transactionId = "TXN-SIM-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        String method = req.getPaymentMethod() != null ? req.getPaymentMethod() : "SIMULATED_GATEWAY";

        PaymentAttempt attempt = PaymentAttempt.builder()
                .invoice(invoice)
                .amount(req.getAmount())
                .transactionId(transactionId)
                .paymentMethod(method)
                .status(PaymentAttemptStatus.PENDING)
                .idempotencyKey(idempotencyKey)
                .build();

        attemptRepository.save(attempt);

        return GatewayCheckoutResponse.builder()
                .transactionId(transactionId)
                .idempotencyKey(idempotencyKey)
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getCompanyName() : null)
                .amount(req.getAmount())
                .paymentMethod(method)
                .status(PaymentAttemptStatus.PENDING.name())
                .message("Gateway checkout initialized. Awaiting confirmation.")
                .build();
    }

    @Transactional
    public GatewayConfirmResponse confirmGatewayPayment(GatewayConfirmRequest req) {
        PaymentAttempt attempt = attemptRepository.findByTransactionId(req.getTransactionId())
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + req.getTransactionId()));

        Invoice invoice = attempt.getInvoice();

        // Idempotency: If attempt is already completed, return existing result without duplicate charge
        if (attempt.getStatus() == PaymentAttemptStatus.SUCCESS) {
            return GatewayConfirmResponse.builder()
                    .transactionId(attempt.getTransactionId())
                    .status(PaymentAttemptStatus.SUCCESS)
                    .invoiceId(invoice.getId())
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .amountPaid(attempt.getAmount())
                    .remainingBalance(invoice.getBalanceDue())
                    .updatedInvoiceStatus(invoice.getStatus())
                    .message("Payment already confirmed previously (Idempotent replay).")
                    .build();
        }

        if (req.getSimulatedStatus() == PaymentAttemptStatus.SUCCESS) {
            attempt.setStatus(PaymentAttemptStatus.SUCCESS);
            attempt.setCompletedAt(LocalDateTime.now());
            attemptRepository.save(attempt);

            // Create actual payment ledger entry
            Payment payment = Payment.builder()
                    .invoice(invoice)
                    .amount(attempt.getAmount())
                    .paymentMethod(PaymentMethod.SIMULATED_GATEWAY)
                    .referenceNumber(attempt.getTransactionId())
                    .paymentDate(LocalDateTime.now())
                    .notes("Simulated checkout gateway settlement")
                    .recordedBy(null)
                    .build();

            paymentRepository.save(payment);

            // Atomic balance recalculation
            BigDecimal newAmountPaid = invoice.getAmountPaid().add(attempt.getAmount());
            BigDecimal newBalanceDue = invoice.getTotalAmount().subtract(newAmountPaid).max(BigDecimal.ZERO);
            invoice.setAmountPaid(newAmountPaid);
            invoice.setBalanceDue(newBalanceDue);

            if (newBalanceDue.compareTo(BigDecimal.ZERO) == 0) {
                invoice.setStatus(InvoiceStatus.PAID);
            } else {
                invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
            }

            invoiceRepository.save(invoice);

            log.info("Simulated checkout SUCCESS for transaction {}. Invoice {} transitioned to {}",
                    attempt.getTransactionId(), invoice.getInvoiceNumber(), invoice.getStatus());

            return GatewayConfirmResponse.builder()
                    .transactionId(attempt.getTransactionId())
                    .status(PaymentAttemptStatus.SUCCESS)
                    .invoiceId(invoice.getId())
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .amountPaid(attempt.getAmount())
                    .remainingBalance(newBalanceDue)
                    .updatedInvoiceStatus(invoice.getStatus())
                    .message("Simulated checkout payment successful! Invoice balance updated.")
                    .build();
        } else {
            String reason = req.getFailureReason() != null ? req.getFailureReason() : "Simulated card decline or gateway timeout";
            attempt.setStatus(PaymentAttemptStatus.FAILED);
            attempt.setFailureReason(reason);
            attempt.setCompletedAt(LocalDateTime.now());
            attemptRepository.save(attempt);

            log.warn("Simulated checkout FAILED for transaction {}: {}", attempt.getTransactionId(), reason);

            return GatewayConfirmResponse.builder()
                    .transactionId(attempt.getTransactionId())
                    .status(PaymentAttemptStatus.FAILED)
                    .invoiceId(invoice.getId())
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .amountPaid(BigDecimal.ZERO)
                    .remainingBalance(invoice.getBalanceDue())
                    .updatedInvoiceStatus(invoice.getStatus())
                    .message("Simulated payment failed: " + reason)
                    .build();
        }
    }

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
}

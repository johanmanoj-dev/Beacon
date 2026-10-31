package com.brightloop.invoices;

import com.brightloop.invoices.dto.InvoiceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + id));
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with number: " + invoiceNumber));
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByCustomerId(Long customerId) {
        return invoiceRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesBySubscriptionId(Long subscriptionId) {
        return invoiceRepository.findBySubscriptionIdOrderByBillingPeriodStartDesc(subscriptionId).stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByStatus(InvoiceStatus status) {
        return invoiceRepository.findByStatus(status).stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }
}

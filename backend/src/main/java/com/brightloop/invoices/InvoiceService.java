package com.brightloop.invoices;

import com.brightloop.invoices.dto.InvoiceResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final AtomicInteger invoiceSeq = new AtomicInteger(1);

    @Transactional
    public List<InvoiceResponse> getAllInvoices(InvoiceStatus status, Long customerId, String search) {
        List<Invoice> list;
        if (status != null && customerId != null) {
            list = invoiceRepository.findByCustomerId(customerId).stream()
                    .filter(i -> i.getStatus() == status)
                    .collect(Collectors.toList());
        } else if (status != null) {
            list = invoiceRepository.findByStatus(status);
        } else if (customerId != null) {
            list = invoiceRepository.findByCustomerId(customerId);
        } else {
            list = invoiceRepository.findAll();
        }

        LocalDate today = LocalDate.now();
        // Dynamic overdue detection: if due_date is past, balance > 0, and not already PAID or CANCELLED
        for (Invoice inv : list) {
            if (inv.getStatus() != InvoiceStatus.PAID &&
                inv.getStatus() != InvoiceStatus.CANCELLED &&
                inv.getStatus() != InvoiceStatus.OVERDUE &&
                inv.getBalanceDue() != null &&
                inv.getBalanceDue().compareTo(BigDecimal.ZERO) > 0 &&
                inv.getDueDate() != null &&
                inv.getDueDate().isBefore(today)) {
                inv.setStatus(InvoiceStatus.OVERDUE);
                invoiceRepository.save(inv);
            }
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream().filter(i ->
                    i.getInvoiceNumber().toLowerCase().contains(q) ||
                    (i.getCustomer() != null && i.getCustomer().getCompanyName().toLowerCase().contains(q)) ||
                    (i.getSubscription() != null && i.getSubscription().getSubscriptionNumber().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        // Sort descending by id (latest first)
        return list.stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<InvoiceResponse> getAllInvoices() {
        return getAllInvoices(null, null, null);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + id));
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceByNumber(String invoiceNumber) {
        Invoice invoice = invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with number: " + invoiceNumber));
        return InvoiceResponse.fromEntity(invoice);
    }

    @Transactional
    public InvoiceResponse confirmInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + id));

        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalStateException("Cannot confirm a cancelled invoice");
        }
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalStateException("Cannot confirm an already fully paid invoice");
        }
        invoice.setStatus(InvoiceStatus.CONFIRMED);
        return InvoiceResponse.fromEntity(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse cancelInvoice(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found with id: " + id));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalStateException("Cannot cancel an already fully paid invoice");
        }
        if (invoice.getAmountPaid() != null && invoice.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            throw new IllegalStateException(String.format("Cannot cancel an invoice with recorded payments ($%s)", invoice.getAmountPaid()));
        }
        invoice.setStatus(InvoiceStatus.CANCELLED);
        return InvoiceResponse.fromEntity(invoiceRepository.save(invoice));
    }

    public synchronized String generateNextInvoiceNumber() {
        int year = LocalDate.now().getYear();
        long count = invoiceRepository.count();
        int seq = Math.max((int) count + 1, invoiceSeq.getAndIncrement());

        String candidate = String.format("INV-%d-%04d", year, seq);
        while (invoiceRepository.findByInvoiceNumber(candidate).isPresent()) {
            seq = invoiceSeq.incrementAndGet();
            candidate = String.format("INV-%d-%04d", year, seq);
        }
        return candidate;
    }
}

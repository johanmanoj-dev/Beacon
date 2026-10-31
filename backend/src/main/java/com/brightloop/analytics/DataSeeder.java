package com.brightloop.analytics;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        try {
            seedAll();
        } catch (Exception e) {
            log.warn("Auto-seeding bypassed: {}", e.getMessage());
        }
    }

    public Map<String, Object> seedAll() {
        Map<String, Object> result = new HashMap<>();
        String hash = passwordEncoder.encode("Compliant@Pass123");

        log.info("Executing Brightloop Phase 4 Data Seeder...");

        try {
            // 1. Users
            jdbcTemplate.update(
                "INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES " +
                "(1, 'admin@brightloop.com', ?, 'System Administrator', 'ADMIN', true), " +
                "(2, 'staff@brightloop.com', ?, 'Bob Jenkins (Billing Lead)', 'STAFF', true), " +
                "(3, 'customer@acme.com', ?, 'Alice Walker', 'CUSTOMER', true), " +
                "(4, 'alice@retailcorp.com', ?, 'Alice RetailCorp', 'CUSTOMER', true) " +
                "ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)",
                hash, hash, hash, hash
            );

            // 2. Customers
            jdbcTemplate.update(
                "INSERT INTO customers (id, user_id, company_name, contact_email, phone, address) VALUES " +
                "(1, 3, 'Acme Software Labs', 'customer@acme.com', '+1 (555) 019-2834', '42 Innovation Way, Suite 300, San Francisco, CA'), " +
                "(2, 4, 'RetailCorp Ltd', 'alice@retailcorp.com', '+1 (555) 234-5678', '128 Market Street, Floor 4, New York, NY'), " +
                "(3, NULL, 'Apex Software Dynamics', 'billing@apexdynamics.io', '+1 (555) 876-5432', '500 Tech Boulevard, Austin, TX') " +
                "ON DUPLICATE KEY UPDATE company_name = VALUES(company_name)"
            );

            // 3. Products
            jdbcTemplate.update(
                "INSERT INTO products (id, name, product_type, sales_price, cost_price, notes) VALUES " +
                "(1, 'Cloud ERP Software Suite', 'SOFTWARE', 1000.00, 400.00, 'Enterprise ERP core subscription software'), " +
                "(2, 'Priority 24/7 SLA Support Add-on', 'ADDON', 350.00, 120.00, 'Dedicated 1-hour SLA phone & email support'), " +
                "(3, 'API Connector & Webhooks Engine', 'ADDON', 200.00, 50.00, 'High-volume external API synchronization endpoints') " +
                "ON DUPLICATE KEY UPDATE sales_price = VALUES(sales_price)"
            );

            // 4. Product Variants
            jdbcTemplate.update(
                "INSERT INTO product_variants (id, product_id, variant_name, price_adjustment) VALUES " +
                "(1, 1, 'Brand: Odoo', 560.00), " +
                "(2, 1, 'Brand: Standard', 0.00) " +
                "ON DUPLICATE KEY UPDATE price_adjustment = VALUES(price_adjustment)"
            );

            // 5. Plans
            jdbcTemplate.update(
                "INSERT INTO plans (id, name, billing_interval, base_price, min_quantity, start_date, can_pause) VALUES " +
                "(1, 'Monthly Pro Business Plan', 'MONTHLY', 1500.00, 1, '2026-01-01', true), " +
                "(2, 'Enterprise Yearly Plan', 'YEARLY', 15000.00, 5, '2026-01-01', true), " +
                "(3, 'Weekly Sprint Trial Plan', 'WEEKLY', 400.00, 1, '2026-01-01', true) " +
                "ON DUPLICATE KEY UPDATE base_price = VALUES(base_price)"
            );

            // 6. Tax Rates
            jdbcTemplate.update(
                "INSERT INTO tax_rates (id, name, rate_percent, is_active) VALUES " +
                "(1, 'Standard GST 18%', 18.00, true), " +
                "(2, 'Zero-Rated Export', 0.00, true) " +
                "ON DUPLICATE KEY UPDATE rate_percent = VALUES(rate_percent)"
            );

            // 7. Discounts
            jdbcTemplate.update(
                "INSERT INTO discounts (id, code, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, usage_limit, times_used, applies_to) VALUES " +
                "(1, 'VOL10', 'PERCENTAGE', 10.00, 5000.00, 5, '2026-01-01', '2027-12-31', 100, 1, 'SUBSCRIPTION'), " +
                "(2, 'LAUNCH500', 'FIXED_AMOUNT', 500.00, 2000.00, 1, '2026-01-01', '2027-12-31', 50, 0, 'SUBSCRIPTION') " +
                "ON DUPLICATE KEY UPDATE value = VALUES(value)"
            );

            // 8. Quotation Templates
            jdbcTemplate.update(
                "INSERT INTO quotation_templates (id, name, plan_id, validity_days, notes) VALUES " +
                "(1, 'Enterprise Quotation Template', 1, 30, 'Standard enterprise deployment with support options') " +
                "ON DUPLICATE KEY UPDATE name = VALUES(name)"
            );

            // 9. Quotations
            jdbcTemplate.update(
                "INSERT INTO quotations (id, quotation_number, customer_id, plan_id, valid_until, status, subtotal, tax_amount, total_amount) VALUES " +
                "(1, 'QT-2026-0001', 1, 1, '2026-11-15', 'CONVERTED', 8150.00, 1467.00, 9617.00), " +
                "(2, 'QT-2026-0002', 2, 1, '2026-11-30', 'CONFIRMED', 1322.03, 237.97, 1560.00) " +
                "ON DUPLICATE KEY UPDATE status = VALUES(status)"
            );

            // 10. Subscriptions
            jdbcTemplate.update(
                "INSERT INTO subscriptions (id, subscription_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms) VALUES " +
                "(1, 'SUB-2026-0001', 1, 1, 'ACTIVE', '2026-10-01', '2027-09-30', '2026-11-01', 'Net 15'), " +
                "(2, 'SUB-2026-0002', 2, 1, 'ACTIVE', '2026-10-15', '2027-10-14', '2026-11-15', 'Net 15'), " +
                "(3, 'SUB-2026-0003', 3, 1, 'PAUSED', '2026-08-01', '2027-07-31', '2026-12-01', 'Net 30') " +
                "ON DUPLICATE KEY UPDATE status = VALUES(status)"
            );

            // Subscription Items
            jdbcTemplate.update(
                "INSERT INTO subscription_items (id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate_percent, line_total) VALUES " +
                "(1, 1, 1, 1, 5, 1560.00, 18.00, 9204.00), " +
                "(2, 1, 2, NULL, 1, 350.00, 18.00, 413.00), " +
                "(3, 2, 1, 1, 1, 1560.00, 18.00, 1840.80) " +
                "ON DUPLICATE KEY UPDATE line_total = VALUES(line_total)"
            );

            // 11. Invoices
            jdbcTemplate.update(
                "INSERT INTO invoices (id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, issue_date, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, balance_due, status) VALUES " +
                "(1, 'INV-2026-0001', 2, 2, '2026-10-01', '2026-10-31', '2026-10-01', '2026-10-15', 1322.03, 237.97, 0.00, 1560.00, 500.00, 1060.00, 'PARTIALLY_PAID'), " +
                "(2, 'INV-2026-0002', 1, 1, '2026-09-01', '2026-09-30', '2026-09-01', '2026-09-15', 400.00, 72.00, 0.00, 472.00, 472.00, 0.00, 'PAID'), " +
                "(3, 'INV-2026-0003', 3, 3, '2026-09-15', '2026-10-14', '2026-09-15', '2026-09-30', 1796.61, 323.39, 0.00, 2120.00, 0.00, 2120.00, 'OVERDUE'), " +
                "(4, 'INV-2026-0004', 1, 1, '2026-10-01', '2026-10-31', '2026-10-01', '2026-10-16', 8150.00, 1467.00, 0.00, 9617.00, 0.00, 9617.00, 'CONFIRMED') " +
                "ON DUPLICATE KEY UPDATE status = VALUES(status), amount_paid = VALUES(amount_paid), balance_due = VALUES(balance_due)"
            );

            // Invoice items
            jdbcTemplate.update(
                "INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate_percent, tax_amount, discount_amount, line_total) VALUES " +
                "(1, 1, 'Cloud ERP Software Suite with Brand: Odoo', 1, 1322.03, 18.00, 237.97, 0.00, 1560.00), " +
                "(2, 2, 'API Connector & Webhooks Engine (2 endpoints)', 2, 200.00, 18.00, 72.00, 0.00, 472.00), " +
                "(3, 3, 'Enterprise Cloud Pro License', 1, 1796.61, 18.00, 323.39, 0.00, 2120.00), " +
                "(4, 4, 'Cloud ERP Software Suite with Brand: Odoo (5 seats)', 5, 1560.00, 18.00, 1404.00, 0.00, 9204.00), " +
                "(5, 4, 'Priority 24/7 SLA Support Add-on', 1, 350.00, 18.00, 63.00, 0.00, 413.00) " +
                "ON DUPLICATE KEY UPDATE line_total = VALUES(line_total)"
            );

            // 12. Payments
            jdbcTemplate.update(
                "INSERT INTO payments (id, invoice_id, amount, payment_method, reference_number, payment_date, notes, recorded_by) VALUES " +
                "(1, 1, 500.00, 'UPI', 'UPI/AXIS/98129031', '2026-10-16 11:30:00', 'Partial manual payment recorded by staff', 2), " +
                "(2, 2, 472.00, 'SIMULATED_GATEWAY', 'TXN-SIM-2026-9912', '2026-09-15 12:00:00', 'Full invoice settlement via customer checkout', NULL) " +
                "ON DUPLICATE KEY UPDATE amount = VALUES(amount)"
            );

            log.info("Database seeding successfully completed with full scenario dataset.");
            result.put("status", "SUCCESS");
            result.put("message", "Database successfully seeded with demo users, products, variants, plans, subscriptions, and invoices.");
        } catch (Exception ex) {
            log.error("Failed to seed database: {}", ex.getMessage());
            result.put("status", "ERROR");
            result.put("message", ex.getMessage());
        }

        return result;
    }
}

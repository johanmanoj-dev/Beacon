-- Brightloop Subscription Management System — Master Baseline Demo Seed
-- Merged Phase 4 Dataset (Johan's Core Subs + Goutham's Analytics & Invoicing)
-- Compatible with MySQL 8.0+ / MariaDB 10.4+

USE brightloop_db;

-- 1. Users & Authentication
-- Passwords: All accounts set to 'Compliant@Pass123' / 'Admin123!' (BCrypt hash)
INSERT INTO users (id, email, password_hash, full_name, role, is_active, created_at) VALUES
(1, 'admin@brightloop.com', '$2a$10$b2PwlxlP60AhynsBzWRbZOC1hBI0yq8T..Q9IwUM7Fv0BR2sdggk6', 'Johan (System Admin)', 'ADMIN', true, '2026-01-01 00:00:00'),
(2, 'staff@brightloop.com', '$2a$10$b2PwlxlP60AhynsBzWRbZOC1hBI0yq8T..Q9IwUM7Fv0BR2sdggk6', 'Bob Jenkins (Billing Lead)', 'STAFF', true, '2026-01-01 00:00:00'),
(3, 'customer@acme.com', '$2a$10$b2PwlxlP60AhynsBzWRbZOC1hBI0yq8T..Q9IwUM7Fv0BR2sdggk6', 'Acme Buyer', 'CUSTOMER', true, '2026-01-01 00:00:00'),
(4, 'alice@retailcorp.com', '$2a$10$b2PwlxlP60AhynsBzWRbZOC1hBI0yq8T..Q9IwUM7Fv0BR2sdggk6', 'Alice Retailer', 'CUSTOMER', true, '2026-01-01 00:00:00')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role);

-- 2. Customers
INSERT INTO customers (id, user_id, company_name, contact_email, phone, address, created_at) VALUES
(1, 3, 'Acme Innovations Corp', 'customer@acme.com', '+1 (555) 019-2834', '100 Innovation Way, Suite 400, Austin, TX 78701', '2026-01-01 00:00:00'),
(2, 4, 'RetailCorp Global Inc', 'alice@retailcorp.com', '+1 (555) 948-1122', '450 Commerce Blvd, Chicago, IL 60601', '2026-01-01 00:00:00'),
(3, NULL, 'Apex Software Dynamics', 'billing@apexdynamics.io', '+1 (555) 876-5432', '500 Tech Boulevard, Austin, TX 78701', '2026-01-01 00:00:00')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), contact_email = VALUES(contact_email);

-- 3. Products
INSERT INTO products (id, name, product_type, sales_price, cost_price, notes, created_at) VALUES
(1, 'Cloud ERP Software', 'SOFTWARE', 1000.00, 400.00, 'Complete cloud-native enterprise resource planning suite', '2026-01-01 00:00:00'),
(2, 'Priority 24/7 Support Add-on', 'ADDON', 250.00, 50.00, 'Dedicated enterprise TAM with 1-hour SLA response', '2026-01-01 00:00:00'),
(3, 'Custom Implementation Service', 'SERVICE', 1200.00, 600.00, 'Hands-on architecture setup and data migration sprint', '2026-01-01 00:00:00'),
(4, 'API Connector & Webhooks Engine', 'ADDON', 200.00, 50.00, 'High-volume external API synchronization endpoints', '2026-01-01 00:00:00')
ON DUPLICATE KEY UPDATE sales_price = VALUES(sales_price), name = VALUES(name);

-- 4. Product Variants (e.g. Brand: Odoo +$560 price bump)
INSERT INTO product_variants (id, product_id, variant_name, price_adjustment) VALUES
(1, 1, 'Brand: Odoo', 560.00),
(2, 1, 'Brand: SAP Integration', 850.00),
(3, 1, 'Brand: Standard', 0.00)
ON DUPLICATE KEY UPDATE price_adjustment = VALUES(price_adjustment);

-- 5. Plans
INSERT INTO plans (id, name, billing_interval, base_price, min_quantity, start_date, end_date, auto_close_on_end, can_pause, created_at) VALUES
(1, 'Monthly Business Plan', 'MONTHLY', 1500.00, 1, '2026-01-01', NULL, false, true, '2026-01-01 00:00:00'),
(2, 'Yearly Enterprise Plan', 'YEARLY', 14400.00, 5, '2026-01-01', NULL, false, true, '2026-01-01 00:00:00'),
(3, '90-Day Seasonal Pilot', 'MONTHLY', 1200.00, 1, '2026-01-01', NULL, true, false, '2026-01-01 00:00:00')
ON DUPLICATE KEY UPDATE base_price = VALUES(base_price), name = VALUES(name);

-- 6. Tax Rates
INSERT INTO tax_rates (id, name, rate_percent, is_active) VALUES
(1, 'Standard GST 18%', 18.00, true),
(2, 'Zero-Rated Export', 0.00, true)
ON DUPLICATE KEY UPDATE rate_percent = VALUES(rate_percent);

-- 7. Discounts
INSERT INTO discounts (id, code, discount_type, value, min_purchase_amount, min_quantity, start_date, end_date, usage_limit, times_used, applies_to, product_id) VALUES
(1, 'VOL10', 'PERCENTAGE', 10.00, 5000.00, 5, '2026-01-01', '2027-12-31', 100, 1, 'SUBSCRIPTION', NULL),
(2, 'LAUNCH500', 'FIXED_AMOUNT', 500.00, 2000.00, 1, '2026-01-01', '2027-12-31', 50, 0, 'SUBSCRIPTION', NULL)
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- 8. Quotation Templates
INSERT INTO quotation_templates (id, name, plan_id, validity_days, notes) VALUES
(1, 'Enterprise ERP Bundle', 1, 30, 'Pre-configured quote with core Cloud ERP and Net 15 terms'),
(2, 'Annual Volume License', 2, 45, 'Tier-1 volume enterprise quote')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 9. Quotations & Items
INSERT INTO quotations (id, quotation_number, customer_id, plan_id, valid_until, status, subtotal, tax_amount, total_amount, created_at) VALUES
(1, 'QUO-2026-0001', 2, 1, '2026-11-30', 'CONFIRMED', 3120.00, 561.60, 3681.60, '2026-10-01 10:00:00'),
(2, 'QUO-2026-0002', 1, 1, '2026-11-25', 'DRAFT', 750.00, 135.00, 885.00, '2026-10-15 14:00:00')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO quotation_items (id, quotation_id, product_id, variant_id, quantity, unit_price, tax_rate_percent, line_total) VALUES
(1, 1, 1, 1, 2, 1560.00, 18.00, 3120.00),
(2, 2, 2, NULL, 3, 250.00, 18.00, 750.00)
ON DUPLICATE KEY UPDATE line_total = VALUES(line_total);

-- 10. Subscriptions & Items
INSERT INTO subscriptions (id, subscription_number, customer_id, plan_id, status, start_date, expiry_date, next_billing_date, payment_terms, created_at) VALUES
(1, 'SUB-2026-0001', 1, 1, 'ACTIVE', '2026-10-01', '2027-09-30', '2026-11-01', 'Net 15', '2026-10-01 10:00:00'),
(2, 'SUB-2026-0002', 2, 1, 'ACTIVE', '2026-10-15', '2027-10-14', '2026-11-15', 'Net 15', '2026-10-15 14:00:00'),
(3, 'SUB-2026-0003', 3, 1, 'PAUSED', '2026-08-01', '2027-07-31', '2026-12-01', 'Net 30', '2026-08-01 09:00:00')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO subscription_items (id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate_percent, discount_id, line_total) VALUES
(1, 1, 1, 1, 5, 1560.00, 18.00, NULL, 9204.00),
(2, 1, 2, NULL, 1, 250.00, 18.00, NULL, 295.00),
(3, 2, 1, 1, 1, 1560.00, 18.00, NULL, 1840.80)
ON DUPLICATE KEY UPDATE line_total = VALUES(line_total);

-- 11. Invoices & Items
INSERT INTO invoices (id, invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, issue_date, due_date, subtotal, tax_amount, discount_amount, total_amount, amount_paid, balance_due, status, created_at) VALUES
(1, 'INV-2026-0001', 2, 2, '2026-10-01', '2026-10-31', '2026-10-01', '2026-10-15', 1322.03, 237.97, 0.00, 1560.00, 500.00, 1060.00, 'PARTIALLY_PAID', '2026-10-01 10:00:00'),
(2, 'INV-2026-0002', 1, 1, '2026-09-01', '2026-09-30', '2026-09-01', '2026-09-15', 400.00, 72.00, 0.00, 472.00, 472.00, 0.00, 'PAID', '2026-09-01 10:00:00'),
(3, 'INV-2026-0003', 3, 3, '2026-09-15', '2026-10-14', '2026-09-15', '2026-09-30', 1796.61, 323.39, 0.00, 2120.00, 0.00, 2120.00, 'OVERDUE', '2026-09-15 09:00:00'),
(4, 'INV-2026-0004', 1, 1, '2026-10-01', '2026-10-31', '2026-10-01', '2026-10-16', 8150.00, 1467.00, 0.00, 9617.00, 0.00, 9617.00, 'CONFIRMED', '2026-10-01 10:00:00')
ON DUPLICATE KEY UPDATE status = VALUES(status), amount_paid = VALUES(amount_paid), balance_due = VALUES(balance_due);

INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, tax_rate_percent, tax_amount, discount_amount, line_total) VALUES
(1, 1, 'Cloud ERP Software Suite with Brand: Odoo', 1, 1322.03, 18.00, 237.97, 0.00, 1560.00),
(2, 2, 'API Connector & Webhooks Engine (2 endpoints)', 2, 200.00, 18.00, 72.00, 0.00, 472.00),
(3, 3, 'Enterprise Cloud Pro License', 1, 1796.61, 18.00, 323.39, 0.00, 2120.00),
(4, 4, 'Cloud ERP Software Suite with Brand: Odoo (5 seats)', 5, 1560.00, 18.00, 1404.00, 0.00, 9204.00),
(5, 4, 'Priority 24/7 SLA Support Add-on', 1, 350.00, 18.00, 63.00, 0.00, 413.00)
ON DUPLICATE KEY UPDATE line_total = VALUES(line_total);

-- 12. Payments
INSERT INTO payments (id, invoice_id, amount, payment_method, reference_number, payment_date, notes, recorded_by, created_at) VALUES
(1, 1, 500.00, 'UPI', 'UPI/AXIS/98129031', '2026-10-16 11:30:00', 'Partial manual payment recorded by staff', 2, '2026-10-16 11:30:00'),
(2, 2, 472.00, 'SIMULATED_GATEWAY', 'TXN-SIM-2026-9912', '2026-09-15 12:00:00', 'Full invoice settlement via customer self-service checkout', NULL, '2026-09-15 12:00:00')
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

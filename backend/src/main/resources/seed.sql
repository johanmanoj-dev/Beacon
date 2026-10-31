-- Brightloop Subscription System: Phase 4 Baseline Data Seed
-- Pre-hashed bcrypt for 'Admin123!', 'Staff123!', 'Customer123!', 'Alice123!'

USE brightloop_db;

-- 1. Users
INSERT IGNORE INTO users (id, email, password_hash, full_name, role, is_active) VALUES
(1, 'admin@brightloop.com', '$2a$10$wE9XW.8VnUuX4Qe3Z3X7eeO97Qsm.5r08CqYfM6x79rZ55n8J0QyK', 'Johan (System Admin)', 'ADMIN', TRUE),
(2, 'staff@brightloop.com', '$2a$10$wE9XW.8VnUuX4Qe3Z3X7eeO97Qsm.5r08CqYfM6x79rZ55n8J0QyK', 'Bob Jenkins (Staff)', 'STAFF', TRUE),
(3, 'customer@acme.com', '$2a$10$wE9XW.8VnUuX4Qe3Z3X7eeO97Qsm.5r08CqYfM6x79rZ55n8J0QyK', 'Acme Buyer', 'CUSTOMER', TRUE),
(4, 'alice@retailcorp.com', '$2a$10$wE9XW.8VnUuX4Qe3Z3X7eeO97Qsm.5r08CqYfM6x79rZ55n8J0QyK', 'Alice Retailer', 'CUSTOMER', TRUE);

-- 2. Customers
INSERT IGNORE INTO customers (id, user_id, company_name, contact_email, phone, address) VALUES
(1, 3, 'Acme Innovations Corp', 'customer@acme.com', '+1 (555) 019-2834', '100 Innovation Way, Suite 400, Austin, TX 78701'),
(2, 4, 'RetailCorp Global Inc', 'alice@retailcorp.com', '+1 (555) 948-1122', '450 Commerce Blvd, Chicago, IL 60601');

-- 3. Products
INSERT IGNORE INTO products (id, name, product_type, sales_price, cost_price, notes) VALUES
(1, 'Cloud ERP Software', 'SOFTWARE', 1000.00, 400.00, 'Complete cloud-native enterprise resource planning suite'),
(2, 'Priority 24/7 Support Add-on', 'ADDON', 250.00, 50.00, 'Dedicated enterprise TAM with 1-hour SLA response'),
(3, 'Custom Implementation Service', 'SERVICE', 1200.00, 600.00, 'Hands-on architecture setup and data migration sprint');

-- 4. Product Variants
INSERT IGNORE INTO product_variants (id, product_id, variant_name, price_adjustment) VALUES
(1, 1, 'Brand: Odoo', 560.00),
(2, 1, 'Brand: SAP Integration', 850.00);

-- 5. Plans
INSERT IGNORE INTO plans (id, name, billing_interval, base_price, min_quantity, start_date, auto_close_on_end, can_pause) VALUES
(1, 'Monthly Business Plan', 'MONTHLY', 1500.00, 1, '2026-08-01', FALSE, TRUE),
(2, 'Yearly Enterprise Plan', 'YEARLY', 14400.00, 5, '2026-05-01', FALSE, TRUE),
(3, '90-Day Seasonal Pilot', 'MONTHLY', 1200.00, 1, '2026-09-01', TRUE, FALSE);

-- 6. Quotation Templates
INSERT IGNORE INTO quotation_templates (id, name, plan_id, validity_days, notes) VALUES
(1, 'Enterprise ERP Bundle', 1, 30, 'Pre-configured quote with core Cloud ERP and Net 15 terms'),
(2, 'Annual Volume License', 2, 45, 'Tier-1 volume enterprise quote');

-- 7. Quotations & Quotation Items
INSERT IGNORE INTO quotations (id, quotation_number, customer_id, plan_id, valid_until, status, subtotal, tax_amount, total_amount) VALUES
(1, 'QUO-2026-0001', 2, 1, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'CONFIRMED', 3120.00, 561.60, 3681.60),
(2, 'QUO-2026-0002', 1, 1, DATE_ADD(CURRENT_DATE, INTERVAL 25 DAY), 'DRAFT', 750.00, 135.00, 885.00);

INSERT IGNORE INTO quotation_items (id, quotation_id, product_id, variant_id, quantity, unit_price, tax_rate_percent, line_total) VALUES
(1, 1, 1, 1, 2, 1560.00, 18.00, 3120.00),
(2, 2, 2, NULL, 3, 250.00, 18.00, 750.00);

-- 8. Subscriptions & Subscription Items
INSERT IGNORE INTO subscriptions (id, subscription_number, customer_id, plan_id, status, start_date, next_billing_date, payment_terms) VALUES
(1, 'SUB-2026-0001', 1, 1, 'ACTIVE', DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH), CURRENT_DATE, 'Net 15'),
(2, 'SUB-2026-0002', 2, 1, 'PAUSED', DATE_SUB(CURRENT_DATE, INTERVAL 2 MONTH), DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 'Net 15');

INSERT IGNORE INTO subscription_items (id, subscription_id, product_id, variant_id, quantity, unit_price, tax_rate_percent, line_total) VALUES
(1, 1, 1, 1, 1, 1560.00, 18.00, 1560.00),
(2, 1, 2, NULL, 1, 250.00, 18.00, 250.00),
(3, 2, 1, NULL, 5, 1000.00, 18.00, 5000.00);

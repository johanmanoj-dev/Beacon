package com.brightloop.catalogue;

import com.brightloop.customers.Customer;
import com.brightloop.customers.CustomerRepository;
import com.brightloop.subscriptions.*;
import com.brightloop.users.Role;
import com.brightloop.users.User;
import com.brightloop.users.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final PlanRepository planRepository;
    private final QuotationTemplateRepository templateRepository;
    private final QuotationRepository quotationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Database is empty. Automatically executing initial seed for Johan's core catalogue & subscriptions...");
            seedData(false);
        } else {
            log.info("Database already contains data ({} users). Automatic seeding skipped.", userRepository.count());
        }
    }

    @Transactional
    public Map<String, Object> seedData(boolean force) {
        if (!force && userRepository.count() > 0) {
            Map<String, Object> resp = new HashMap<>();
            resp.put("status", "SKIPPED");
            resp.put("message", "Database already seeded. Use ?force=true to re-seed or add missing baseline records.");
            return resp;
        }

        log.info("Seeding initial users, catalogue, and subscription test scenarios...");

        // 1. SEED USERS
        User admin = userRepository.findByEmail("admin@brightloop.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .email("admin@brightloop.com")
                        .fullName("Johan (System Admin)")
                        .passwordHash(passwordEncoder.encode("Admin123!"))
                        .role(Role.ADMIN)
                        .isActive(true)
                        .build())
        );

        User staff = userRepository.findByEmail("staff@brightloop.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .email("staff@brightloop.com")
                        .fullName("Bob Jenkins (Staff)")
                        .passwordHash(passwordEncoder.encode("Staff123!"))
                        .role(Role.STAFF)
                        .isActive(true)
                        .build())
        );

        User customerUser1 = userRepository.findByEmail("customer@acme.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .email("customer@acme.com")
                        .fullName("Acme Buyer")
                        .passwordHash(passwordEncoder.encode("Customer123!"))
                        .role(Role.CUSTOMER)
                        .isActive(true)
                        .build())
        );

        User customerUser2 = userRepository.findByEmail("alice@retailcorp.com").orElseGet(() ->
                userRepository.save(User.builder()
                        .email("alice@retailcorp.com")
                        .fullName("Alice Retailer")
                        .passwordHash(passwordEncoder.encode("Alice123!"))
                        .role(Role.CUSTOMER)
                        .isActive(true)
                        .build())
        );

        // 2. SEED CUSTOMERS
        Customer acme = customerRepository.findByContactEmail("customer@acme.com").orElseGet(() ->
                customerRepository.save(Customer.builder()
                        .user(customerUser1)
                        .companyName("Acme Innovations Corp")
                        .contactEmail("customer@acme.com")
                        .phone("+1 (555) 019-2834")
                        .address("100 Innovation Way, Suite 400, Austin, TX 78701")
                        .build())
        );

        Customer retailCorp = customerRepository.findByContactEmail("alice@retailcorp.com").orElseGet(() ->
                customerRepository.save(Customer.builder()
                        .user(customerUser2)
                        .companyName("RetailCorp Global Inc")
                        .contactEmail("alice@retailcorp.com")
                        .phone("+1 (555) 948-1122")
                        .address("450 Commerce Blvd, Chicago, IL 60601")
                        .build())
        );

        // 3. SEED PRODUCTS & VARIANTS
        Product cloudErp = productRepository.findAll().stream()
                .filter(p -> "Cloud ERP Software".equalsIgnoreCase(p.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Product p = Product.builder()
                            .name("Cloud ERP Software")
                            .productType(ProductType.SOFTWARE)
                            .salesPrice(new BigDecimal("1000.00"))
                            .costPrice(new BigDecimal("400.00"))
                            .notes("Complete cloud-native enterprise resource planning suite")
                            .variants(new ArrayList<>())
                            .build();

                    ProductVariant odooVariant = ProductVariant.builder()
                            .product(p)
                            .variantName("Brand: Odoo")
                            .priceAdjustment(new BigDecimal("560.00"))
                            .build();

                    ProductVariant sapVariant = ProductVariant.builder()
                            .product(p)
                            .variantName("Brand: SAP Integration")
                            .priceAdjustment(new BigDecimal("850.00"))
                            .build();

                    p.getVariants().add(odooVariant);
                    p.getVariants().add(sapVariant);
                    return productRepository.save(p);
                });

        Product supportAddon = productRepository.findAll().stream()
                .filter(p -> "Priority 24/7 Support Add-on".equalsIgnoreCase(p.getName()))
                .findFirst()
                .orElseGet(() -> productRepository.save(Product.builder()
                        .name("Priority 24/7 Support Add-on")
                        .productType(ProductType.ADDON)
                        .salesPrice(new BigDecimal("250.00"))
                        .costPrice(new BigDecimal("50.00"))
                        .notes("Dedicated enterprise TAM with 1-hour SLA response")
                        .variants(new ArrayList<>())
                        .build())
                );

        Product customService = productRepository.findAll().stream()
                .filter(p -> "Custom Implementation Service".equalsIgnoreCase(p.getName()))
                .findFirst()
                .orElseGet(() -> productRepository.save(Product.builder()
                        .name("Custom Implementation Service")
                        .productType(ProductType.SERVICE)
                        .salesPrice(new BigDecimal("1200.00"))
                        .costPrice(new BigDecimal("600.00"))
                        .notes("Hands-on architecture setup and data migration sprint")
                        .variants(new ArrayList<>())
                        .build())
                );

        // 4. SEED PLANS
        Plan monthlyBusiness = planRepository.findAll().stream()
                .filter(p -> "Monthly Business Plan".equalsIgnoreCase(p.getName()))
                .findFirst()
                .orElseGet(() -> planRepository.save(Plan.builder()
                        .name("Monthly Business Plan")
                        .billingInterval(BillingInterval.MONTHLY)
                        .basePrice(new BigDecimal("1500.00"))
                        .minQuantity(1)
                        .startDate(LocalDate.now().minusMonths(3))
                        .autoCloseOnEnd(false)
                        .canPause(true)
                        .build())
                );

        Plan yearlyEnterprise = planRepository.findAll().stream()
                .filter(p -> "Yearly Enterprise Plan".equalsIgnoreCase(p.getName()))
                .findFirst()
                .orElseGet(() -> planRepository.save(Plan.builder()
                        .name("Yearly Enterprise Plan")
                        .billingInterval(BillingInterval.YEARLY)
                        .basePrice(new BigDecimal("14400.00"))
                        .minQuantity(5)
                        .startDate(LocalDate.now().minusMonths(6))
                        .autoCloseOnEnd(false)
                        .canPause(true)
                        .build())
                );

        Plan seasonalPilot = planRepository.findAll().stream()
                .filter(p -> "90-Day Seasonal Pilot".equalsIgnoreCase(p.getName()))
                .findFirst()
                .orElseGet(() -> planRepository.save(Plan.builder()
                        .name("90-Day Seasonal Pilot")
                        .billingInterval(BillingInterval.MONTHLY)
                        .basePrice(new BigDecimal("1200.00"))
                        .minQuantity(1)
                        .startDate(LocalDate.now().minusDays(60))
                        .endDate(LocalDate.now().plusDays(30))
                        .autoCloseOnEnd(true)
                        .canPause(false)
                        .build())
                );

        // 5. SEED QUOTATION TEMPLATES
        QuotationTemplate erpTemplate = templateRepository.findAll().stream()
                .filter(t -> "Enterprise ERP Bundle".equalsIgnoreCase(t.getName()))
                .findFirst()
                .orElseGet(() -> templateRepository.save(QuotationTemplate.builder()
                        .name("Enterprise ERP Bundle")
                        .plan(monthlyBusiness)
                        .validityDays(30)
                        .notes("Pre-configured quote with core Cloud ERP and Net 15 terms")
                        .build())
                );

        // 6. SEED SAMPLE QUOTATIONS
        if (quotationRepository.count() == 0) {
            ProductVariant odooVar = cloudErp.getVariants().stream()
                    .filter(v -> v.getVariantName().contains("Odoo"))
                    .findFirst()
                    .orElse(null);

            BigDecimal unitPrice = odooVar != null ? cloudErp.getSalesPrice().add(odooVar.getPriceAdjustment()) : cloudErp.getSalesPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(2));
            BigDecimal taxAmount = subtotal.multiply(new BigDecimal("18.00")).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);

            Quotation q1 = Quotation.builder()
                    .quotationNumber("QUO-2026-0001")
                    .customer(retailCorp)
                    .plan(monthlyBusiness)
                    .validUntil(LocalDate.now().plusDays(30))
                    .status(QuotationStatus.CONFIRMED)
                    .subtotal(subtotal)
                    .taxAmount(taxAmount)
                    .totalAmount(subtotal.add(taxAmount))
                    .items(new ArrayList<>())
                    .build();

            QuotationItem qi1 = QuotationItem.builder()
                    .quotation(q1)
                    .product(cloudErp)
                    .variant(odooVar)
                    .quantity(2)
                    .unitPrice(unitPrice)
                    .taxRatePercent(new BigDecimal("18.00"))
                    .lineTotal(subtotal)
                    .build();
            q1.getItems().add(qi1);
            quotationRepository.save(q1);

            // Draft Quotation for Acme
            BigDecimal acmeSub = supportAddon.getSalesPrice().multiply(BigDecimal.valueOf(3));
            BigDecimal acmeTax = acmeSub.multiply(new BigDecimal("18.00")).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);

            Quotation q2 = Quotation.builder()
                    .quotationNumber("QUO-2026-0002")
                    .customer(acme)
                    .plan(monthlyBusiness)
                    .validUntil(LocalDate.now().plusDays(25))
                    .status(QuotationStatus.DRAFT)
                    .subtotal(acmeSub)
                    .taxAmount(acmeTax)
                    .totalAmount(acmeSub.add(acmeTax))
                    .items(new ArrayList<>())
                    .build();

            QuotationItem qi2 = QuotationItem.builder()
                    .quotation(q2)
                    .product(supportAddon)
                    .quantity(3)
                    .unitPrice(supportAddon.getSalesPrice())
                    .taxRatePercent(new BigDecimal("18.00"))
                    .lineTotal(acmeSub)
                    .build();
            q2.getItems().add(qi2);
            quotationRepository.save(q2);
        }

        // 7. SEED ACTIVE AND PAUSED SUBSCRIPTIONS
        if (subscriptionRepository.count() == 0) {
            ProductVariant odooVar = cloudErp.getVariants().stream()
                    .filter(v -> v.getVariantName().contains("Odoo"))
                    .findFirst()
                    .orElse(null);

            // Subscription 1: Due for billing today! (Critical for Elsa's recurring billing demo!)
            Subscription sub1 = Subscription.builder()
                    .subscriptionNumber("SUB-2026-0001")
                    .customer(acme)
                    .plan(monthlyBusiness)
                    .status(SubscriptionStatus.ACTIVE)
                    .startDate(LocalDate.now().minusMonths(1))
                    .nextBillingDate(LocalDate.now()) // Due today!
                    .paymentTerms("Net 15")
                    .items(new ArrayList<>())
                    .build();

            BigDecimal price = odooVar != null ? cloudErp.getSalesPrice().add(odooVar.getPriceAdjustment()) : cloudErp.getSalesPrice();
            SubscriptionItem si1 = SubscriptionItem.builder()
                    .subscription(sub1)
                    .product(cloudErp)
                    .variant(odooVar)
                    .quantity(1)
                    .unitPrice(price)
                    .taxRatePercent(new BigDecimal("18.00"))
                    .lineTotal(price)
                    .build();

            SubscriptionItem si2 = SubscriptionItem.builder()
                    .subscription(sub1)
                    .product(supportAddon)
                    .quantity(1)
                    .unitPrice(supportAddon.getSalesPrice())
                    .taxRatePercent(new BigDecimal("18.00"))
                    .lineTotal(supportAddon.getSalesPrice())
                    .build();

            sub1.getItems().add(si1);
            sub1.getItems().add(si2);
            subscriptionRepository.save(sub1);

            // Subscription 2: Paused
            Subscription sub2 = Subscription.builder()
                    .subscriptionNumber("SUB-2026-0002")
                    .customer(retailCorp)
                    .plan(monthlyBusiness)
                    .status(SubscriptionStatus.PAUSED)
                    .startDate(LocalDate.now().minusMonths(2))
                    .nextBillingDate(LocalDate.now().plusDays(15))
                    .paymentTerms("Net 15")
                    .items(new ArrayList<>())
                    .build();

            SubscriptionItem si3 = SubscriptionItem.builder()
                    .subscription(sub2)
                    .product(cloudErp)
                    .quantity(5)
                    .unitPrice(cloudErp.getSalesPrice())
                    .taxRatePercent(new BigDecimal("18.00"))
                    .lineTotal(cloudErp.getSalesPrice().multiply(BigDecimal.valueOf(5)))
                    .build();

            sub2.getItems().add(si3);
            subscriptionRepository.save(sub2);
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "SUCCESS");
        resp.put("message", "Database successfully seeded with demo baseline (Users, Customers, Catalogue, Quotations, Subscriptions)!");
        resp.put("users_count", userRepository.count());
        resp.put("customers_count", customerRepository.count());
        resp.put("products_count", productRepository.count());
        resp.put("plans_count", planRepository.count());
        resp.put("quotations_count", quotationRepository.count());
        resp.put("subscriptions_count", subscriptionRepository.count());
        return resp;
    }
}

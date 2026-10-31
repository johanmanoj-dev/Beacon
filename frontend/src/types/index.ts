export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: number;
  userId?: number | null;
  userFullName?: string;
  userEmail?: string;
  companyName: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export type ProductType = 'SOFTWARE' | 'ADDON' | 'SERVICE';

export interface ProductVariant {
  id: number;
  productId: number;
  variantName: string;
  priceAdjustment: number;
}

export interface Product {
  id: number;
  name: string;
  productType: ProductType;
  salesPrice: number;
  costPrice: number;
  notes?: string;
  variants?: ProductVariant[];
  createdAt: string;
}

export type BillingInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Plan {
  id: number;
  name: string;
  billingInterval: BillingInterval;
  basePrice: number;
  minQuantity: number;
  startDate?: string;
  endDate?: string;
  autoCloseOnEnd: boolean;
  canPause: boolean;
  createdAt: string;
}

export interface TaxRate {
  id: number;
  name: string;
  ratePercent: number;
  isActive: boolean;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type DiscountScope = 'SUBSCRIPTION' | 'PRODUCT';

export interface Discount {
  id: number;
  code: string;
  discountType: DiscountType;
  value: number;
  minPurchaseAmount: number;
  minQuantity: number;
  startDate?: string;
  endDate?: string;
  usageLimit: number;
  timesUsed: number;
  appliesTo: DiscountScope;
  productId?: number | null;
}

export type QuotationStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'CONVERTED';

export interface QuotationTemplate {
  id: number;
  name: string;
  planId: number;
  planName?: string;
  billingInterval?: string;
  validityDays: number;
  notes?: string;
}

export interface QuotationItem {
  id?: number;
  productId: number;
  productName?: string;
  variantId?: number | null;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  lineTotal: number;
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  planId: number;
  planName?: string;
  billingInterval?: string;
  validUntil: string;
  status: QuotationStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  items: QuotationItem[];
  createdAt: string;
}

export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export interface SubscriptionItem {
  id?: number;
  productId: number;
  productName?: string;
  variantId?: number | null;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  lineTotal: number;
}

export interface Subscription {
  id: number;
  subscriptionNumber: string;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  planId: number;
  planName?: string;
  billingInterval?: string;
  canPause?: boolean;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate?: string;
  nextBillingDate: string;
  paymentTerms: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  items: SubscriptionItem[];
  createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  taxAmount: number;
  discountAmount: number;
  lineTotal: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  subscriptionId: number;
  subscriptionNumber?: string;
  customerId: number;
  customerName?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  createdAt: string;
}

export type PaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CREDIT_CARD' | 'SIMULATED_GATEWAY';

export interface Payment {
  id: number;
  invoiceId: number;
  invoiceNumber?: string;
  customerName?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  paymentDate: string;
  notes?: string;
  recordedBy?: number;
  createdAt: string;
}

export interface KPISummary {
  activeSubscriptionsCount: number;
  totalRevenue: number;
  totalOutstanding: number;
  overdueInvoicesCount: number;
}

import { apiFetch } from './api';

export type PaymentIntegrationType = 'META_WHATSAPP' | 'RAZORPAY_DIRECT' | 'PAYU_DIRECT' | 'STRIPE_DIRECT';
export type PaymentIntegrationStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
export type PaymentMode = 'NATIVE_WHATSAPP' | 'DIRECT_LINK';
export type PaymentDispatchMode = 'SESSION_MESSAGE' | 'PAYMENT_TEMPLATE';
export type WhatsAppSessionStatus = 'OPEN' | 'CLOSED' | 'UNKNOWN';
export type WhatsAppOrderStatus = 'CREATED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type WhatsAppOrderPaymentStatus = 'CREATED' | 'PAYMENT_REQUEST_SENT' | 'PAYMENT_PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
export type PaymentTransactionStatus = 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'UNKNOWN';

export interface AvailableTemplateDto {
  definitionKey: string;
  version: number;
  metaTemplateName: string;
  language: string;
  expectedCategory: string;
  actualCategory?: string;
  status: string; // APPROVED, PENDING, REJECTED, PAUSED, DISABLED, FLAGGED
  sendEnabled: boolean;
  description?: string;
  requiredVariables?: string[];
  sampleBody?: string;
}

export interface WhatsAppSessionInfoDto {
  sessionStatus: WhatsAppSessionStatus;
  lastInboundMessageAt?: string;
  expiresAt?: string;
  remainingSeconds: number;
  nativePaymentAllowed: boolean;
  directGatewayAllowed: boolean;
  templateRequired: boolean;
  availableTemplates?: AvailableTemplateDto[];
}

export interface TenantPaymentConfigDto {
  id?: string;
  integrationType: PaymentIntegrationType;
  status?: PaymentIntegrationStatus;
  isActive?: boolean;
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  metaPaymentConfigurationName?: string;
  webhookUrl?: string;
  webhookKey?: string;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentItemDto {
  sku?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPriceMinor: number;
  taxMinor?: number;
  discountMinor?: number;
}

export interface PaymentRequestDto {
  customerId?: string;
  customerWaId: string;
  customerName?: string;
  externalReferenceId?: string;
  currency?: string;
  discountMinor?: number;
  taxMinor?: number;
  shippingMinor?: number;
  preferredPaymentMode?: PaymentMode;
  dispatchMode?: PaymentDispatchMode;
  templateDefinitionKey?: string;
  templateParameters?: Record<string, string>;
  preferredPaymentProvider?: PaymentIntegrationType;
  items: PaymentItemDto[];
}

export interface PaymentTransactionDto {
  id: string;
  provider: PaymentIntegrationType;
  paymentMode: PaymentMode;
  idempotencyKey: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  checkoutUrl?: string;
  amountMinor: number;
  currency: string;
  status: PaymentTransactionStatus;
  failureCode?: string;
  failureReason?: string;
  createdAt: string;
  paidAt?: string;
}

export interface PaymentRefundDto {
  id: string;
  transactionId: string;
  providerRefundId?: string;
  amountMinor: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: string;
  processedAt?: string;
}

export interface PaymentAuditLogDto {
  id: string;
  orderId?: string;
  transactionId?: string;
  actorType: string;
  actorId?: string;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  createdAt: string;
}

export interface WhatsAppOrderResponseDto {
  id: string;
  referenceId: string;
  externalReferenceId?: string;
  customerId?: string;
  customerWaId: string;
  customerName?: string;
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  shippingMinor: number;
  totalMinor: number;
  orderStatus: WhatsAppOrderStatus;
  paymentStatus: WhatsAppOrderPaymentStatus;
  fulfillmentStatus: string;
  preferredPaymentMode?: PaymentMode;
  preferredPaymentProvider?: PaymentIntegrationType;
  items: Array<{
    id: string;
    sku?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPriceMinor: number;
    taxMinor: number;
    discountMinor: number;
    lineTotalMinor: number;
  }>;
  transactions: PaymentTransactionDto[];
  refunds: PaymentRefundDto[];
  auditLogs: PaymentAuditLogDto[];
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export async function fetchPaymentConfigs(): Promise<TenantPaymentConfigDto[]> {
  const res = await apiFetch<TenantPaymentConfigDto[]>('/api/v1/tenant/payments/config');
  if (res.error) throw new Error(res.error);
  return res.data || [];
}

export async function savePaymentConfig(data: TenantPaymentConfigDto): Promise<TenantPaymentConfigDto> {
  const res = await apiFetch<TenantPaymentConfigDto>('/api/v1/tenant/payments/config', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.error) throw new Error(res.error);
  return res.data!;
}

export async function regenerateWebhookKey(configId: string): Promise<TenantPaymentConfigDto> {
  const res = await apiFetch<TenantPaymentConfigDto>(`/api/v1/tenant/payments/config/${configId}/regenerate-key`, {
    method: 'POST',
  });
  if (res.error) throw new Error(res.error);
  return res.data!;
}

export async function sendPaymentBill(data: PaymentRequestDto): Promise<WhatsAppOrderResponseDto> {
  const res = await apiFetch<WhatsAppOrderResponseDto>('/api/v1/whatsapp/payments/send-bill', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.error) throw new Error(res.error);
  return res.data!;
}

export async function fetchOrders(page = 0, size = 20, status?: string): Promise<{ content: WhatsAppOrderResponseDto[]; totalPages: number; totalElements: number }> {
  let url = `/api/v1/whatsapp/payments/orders?page=${page}&size=${size}`;
  if (status) url += `&status=${status}`;
  const res = await apiFetch<{ content: WhatsAppOrderResponseDto[]; totalPages: number; totalElements: number }>(url);
  if (res.error) throw new Error(res.error);
  return res.data || { content: [], totalPages: 0, totalElements: 0 };
}

export async function fetchOrderById(orderId: string): Promise<WhatsAppOrderResponseDto> {
  const res = await apiFetch<WhatsAppOrderResponseDto>(`/api/v1/whatsapp/payments/orders/${orderId}`);
  if (res.error) throw new Error(res.error);
  return res.data!;
}

export async function resendPaymentOrder(orderId: string): Promise<WhatsAppOrderResponseDto> {
  const res = await apiFetch<WhatsAppOrderResponseDto>(`/api/v1/whatsapp/payments/orders/${orderId}/resend`, {
    method: 'POST',
  });
  if (res.error) throw new Error(res.error);
  return res.data!;
}

export async function refundPaymentOrder(orderId: string, amountMinor?: number, reason?: string): Promise<{ success: boolean; errorMessage?: string }> {
  const res = await apiFetch<{ success: boolean; errorMessage?: string }>(`/api/v1/whatsapp/payments/orders/${orderId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ amountMinor, reason }),
  });
  if (res.error) throw new Error(res.error);
  return res.data || { success: true };
}

export async function fetchSessionStatus(customerWaId: string): Promise<WhatsAppSessionInfoDto> {
  const cleanWaId = customerWaId.replace(/[^0-9]/g, '');
  const res = await apiFetch<WhatsAppSessionInfoDto>(`/api/v1/whatsapp/payments/session-status?customerWaId=${cleanWaId}`);
  if (res.error) throw new Error(res.error);
  return res.data || {
    sessionStatus: 'CLOSED',
    remainingSeconds: 0,
    nativePaymentAllowed: false,
    directGatewayAllowed: false,
    templateRequired: true,
  };
}

export async function fetchPaymentTemplateDefinitions(): Promise<AvailableTemplateDto[]> {
  const res = await apiFetch<AvailableTemplateDto[]>('/api/v1/whatsapp/payments/templates/definitions');
  if (res.error) throw new Error(res.error);
  return res.data || [];
}


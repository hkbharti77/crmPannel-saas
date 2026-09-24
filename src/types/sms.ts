export interface SmsProviderCapabilities {
  inboundSms: boolean;
  deliveryReports: boolean;
  unicode: boolean;
  scheduling: boolean;
  senderIdSupported: boolean;
  templateMessagingRequired: boolean;
  indiaDltRequired: boolean;
}

export interface MaskedSmsProvider {
  id: string;
  businessId: string;
  providerType: 'TWILIO' | 'MSG91' | 'FAST2SMS' | 'AWS_SNS';
  name: string;
  senderId: string;
  isDefault: boolean;
  status: 'CONNECTED' | 'ERROR' | 'UNVERIFIED';
  capabilities?: SmsProviderCapabilities;
  maskedCredentials: Record<string, string>;
}

export interface SmsTemplate {
  id?: string;
  businessId?: string;
  title: string;
  content: string;
  category?: 'TRANSACTIONAL' | 'PROMOTIONAL' | 'OTP';
  countryCode?: string;
  senderId?: string;
  dltEntityId?: string;
  dltTemplateId?: string;
  dltHeaderId?: string;
  allowedVariables?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface SmsCampaign {
  id?: string;
  businessId?: string;
  name: string;
  templateId?: string;
  providerId?: string;
  status?: 'DRAFT' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRecipients?: number;
  deliveredCount?: number;
  failedCount?: number;
  scheduledAt?: string;
  createdAt?: string;
}

export interface SmsSendRequest {
  phoneNumber: string;
  messageContent: string;
  senderId?: string;
  dltEntityId?: string;
  dltTemplateId?: string;
  dltHeaderId?: string;
  templateVariables?: Record<string, string>;
}

export interface SmsSendResult {
  success: boolean;
  providerMessageId?: string;
  providerRequestId?: string;
  provider: string;
  errorCode?: string;
  errorMessage?: string;
  segments: number;
  unitCost?: number;
  estimatedCost?: number;
  metadata?: Record<string, any>;
}

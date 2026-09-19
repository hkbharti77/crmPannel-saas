export interface PaymentTemplateDefinition {
  definitionKey: string;
  version: number;
  name: string;
  title?: string;
  languages: string[];
  expectedCategory: 'UTILITY' | 'MARKETING';
  description: string;
  sampleBody: string;
  requiredVariables: string[];
  variableLabels: Record<string, string>;
  buttonType: 'URL' | 'QUICK_REPLY';
  ctaButtonText?: string;
  samplePreview: {
    customer_name: string;
    [key: string]: string;
  };
}

export const PREBUILT_PAYMENT_TEMPLATES: PaymentTemplateDefinition[] = [
  {
    definitionKey: 'order_payment_request',
    version: 1,
    name: 'order_payment_request',
    title: 'Order Payment Request (Recommended)',
    languages: ['en_US', 'hi'],
    expectedCategory: 'UTILITY',
    description: 'Standard utility template with customer name, order number, amount, payment link URL, and quick reply confirmation.',
    sampleBody: 'Dear {{1}}, your order #{{2}} totaling ₹{{3}} is ready for payment. Please click the secure payment link below: {{4}} to complete your transaction.',
    requiredVariables: ['customer_name', 'order_reference', 'amount', 'payment_link'],
    variableLabels: {
      customer_name: 'Customer Name',
      order_reference: 'Order Reference ID',
      amount: 'Formatted Amount',
      payment_link: 'Payment Link URL',
    },
    buttonType: 'URL',
    ctaButtonText: 'Pay Now 💳',
    samplePreview: {
      customer_name: 'John Doe',
      order_reference: 'ORD-1001',
      amount: '500.00',
      payment_link: 'https://rzp.io/i/sample123',
    },
  },
  {
    definitionKey: 'payment_reminder_urgent',
    version: 1,
    name: 'payment_reminder_urgent',
    title: 'Payment Reminder',
    languages: ['en_US', 'hi'],
    expectedCategory: 'UTILITY',
    description: 'Gentle reminder for pending order payment with dynamic payment link and quick reply confirmation.',
    sampleBody: 'Hi {{1}}, this is a friendly reminder that payment of ₹{{2}} for order #{{3}} is currently pending. Please tap the link below: {{4}} to pay securely.',
    requiredVariables: ['customer_name', 'amount', 'order_reference', 'payment_link'],
    variableLabels: {
      customer_name: 'Customer Name',
      amount: 'Formatted Amount',
      order_reference: 'Order Reference ID',
      payment_link: 'Payment Link URL',
    },
    buttonType: 'URL',
    ctaButtonText: 'Pay Now 💳',
    samplePreview: {
      customer_name: 'Alex',
      amount: '1,200.00',
      order_reference: 'ORD-2048',
      payment_link: 'https://rzp.io/i/pay456',
    },
  },
  {
    definitionKey: 'payment_link_cta',
    version: 1,
    name: 'payment_link_cta',
    title: 'Pay Now Dynamic CTA Button',
    languages: ['en_US', 'hi'],
    expectedCategory: 'UTILITY',
    description: 'High-conversion template with direct "Pay Now" URL button for one-tap browser checkout.',
    sampleBody: 'Dear {{1}}, thank you for your order #{{2}}. Your total amount payable is ₹{{3}}.',
    requiredVariables: ['customer_name', 'order_reference', 'amount'],
    variableLabels: {
      customer_name: 'Customer Name',
      order_reference: 'Order Reference ID',
      amount: 'Formatted Amount',
      cta_url: 'Button Payment Link URL Suffix',
    },
    buttonType: 'URL',
    ctaButtonText: 'Pay Now 💳',
    samplePreview: {
      customer_name: 'Customer',
      order_reference: 'ORD-3050',
      amount: '750.00',
    },
  },
  {
    definitionKey: 'payment_order_invoice_v1',
    version: 1,
    name: 'payment_order_invoice_v1',
    title: 'Itemized Order Invoice',
    languages: ['en_US', 'hi'],
    expectedCategory: 'UTILITY',
    description: 'Official order bill and direct checkout link for finalized invoices with currency and item breakdown.',
    sampleBody: 'Hi {{1}}, your order #{{2}} for {{3}} of {{5}} {{4}} is ready for payment. Click below to pay securely via WhatsApp UPI / Gateway.',
    requiredVariables: ['customer_name', 'order_reference', 'item_name', 'amount', 'currency'],
    variableLabels: {
      customer_name: 'Customer Name',
      order_reference: 'Order Ref Number',
      item_name: 'Item / Service Name',
      amount: 'Payable Amount',
      currency: 'Currency (e.g. INR)',
    },
    buttonType: 'URL',
    ctaButtonText: 'Pay Now 💳',
    samplePreview: {
      customer_name: 'Rahul Sharma',
      order_reference: 'ORD-9821-X4',
      item_name: 'Web Dev & Consultation',
      amount: '4,999.00',
      currency: 'INR',
    },
  },
  {
    definitionKey: 'pending_bill_reminder_v1',
    version: 1,
    name: 'pending_bill_reminder_v1',
    title: 'Due Date Bill Reminder',
    languages: ['en_US', 'hi'],
    expectedCategory: 'UTILITY',
    description: 'Gentle payment reminder for outstanding or overdue bills with explicit deadline.',
    sampleBody: 'Hello {{1}}, friendly reminder: Your bill #{{2}} of ₹{{3}} is pending. Please complete your payment before {{4}} using the link below.',
    requiredVariables: ['customer_name', 'order_reference', 'amount', 'due_date'],
    variableLabels: {
      customer_name: 'Customer Name',
      order_reference: 'Invoice Number',
      amount: 'Due Amount',
      due_date: 'Due Date / Deadline',
    },
    buttonType: 'URL',
    ctaButtonText: 'Pay Now 💳',
    samplePreview: {
      customer_name: 'Priya Patel',
      order_reference: 'INV-4029',
      amount: '2,500.00',
      due_date: 'Tomorrow, 6:00 PM',
    },
  },
  {
    definitionKey: 'service_booking_deposit_v1',
    version: 1,
    name: 'service_booking_deposit_v1',
    title: 'Service Booking Deposit',
    languages: ['en_US', 'hi'],
    expectedCategory: 'UTILITY',
    description: 'Advance booking deposit request to confirm appointment slots.',
    sampleBody: 'Hi {{1}}, thank you for booking {{2}} on {{3}}! Please pay the advance deposit of ₹{{4}} to confirm your appointment.',
    requiredVariables: ['customer_name', 'service_name', 'booking_date', 'deposit_amount'],
    variableLabels: {
      customer_name: 'Customer Name',
      service_name: 'Service / Slot Title',
      booking_date: 'Appointment Date/Time',
      deposit_amount: 'Token Deposit Amount',
    },
    buttonType: 'URL',
    ctaButtonText: 'Pay Deposit 💳',
    samplePreview: {
      customer_name: 'Amit Verma',
      service_name: 'VIP Car Detailing Session',
      booking_date: 'Saturday, 11:30 AM',
      deposit_amount: '999.00',
    },
  },
  {
    definitionKey: 'subscription_renewal_notice_v1',
    version: 1,
    name: 'subscription_renewal_notice_v1',
    title: 'Subscription Renewal Notice',
    languages: ['en_US', 'hi'],
    expectedCategory: 'UTILITY',
    description: 'Recurring subscription and membership renewal notice.',
    sampleBody: 'Dear {{1}}, your membership for {{2}} is due for renewal on {{3}}. Renew now for ₹{{4}} to continue enjoying uninterrupted services.',
    requiredVariables: ['customer_name', 'plan_name', 'renewal_date', 'renewal_amount'],
    variableLabels: {
      customer_name: 'Member Name',
      plan_name: 'Subscription Plan',
      renewal_date: 'Renewal Due Date',
      renewal_amount: 'Renewal Fee',
    },
    buttonType: 'URL',
    ctaButtonText: 'Renew Now 💳',
    samplePreview: {
      customer_name: 'Dr. Sneha Roy',
      plan_name: 'Enterprise Pro Annual Plan',
      renewal_date: '30th September 2026',
      renewal_amount: '14,999.00',
    },
  },
  {
    definitionKey: 'quotation_payment_approval_v1',
    version: 1,
    name: 'quotation_payment_approval_v1',
    title: 'Quotation Payment & Approval',
    languages: ['en_US', 'hi'],
    expectedCategory: 'UTILITY',
    description: 'Custom price quote, proposal estimate approval and deposit payment.',
    sampleBody: 'Hi {{1}}, here is your tailored estimate #{{2}} of ₹{{4}} for {{3}}. Review and make payment before {{5}} to get started.',
    requiredVariables: ['customer_name', 'quotation_number', 'service_name', 'quoted_amount', 'valid_until'],
    variableLabels: {
      customer_name: 'Client Name',
      quotation_number: 'Quotation Number',
      service_name: 'Project Scope',
      quoted_amount: 'Total Estimate Amount',
      valid_until: 'Offer Validity Date',
    },
    buttonType: 'URL',
    ctaButtonText: 'Approve & Pay 💳',
    samplePreview: {
      customer_name: 'Vikas Malhotra',
      quotation_number: 'QUO-8821',
      service_name: 'Custom Mobile App Architecture',
      quoted_amount: '75,000.00',
      valid_until: '7 days from now',
    },
  },
];

/**
 * Converts a PaymentTemplateDefinition into a WhatsAppTemplateDto for 1-click submission to Meta
 */
export function convertToWhatsAppTemplateDto(tpl: PaymentTemplateDefinition): any {
  // Extract sample values in order of {{1}}, {{2}}, ...
  const matches = tpl.sampleBody.match(/\{\{(\d+)\}\}/g) || [];
  const varCount = matches.length;
  const previewVals = Object.values(tpl.samplePreview);
  const bodySampleValues: string[] = [];
  for (let i = 0; i < varCount; i++) {
    bodySampleValues.push(previewVals[i] || `SampleVal${i + 1}`);
  }

  return {
    name: tpl.name,
    language: 'en_US',
    category: tpl.expectedCategory,
    headerType: 'NONE',
    bodyText: tpl.sampleBody,
    bodySampleValues: bodySampleValues,
    footerText: 'Powered by WhatsApp Payments',
    buttons: [
      {
        type: 'URL',
        text: tpl.ctaButtonText ? tpl.ctaButtonText.replace(/[^\w\s]/gi, '').trim() : 'Pay Now',
        url: 'https://checkout.crmlite.com/pay/{{1}}',
        urlSample: 'https://checkout.crmlite.com/pay/sample-ref',
      },
    ],
  };
}

/**
 * Generates official Meta WhatsApp Business Management API submission JSON for a template definition.
 */
export function generateMetaTemplateSubmissionJson(tpl: PaymentTemplateDefinition): string {
  return JSON.stringify(
    {
      name: tpl.name,
      category: tpl.expectedCategory,
      language: 'en_US',
      components: [
        {
          type: 'BODY',
          text: tpl.sampleBody,
          example: {
            body_text: [Object.values(tpl.samplePreview)],
          },
        },
        {
          type: 'BUTTONS',
          buttons: [
            {
              type: 'URL',
              text: tpl.ctaButtonText || 'Pay Now',
              url: 'https://checkout.crmlite.com/pay/{{1}}',
              example: ['https://checkout.crmlite.com/pay/sample-order-ref'],
            },
          ],
        },
      ],
    },
    null,
    2
  );
}

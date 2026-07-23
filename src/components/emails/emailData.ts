export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'follow_up' | 'welcome' | 'promotion' | 'announcement' | 'nurture';
};

export type Audience = {
  id: string;
  name: string;
  count: number;
  description: string;
  tags: string[];
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'sending';
  recipients: number;
  openRate: number;
  clickRate: number;
  sentAt: string;
  template: string;
};

export const TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl1',
    name: 'Site Visit Follow-up',
    subject: 'Thanks for visiting {{property}} — next steps',
    body: `Hi {{name}},

Thank you for taking the time to visit {{property}} yesterday. I hope you found the walkthrough informative and that it gave you a clear sense of what the property has to offer.

As discussed, here are the next steps:

1. Review the brochure and floor plans (attached)
2. Schedule a second visit with family members if needed
3. Discuss financing options with our partner banks

If you have any questions or would like to move forward, feel free to reply to this email or call me directly.

Best regards,
{{agentName}}`,
    category: 'follow_up',
  },
  {
    id: 'tpl2',
    name: 'New Lead Welcome',
    subject: "Welcome to Metro Realty — let's find your dream property",
    body: `Hi {{name}},

Welcome to Metro Realty! We're excited to help you find the perfect property.

Based on your interest in {{interest}}, here's what we can do for you:

- Personalized property recommendations
- Site visits at your convenience
- End-to-end assistance with paperwork and financing

To get started, simply reply with your preferred time for a quick introductory call, or browse our latest listings on our website.

Best,
The Metro Realty Team`,
    category: 'welcome',
  },
  {
    id: 'tpl3',
    name: 'Limited-Time Offer',
    subject: '⚡ Last 3 days: Special pricing on premium units',
    body: `Hi {{name}},

We have an exclusive limited-time offer just for you!

For the next 3 days only, we're offering:

- Up to 8% off on select premium units
- Zero stamp duty on bookings above ₹1.5 Cr
- Complimentary interior design consultation

This offer is available on a first-come, first-served basis and is limited to the remaining inventory.

Don't miss out — reply to this email or call us to schedule your visit today.

Warm regards,
{{agentName}}
Metro Realty`,
    category: 'promotion',
  },
  {
    id: 'tpl4',
    name: 'Monthly Newsletter',
    subject: '📍 Market Update — July 2026 Real Estate Trends',
    body: `Hi {{name}},

Here's your monthly real estate market update:

MARKET HIGHLIGHTS
- Average property prices up 6.2% YoY in Mumbai metro
- Andheri West sees highest demand growth
- New RERA-approved projects launched in Thane

FEATURED PROPERTIES THIS MONTH
- Skyline Residency — 3BHK starting ₹1.8 Cr
- Sea View Apartments — 2BHK starting ₹1.2 Cr
- Green Valley — Premium villas starting ₹2.5 Cr

Stay informed, stay ahead. Reply to this email if you'd like a personalized market analysis for your target area.

Best,
The Metro Realty Team`,
    category: 'announcement',
  },
  {
    id: 'tpl5',
    name: 'Re-engagement Nurture',
    subject: 'Still looking for the right property, {{name}}?',
    body: `Hi {{name}},

We noticed you haven't been active on our platform for a while, and we wanted to check in.

The market has changed significantly since we last connected. New projects have launched, prices have been updated, and there are some exciting opportunities we think you'd be interested in.

Here's what's new:
- Fresh inventory in your preferred locations
- Updated pricing with flexible payment plans
- New ready-to-move-in units available

Would you like to schedule a quick call to catch up? Just reply with a time that works for you.

Best regards,
{{agentName}}`,
    category: 'nurture',
  },
];

export const AUDIENCES: Audience[] = [
  { id: 'aud1', name: 'Hot Leads', count: 42, description: 'Leads contacted in the last 7 days', tags: ['hot', 'recent'] },
  { id: 'aud2', name: 'Cold Leads', count: 128, description: 'No activity in the last 30 days', tags: ['cold', 'inactive'] },
  { id: 'aud3', name: 'Site Visit Attendees', count: 67, description: 'Completed at least one site visit', tags: ['engaged', 'visited'] },
  { id: 'aud4', name: 'New Subscribers', count: 23, description: 'Joined in the last 14 days', tags: ['new', 'welcome'] },
  { id: 'aud5', name: 'High Budget', count: 31, description: 'Budget above ₹2 Crore', tags: ['premium', 'high-value'] },
  { id: 'aud6', name: 'All Leads', count: 291, description: 'Every lead in the system', tags: ['all'] },
];

export const CAMPAIGNS: Campaign[] = [
  { id: 'cmp1', name: 'July Site Visit Follow-up', subject: 'Thanks for visiting {{property}} — next steps', status: 'sent', recipients: 67, openRate: 68, clickRate: 24, sentAt: 'Jul 20, 2026', template: 'Site Visit Follow-up' },
  { id: 'cmp2', name: 'Welcome New Leads — Week 29', subject: 'Welcome to Metro Realty', status: 'sent', recipients: 23, openRate: 82, clickRate: 45, sentAt: 'Jul 18, 2026', template: 'New Lead Welcome' },
  { id: 'cmp3', name: 'Premium Units Flash Sale', subject: '⚡ Last 3 days: Special pricing on premium units', status: 'scheduled', recipients: 31, openRate: 0, clickRate: 0, sentAt: 'Jul 25, 2026', template: 'Limited-Time Offer' },
  { id: 'cmp4', name: 'July Newsletter', subject: '📍 Market Update — July 2026 Real Estate Trends', status: 'draft', recipients: 291, openRate: 0, clickRate: 0, sentAt: '—', template: 'Monthly Newsletter' },
  { id: 'cmp5', name: 'Re-engage Cold Leads', subject: 'Still looking for the right property?', status: 'sent', recipients: 128, openRate: 34, clickRate: 12, sentAt: 'Jul 14, 2026', template: 'Re-engagement Nurture' },
];

export const CAMPAIGN_STATUS_META: Record<Campaign['status'], { label: string; color: string; dot: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600 dark:bg-ink-800 dark:text-slate-400', dot: 'bg-slate-400' },
  scheduled: { label: 'Scheduled', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300', dot: 'bg-primary-500' },
  sent: { label: 'Sent', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300', dot: 'bg-success-500' },
  sending: { label: 'Sending', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300', dot: 'bg-warning-500' },
};

export const TEMPLATE_CATEGORY_META: Record<EmailTemplate['category'], { label: string; color: string }> = {
  follow_up: { label: 'Follow Up', color: 'bg-primary-100 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300' },
  welcome: { label: 'Welcome', color: 'bg-success-100 text-success-700 dark:bg-success-500/15 dark:text-success-300' },
  promotion: { label: 'Promotion', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300' },
  announcement: { label: 'Announcement', color: 'bg-secondary-500/15 text-secondary-700 dark:text-secondary-300' },
  nurture: { label: 'Nurture', color: 'bg-danger-100 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300' },
};

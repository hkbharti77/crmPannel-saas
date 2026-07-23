import type { LeadStage } from '@/lib/types';

export type TimelineEvent = {
  id: string;
  type: 'chat' | 'call' | 'email' | 'appointment' | 'note' | 'stage_change' | 'won' | 'lead_created';
  title: string;
  description: string;
  actor: string;
  time: string;
};

export type Note = {
  id: string;
  text: string;
  author: string;
  time: string;
};

export type LeadFile = {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'sheet';
  size: string;
  uploadedBy: string;
  time: string;
};

export type LeadDetailData = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  location: string;
  stage: LeadStage;
  value: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  budget: string;
  interest: string;
  assignedTo: string;
  createdAt: string;
  lastActivity: string;
  tags: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  quality: 'GREEN' | 'YELLOW' | 'RED';
  timeline: TimelineEvent[];
  notes: Note[];
  files: LeadFile[];
};

export const LEAD_DETAIL: LeadDetailData = {
  id: 'l1',
  name: 'Rajesh Mehta',
  company: 'Metro Realty',
  phone: '+91 98765 43210',
  email: 'rajesh.mehta@email.com',
  location: 'Mumbai, Maharashtra',
  stage: 'CONTACTED',
  value: '₹68L',
  priority: 'HIGH',
  source: 'WhatsApp Chatbot',
  budget: '₹60L - ₹80L',
  interest: '3BHK · Skyline Residency',
  assignedTo: 'Priya Sharma',
  createdAt: 'Jul 15, 2025',
  lastActivity: '5 min ago',
  tags: ['HOT', 'NEW'],
  sentiment: 'Positive',
  quality: 'GREEN',
  timeline: [
    { id: 't1', type: 'lead_created', title: 'Lead created', description: 'Captured from website chatbot', actor: 'System', time: 'Jul 15, 09:42' },
    { id: 't2', type: 'chat', title: 'WhatsApp conversation started', description: 'Inquired about 3BHK availability', actor: 'Rajesh Mehta', time: 'Jul 15, 09:42' },
    { id: 't3', type: 'stage_change', title: 'Moved to Contacted', description: 'Bot qualified the lead based on budget', actor: 'AI Bot', time: 'Jul 15, 09:46' },
    { id: 't4', type: 'appointment', title: 'Site visit scheduled', description: 'Saturday at 10:00 AM — Skyline Residency', actor: 'AI Bot', time: 'Jul 15, 09:48' },
    { id: 't5', type: 'chat', title: 'Handed off to human agent', description: 'Priya Sharma took over the conversation', actor: 'System', time: 'Jul 15, 09:50' },
    { id: 't6', type: 'email', title: 'Brochure sent', description: 'Skyline_Residency_Brochure.pdf shared via WhatsApp', actor: 'Priya Sharma', time: 'Jul 15, 09:52' },
    { id: 't7', type: 'call', title: 'Follow-up call logged', description: 'Confirmed site visit, discussed EMI options', actor: 'Priya Sharma', time: 'Jul 16, 14:30' },
    { id: 't8', type: 'note', title: 'Note added', description: 'Client very interested, comparing with 2 other builders', actor: 'Priya Sharma', time: 'Jul 16, 14:35' },
  ],
  notes: [
    { id: 'n1', text: 'Client is very interested in the 3BHK unit. Comparing with two other builders in the area. Highlighting the park-facing balcony and modular kitchen helped.', author: 'Priya Sharma', time: '2h ago' },
    { id: 'n2', text: 'Budget confirmed at ₹60-80L range. Open to premium units if financing is attractive. Suggested we prepare a custom EMI plan.', author: 'Priya Sharma', time: '1d ago' },
    { id: 'n3', text: 'Initial inquiry came through website chatbot. Bot handled qualification and booking automatically before handoff.', author: 'AI Bot', time: 'Jul 15' },
  ],
  files: [
    { id: 'f1', name: 'Skyline_Residency_Brochure.pdf', type: 'pdf', size: '2.4 MB', uploadedBy: 'Priya Sharma', time: 'Jul 15' },
    { id: 'f2', name: '3BHK_FloorPlan.png', type: 'image', size: '1.1 MB', uploadedBy: 'Priya Sharma', time: 'Jul 15' },
    { id: 'f3', name: 'EMI_Calculator.xlsx', type: 'sheet', size: '340 KB', uploadedBy: 'Arjun Kapoor', time: 'Jul 16' },
    { id: 'f4', name: 'Site_Visit_Confirmation.docx', type: 'doc', size: '88 KB', uploadedBy: 'AI Bot', time: 'Jul 15' },
  ],
};

export const STAGE_ORDER: LeadStage[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'WON'];

export const FILE_ICONS: Record<LeadFile['type'], { icon: string; color: string }> = {
  pdf: { icon: 'FileText', color: 'text-danger-600 dark:text-danger-400' },
  image: { icon: 'Image', color: 'text-success-600 dark:text-success-400' },
  doc: { icon: 'FileType', color: 'text-primary-600 dark:text-primary-400' },
  sheet: { icon: 'Sheet', color: 'text-success-600 dark:text-success-400' },
};

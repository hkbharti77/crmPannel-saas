export type MessageStatus = 'sent' | 'delivered' | 'read' | 'pending';
export type MessageSender = 'them' | 'me' | 'bot' | 'system';

export type Message = {
  id: string;
  sender: MessageSender;
  type: 'text' | 'image' | 'video' | 'doc' | 'voice' | 'sticker' | 'system';
  text?: string;
  time: string;
  status?: MessageStatus;
  imageUrl?: string;
  mediaUrl?: string;
  docName?: string;
  docSize?: string;
  voiceDuration?: string;
  isAISuggested?: boolean;
};

export const MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'system',
    type: 'system',
    text: 'Conversation started from website chatbot',
    time: '09:42',
  },
  {
    id: 'm2',
    sender: 'them',
    type: 'text',
    text: 'Hi, I saw your listing for Skyline Residency. Is the 3BHK still available?',
    time: '09:42',
    status: 'read',
  },
  {
    id: 'm3',
    sender: 'bot',
    type: 'text',
    text: "Hello Rajesh! Yes, the 3BHK at Skyline Residency is available. The base price starts at ₹68 lakhs. Would you like to schedule a site visit?",
    time: '09:43',
  },
  {
    id: 'm4',
    sender: 'them',
    type: 'text',
    text: "That's in my budget. Can we visit this weekend?",
    time: '09:45',
    status: 'read',
  },
  {
    id: 'm5',
    sender: 'bot',
    type: 'text',
    text: 'Absolutely! I can book a slot for Saturday at 10:00 AM or Sunday at 2:00 PM. Which works better for you?',
    time: '09:46',
  },
  {
    id: 'm6',
    sender: 'them',
    type: 'text',
    text: 'Saturday 10 AM sounds good',
    time: '09:48',
    status: 'read',
  },
  {
    id: 'm7',
    sender: 'bot',
    type: 'system',
    text: 'Site visit booked for Saturday, 10:00 AM',
    time: '09:48',
  },
  {
    id: 'm8',
    sender: 'system',
    type: 'system',
    text: 'Bot handed off to Priya Sharma',
    time: '09:50',
  },
  {
    id: 'm9',
    sender: 'me',
    type: 'text',
    text: 'Hi Rajesh, this is Priya from the sales team. I saw you booked a site visit — I wanted to personally confirm and share the brochure.',
    time: '09:52',
    status: 'read',
  },
  {
    id: 'm10',
    sender: 'me',
    type: 'doc',
    docName: 'Skyline_Residency_Brochure.pdf',
    docSize: '2.4 MB',
    time: '09:52',
    status: 'read',
  },
  {
    id: 'm11',
    sender: 'me',
    type: 'image',
    imageUrl: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400',
    text: 'Here is a photo of the building exterior',
    time: '09:53',
    status: 'read',
  },
  {
    id: 'm12',
    sender: 'them',
    type: 'text',
    text: 'Looks great! Can we schedule a site visit for this weekend?',
    time: '10:15',
    status: 'read',
  },
  {
    id: 'm13',
    sender: 'me',
    type: 'voice',
    voiceDuration: '0:24',
    time: '10:18',
    status: 'read',
  },
];

export const AI_SUGGESTIONS = [
  'Yes, the visit is confirmed for Saturday at 10 AM. I will send you the location pin shortly.',
  'Would you like me to share the floor plan as well? I can also arrange a virtual tour if that helps.',
  'Great! Just to confirm, the 3BHK unit is on the 7th floor with a balcony facing the park.',
];

export type LeadContext = {
  name: string;
  phone: string;
  email: string;
  stage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON' | 'LOST';
  source: string;
  budget: string;
  interest: string;
  assignedTo: string;
  lastActivity: string;
  tags: string[];
};

export const LEAD_CONTEXT: LeadContext = {
  name: 'Rajesh Mehta',
  phone: '+91 98765 43210',
  email: 'rajesh.mehta@email.com',
  stage: 'CONTACTED',
  source: 'Website Chatbot',
  budget: '₹60L - ₹80L',
  interest: '3BHK · Skyline Residency',
  assignedTo: 'Priya Sharma',
  lastActivity: '5 min ago',
  tags: ['HOT', 'NEW'],
};

export const CONVERSATION_SUMMARY = {
  sentiment: 'Positive',
  intent: 'Site visit booking',
  botResolved: 3,
  avgResponseTime: '1m 20s',
  totalMessages: 13,
};

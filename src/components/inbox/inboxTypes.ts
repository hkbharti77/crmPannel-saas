export type ConversationStatus = 'online' | 'typing' | 'away' | 'offline';
export type ConversationTag = 'NEW' | 'HOT' | 'VIP' | 'RETURNING' | 'BOT';
export type ConversationChannel = 'whatsapp' | 'webchat' | 'telegram';

export type Conversation = {
  id: string;
  name: string;
  phone: string;
  channel?: ConversationChannel;
  telegramUsername?: string;
  avatar?: string;
  lastMessage: string;
  lastMessageSender: 'them' | 'me' | 'bot';
  timestamp: string;       // formatted relative time e.g. "2m ago"
  lastMessageTime?: string; // raw ISO timestamp for session window check
  unread: number;
  status: ConversationStatus;
  tags: ConversationTag[];
  assignedTo?: string;
  isBotHandled: boolean;   // false = human (bot paused), true = bot active
  leadId?: string;
  leadStatus?: string;
};

export type ConversationStatus = 'online' | 'typing' | 'away' | 'offline';
export type ConversationTag = 'NEW' | 'HOT' | 'VIP' | 'RETURNING' | 'BOT';

export type Conversation = {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  lastMessage: string;
  lastMessageSender: 'them' | 'me' | 'bot';
  timestamp: string;
  unread: number;
  status: ConversationStatus;
  tags: ConversationTag[];
  assignedTo?: string;
  isBotHandled: boolean;
};

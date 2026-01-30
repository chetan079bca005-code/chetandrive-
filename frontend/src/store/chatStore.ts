import { create } from 'zustand';
import { ChatMessage, QuickReply } from '../types';

interface ChatState {
  // Messages per ride
  messages: ChatMessage[];
  
  // Current active ride chat
  activeRideId: string | null;
  
  // Typing indicator
  isTyping: boolean;
  otherTyping: boolean;
  
  // Unread count
  unreadCount: number;
  
  // Quick replies
  quickReplies: QuickReply[];
  
  // Actions
  setActiveRide: (rideId: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  markAsRead: (messageId: string) => void;
  markAllAsRead: () => void;
  setTyping: (typing: boolean) => void;
  setOtherTyping: (typing: boolean) => void;
  clearChat: () => void;
}

const defaultQuickReplies: QuickReply[] = [
  { id: '1', text: "I'm here", icon: '📍' },
  { id: '2', text: '5 minutes away', icon: '⏱️' },
  { id: '3', text: 'Where are you?', icon: '🤔' },
  { id: '4', text: "I'm waiting outside", icon: '🚶' },
  { id: '5', text: 'Thanks!', icon: '🙏' },
  { id: '6', text: 'On my way', icon: '🚗' },
];

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  activeRideId: null,
  isTyping: false,
  otherTyping: false,
  unreadCount: 0,
  quickReplies: defaultQuickReplies,
  
  setActiveRide: (activeRideId) => set({ activeRideId }),
  
  addMessage: (message) => set((state) => {
    // Avoid duplicates
    if (state.messages.find(m => m._id === message._id)) {
      return state;
    }
    
    const newMessages = [...state.messages, message];
    const unreadCount = message.senderType !== 'passenger' && !message.read
      ? state.unreadCount + 1
      : state.unreadCount;
    
    return { messages: newMessages, unreadCount };
  }),
  
  setMessages: (messages) => set({
    messages,
    unreadCount: messages.filter(m => m.senderType !== 'passenger' && !m.read).length,
  }),
  
  markAsRead: (messageId) => set((state) => ({
    messages: state.messages.map(m =>
      m._id === messageId ? { ...m, read: true } : m
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  
  markAllAsRead: () => set((state) => ({
    messages: state.messages.map(m => ({ ...m, read: true })),
    unreadCount: 0,
  })),
  
  setTyping: (isTyping) => set({ isTyping }),
  
  setOtherTyping: (otherTyping) => set({ otherTyping }),
  
  clearChat: () => set({
    messages: [],
    activeRideId: null,
    isTyping: false,
    otherTyping: false,
    unreadCount: 0,
  }),
}));

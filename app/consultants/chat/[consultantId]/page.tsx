'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/store/auth';
import { useToastStore } from '@/lib/store/toast';
import { ConsultantChat, ChatMessage, ConsultantProfile } from '@/lib/types';
import { Send, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const consultantId = params.consultantId as string;
  const { firebaseUser, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [consultant, setConsultant] = useState<ConsultantProfile | null>(null);
  const [chat, setChat] = useState<ConsultantChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      addToast({ type: 'error', message: 'Please sign in to start a chat' });
      router.push('/consultants/browse');
      return;
    }

    if (!consultantId) {
      router.push('/consultants/browse');
      return;
    }

    initializeChat();
  }, [firebaseUser, consultantId, router, addToast]);

  useEffect(() => {
    if (chatIdRef.current) {
      subscribeToMessages();
    }
  }, [chatIdRef.current]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    if (!db || !firebaseUser || !consultantId) return;

    setLoading(true);
    try {
      // Load consultant profile
      const consultantRef = doc(db, 'consultantProfiles', consultantId);
      const consultantSnap = await getDoc(consultantRef);
      
      if (!consultantSnap.exists()) {
        addToast({ type: 'error', message: 'Consultant not found' });
        router.push('/consultants/browse');
        return;
      }

      setConsultant({ id: consultantSnap.id, ...consultantSnap.data() } as ConsultantProfile);

      // Find or create chat
      const chatsRef = collection(db, 'consultantChats');
      const existingChatQuery = query(
        chatsRef,
        where('consultantUid', '==', consultantId),
        where('customerUid', '==', firebaseUser.uid)
      );

      const existingChatSnap = await getDocs(existingChatQuery);
      
      if (!existingChatSnap.empty) {
        const chatData = { id: existingChatSnap.docs[0].id, ...existingChatSnap.docs[0].data() } as ConsultantChat;
        setChat(chatData);
        chatIdRef.current = chatData.id || null;
      } else {
        // Create new chat
        const newChatRef = doc(collection(db, 'consultantChats'));
        const newChat: Omit<ConsultantChat, 'id'> = {
          consultantUid: consultantId,
          customerUid: firebaseUser.uid,
          consultantName: consultantSnap.data().name || 'Consultant',
          customerName: formatHandleForDisplay(user?.handle || 'User'),
          unreadCountConsultant: 0,
          unreadCountCustomer: 0,
          status: 'active',
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        };

        await setDoc(newChatRef, newChat);
        const createdChat = { id: newChatRef.id, ...newChat } as ConsultantChat;
        setChat(createdChat);
        chatIdRef.current = createdChat.id;
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      addToast({ type: 'error', message: 'Failed to initialize chat' });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    if (!db || !chatIdRef.current) return;

    const messagesRef = collection(db, 'chatMessages');
    const messagesQuery = query(
      messagesRef,
      where('chatId', '==', chatIdRef.current),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];

      setMessages(messagesData);

      // Mark messages as read
      markMessagesAsRead(messagesData);
    });

    return unsubscribe;
  };

  const markMessagesAsRead = async (messagesData: ChatMessage[]) => {
    if (!db || !firebaseUser || !chatIdRef.current) return;

    const unreadMessages = messagesData.filter(
      msg => !msg.isRead && msg.senderUid !== firebaseUser.uid
    );

    if (unreadMessages.length === 0) return;

    try {
      const batch = unreadMessages.map(msg => {
        const msgRef = doc(db, 'chatMessages', msg.id!);
        return updateDoc(msgRef, { isRead: true });
      });

      await Promise.all(batch);

      // Update chat unread count
      const chatRef = doc(db, 'consultantChats', chatIdRef.current);
      await updateDoc(chatRef, {
        unreadCountCustomer: 0,
        unreadCountConsultant: 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!db || !firebaseUser || !chatIdRef.current || !messageText.trim()) return;

    setSending(true);
    try {
      const messagesRef = collection(db, 'chatMessages');
      const newMessageRef = doc(messagesRef);
      
      const newMessage: Omit<ChatMessage, 'id'> = {
        chatId: chatIdRef.current,
        senderUid: firebaseUser.uid,
        senderName: formatHandleForDisplay(user?.handle || 'User'),
        senderType: 'customer',
        content: messageText.trim(),
        messageType: 'text',
        isRead: false,
        createdAt: serverTimestamp() as any,
      };

      await setDoc(newMessageRef, newMessage);

      // Update chat
      const chatRef = doc(db, 'consultantChats', chatIdRef.current);
      await updateDoc(chatRef, {
        lastMessage: messageText.trim(),
        lastMessageAt: serverTimestamp(),
        unreadCountConsultant: (chat?.unreadCountConsultant || 0) + 1,
        updatedAt: serverTimestamp(),
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      addToast({ type: 'error', message: 'Failed to send message' });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!consultant || !chat) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/consultants/browse"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {consultant.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{consultant.name}</h2>
            <p className="text-sm text-gray-600">{consultant.specialties?.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-4" style={{ height: '500px', overflowY: 'auto' }}>
        <div className="p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderUid === firebaseUser?.uid;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-semibold mb-1 opacity-75">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    {message.messageType === 'invoice' && (
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <div className="flex items-center gap-2 text-xs">
                          <FileText className="w-4 h-4" />
                          <span>Invoice shared</span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs mt-1 opacity-75">
                      {message.createdAt && formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !messageText.trim()}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function formatHandleForDisplay(handle: string): string {
  if (!handle) return 'User';
  return handle
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

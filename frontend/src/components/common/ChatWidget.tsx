import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, ChevronDown } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function ChatWidget() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && user) {
            fetchConversation();
        }
    }, [isOpen, !!user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        let interval: any;
        if (isOpen && conversation) {
            // Poll for messages every 5 seconds
            interval = setInterval(() => {
                fetchMessages(conversation._id);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isOpen, conversation]);

    const fetchConversation = async () => {
        try {
            const res = await api.get('/support/conversations');
            if (res.data.data && res.data.data.length > 0) {
                const activeConv = res.data.data[0]; // Just take the latest one
                setConversation(activeConv);
                fetchMessages(activeConv._id);
            }
        } catch (error) {
            console.error('Failed to fetch conversation', error);
        }
    };

    const fetchMessages = async (id: string) => {
        try {
            const res = await api.get(`/support/messages/${id}`);
            // Use a functional update to avoid stale state and ensure uniqueness
            setMessages(prev => {
                const newMessages = res.data.data;
                if (JSON.stringify(prev) === JSON.stringify(newMessages)) return prev;
                return newMessages;
            });
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !user) return;

        const text = message.trim();
        setMessage('');

        try {
            let res;
            if (!conversation) {
                // Start new conversation
                res = await api.post('/support/start', { text });
                const newConv = res.data.data.conversation;
                const newMessage = res.data.data.message;
                setConversation(newConv);
                setMessages(prev => [...prev, newMessage]);
            } else {
                // Send to existing
                res = await api.post(`/support/send/${conversation._id}`, { text });
                const newMessage = res.data.data;
                setMessages(prev => [...prev, newMessage]);
            }
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-8 right-8 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-white w-80 sm:w-96 h-[500px] mb-4 rounded-[32px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-black p-6 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                    <MessageCircle className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">Serra Support</h3>
                                    <p className="text-white/50 text-[10px] uppercase tracking-widest font-black">Online Now</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ChevronDown className="h-5 w-5 text-white" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 scrollbar-hide">
                            {messages.length === 0 && !isLoading && (
                                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                                    <div className="h-16 w-16 bg-white rounded-[24px] shadow-sm flex items-center justify-center mb-4">
                                        <User className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-1">How can we help?</h4>
                                    <p className="text-xs text-gray-400">Send us a message and our team will get back to you soon.</p>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <div 
                                    key={msg._id || idx}
                                    className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-[24px] px-4 py-3 text-sm shadow-sm ${
                                        msg.sender._id === user._id 
                                        ? 'bg-black text-white rounded-br-none' 
                                        : 'bg-white text-gray-900 rounded-bl-none border border-gray-100'
                                    }`}>
                                        <p className="leading-relaxed">{msg.text}</p>
                                        <p className={`text-[9px] mt-1 font-bold ${
                                            msg.sender._id === user._id ? 'text-white/40' : 'text-gray-400'
                                        }`}>
                                            {format(new Date(msg.createdAt), 'hh:mm a')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-50 flex items-center space-x-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!message.trim()}
                                className="h-10 w-10 bg-black text-white rounded-2xl flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-16 w-16 rounded-[28px] shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-90 shadow-black/20 group relative overflow-hidden ${
                    isOpen ? 'bg-white text-black' : 'bg-black text-white'
                }`}
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>
        </div>
    );
}

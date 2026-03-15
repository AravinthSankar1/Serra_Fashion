import { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import PremiumLoader from '../../components/ui/PremiumLoader';
import { format } from 'date-fns';
import { cn } from '../../utils';

export default function AdminSupport() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConv, setSelectedConv] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isMessageLoading, setIsMessageLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        let interval = setInterval(() => {
            fetchConversations();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let interval: any;
        if (selectedConv) {
            interval = setInterval(() => {
                fetchMessages(selectedConv._id);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [selectedConv]);

    useEffect(() => {
        if (selectedConv) {
            fetchMessages(selectedConv._id);
        }
    }, [selectedConv]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/support/conversations');
            setConversations(prev => {
                if (JSON.stringify(prev) === JSON.stringify(res.data.data)) return prev;
                return res.data.data;
            });
            if (res.data.data.length > 0 && !selectedConv) {
                // setSelectedConv(res.data.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (id: string) => {
        try {
            const res = await api.get(`/support/messages/${id}`);
            setMessages(prev => {
                if (JSON.stringify(prev) === JSON.stringify(res.data.data)) return prev;
                return res.data.data;
            });
            // Mark as read happens server-side during getMessages
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setIsMessageLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedConv || !user) return;

        const text = messageText.trim();
        setMessageText('');

        try {
            const res = await api.post(`/support/send/${selectedConv._id}`, { text });
            setMessages([...messages, res.data.data]);
            fetchConversations();
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const customer = conv.participants.find((p: any) => p.role === 'customer') || 
                          conv.participants.find((p: any) => p._id !== user?._id);
        
        if (!customer) return true; // Show if we can't determine, better than hiding

        if (!searchTerm) return true;

        return customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (isLoading) return <PremiumLoader text="Connecting to Support Center..." />;

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-gray-900">Support Center</h1>
                    <p className="text-gray-500 mt-1">Manage customer queries and real-time conversations</p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex">
                {/* Conversation List Sidebar */}
                <div className="w-80 sm:w-96 border-r border-gray-50 flex flex-col bg-gray-50/30">
                    <div className="p-6 border-b border-gray-50">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by customer name..."
                                className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 pl-11 pr-5 text-xs focus:ring-2 focus:ring-black/5"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                        {filteredConversations.length === 0 ? (
                            <div className="py-20 text-center px-6">
                                <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                                <p className="text-xs text-gray-400 font-medium">No active support requests found.</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => {
                                const customer = conv.participants.find((p: any) => p.role === 'customer') || 
                                               conv.participants.find((p: any) => p._id !== user?._id);
                                const isSelected = selectedConv?._id === conv._id;
                                const hasUnread = conv.lastMessage?.sender?._id !== user?._id && !conv.lastMessage?.isRead;

                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => setSelectedConv(conv)}
                                        className={cn(
                                            "w-full p-4 rounded-[28px] text-left transition-all relative group",
                                            isSelected ? "bg-black text-white shadow-xl shadow-black/10 scale-[1.02]" : "bg-white hover:bg-gray-100/50 text-gray-900 border border-gray-100 shadow-sm"
                                        )}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={cn(
                                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 text-lg font-bold border",
                                                isSelected ? "bg-white/10 border-white/20 text-white" : "bg-gray-50 border-gray-100 text-black"
                                            )}>
                                                {customer?.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between space-x-2">
                                                    <h4 className="text-xs font-black uppercase tracking-widest truncate">{customer?.name || 'Anonymous User'}</h4>
                                                    <span className={cn(
                                                        "text-[8px] font-bold uppercase",
                                                        isSelected ? "text-white/40" : "text-gray-400"
                                                    )}>
                                                        {conv.updatedAt && format(new Date(conv.updatedAt), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <p className={cn(
                                                    "text-[10px] mt-0.5 line-clamp-1",
                                                    isSelected ? "text-white/60" : "text-gray-500",
                                                    hasUnread && !isSelected && "font-bold text-black"
                                                )}>
                                                    {conv.lastMessage?.text || 'No messages yet'}
                                                </p>
                                            </div>
                                            {hasUnread && !isSelected && (
                                                <div className="absolute top-4 right-4 h-2 w-2 bg-black rounded-full" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-xl font-bold">
                                        {selectedConv.participants.find((p: any) => p._id !== user?._id)?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">
                                            {selectedConv.participants.find((p: any) => p._id !== user?._id)?.name}
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Thread</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="px-3 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-bold uppercase tracking-widest rounded-full border border-gray-100 flex items-center space-x-1.5">
                                        <Clock className="h-3 w-3" />
                                        <span>Status: OPEN</span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide bg-gray-50/30">
                                {isMessageLoading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <PremiumLoader size="sm" text="Syncing messages..." />
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div 
                                            key={msg._id || idx}
                                            className={cn(
                                                "flex flex-col",
                                                msg.sender._id === user?._id ? "items-end" : "items-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "max-w-[70%] px-6 py-4 rounded-[32px] shadow-sm text-sm border",
                                                msg.sender._id === user?._id 
                                                ? "bg-black text-white border-black rounded-tr-none" 
                                                : "bg-white text-gray-900 border-gray-100 rounded-tl-none"
                                            )}>
                                                <p className="leading-relaxed">{msg.text}</p>
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-2 px-2">
                                                {format(new Date(msg.createdAt), 'MMM dd, hh:mm a')}
                                                {msg.sender._id === user?._id && (
                                                    <span className="ml-2 inline-flex items-center">
                                                        {msg.isRead ? <CheckCircle className="h-2.5 w-2.5 text-emerald-500" /> : <div className="h-1 w-1 bg-gray-300 rounded-full" />}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input */}
                            <div className="p-8 border-t border-gray-50">
                                <form onSubmit={handleSendMessage} className="relative">
                                    <textarea
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="Type your response to the customer..."
                                        className="w-full bg-gray-50 border-none rounded-[32px] py-6 px-8 text-sm focus:ring-4 focus:ring-black/5 outline-none transition-all min-h-[120px] resize-none pr-32"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e as any);
                                            }
                                        }}
                                    />
                                    <div className="absolute right-4 bottom-4">
                                        <button
                                            type="submit"
                                            disabled={!messageText.trim()}
                                            className="px-8 py-4 bg-black text-white rounded-2xl flex items-center space-x-3 disabled:opacity-30 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/20"
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Send Reply</span>
                                            <Send className="h-4 w-4" />
                                        </button>
                                    </div>
                                </form>
                                <p className="text-[10px] text-gray-400 mt-4 text-center">
                                    Press <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">Enter</kbd> to send, <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 font-mono">Shift + Enter</kbd> for a new line.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20 bg-gray-50/10">
                            <div className="h-24 w-24 bg-white rounded-[40px] shadow-sm flex items-center justify-center mb-8 border border-gray-100 transform -rotate-12">
                                <MessageSquare className="h-10 w-10 text-gray-200" />
                            </div>
                            <h2 className="text-2xl font-serif text-gray-900 mb-2">No Conversation Selected</h2>
                            <p className="text-sm text-gray-400 max-w-sm mb-10">
                                Choose a customer from the left sidebar to start responding to their queries and providing real-time support.
                            </p>
                            <div className="flex gap-4">
                                <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center space-y-2">
                                    <p className="text-2xl font-serif text-black">{conversations.filter(c => c.lastMessage?.sender?._id !== user?._id && !c.lastMessage?.isRead).length}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Unread Messages</p>
                                </div>
                                <div className="p-6 bg-white rounded-3xl border border-gray-100 text-center space-y-2">
                                    <p className="text-2xl font-serif text-black">{conversations.length}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Threads</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

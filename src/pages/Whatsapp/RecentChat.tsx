'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search,
    MessageCircle,
    ChevronLeft,
    ChevronRight,
    Phone,
    MoreVertical,
    Clock,
    CheckCheck,
    AlertCircle,
    User,
    Filter,
    X,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../axiosInstance';
import WhatsAppChat from './WsChating';
import { toast } from 'react-toastify';

// Types
interface LeadInfo {
    _id: string;
    fullName: string;
    email: string;
    phone10: string;
    status: string;
    source: string;
    assignedCounselor?: string;
    createdAt: string;
}

interface CounselorInfo {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
}

interface LastMessage {
    _id: string;
    message: string;
    sender: 'user' | 'system';
    status: string;
    sentAt: string;
    createdAt: string;
    mediaUrl?: string;
    mediaType?: string;
    templateName?: string;
}

interface ChatItem {
    _id: string;
    lastMessage: LastMessage;
    messageCount: number;
    unreadCount: number;
    lastMessageTime: string;
    leadInfo?: LeadInfo;
    counselorInfo?: CounselorInfo;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
}

// Helper to format time for chat list
const formatChatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

// Truncate message preview
const truncateMessage = (text: string, maxLength: number = 35) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Get status icon for last message
const LastMessageStatus = ({ status, sender }: { status: string; sender: string }) => {
    if (sender !== 'system') return null;

    switch (status) {
        case 'delivered':
            return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
        case 'read':
            return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
        case 'sending':
            return <Clock className="h-3.5 w-3.5 text-gray-400 animate-pulse" />;
        case 'failed':
            return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
        default:
            return null;
    }
};

// Skeleton loader for chat list
const ChatSkeleton = () => (
    <div className="flex items-center gap-3 p-4 border-b border-gray-100 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
        <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-12"></div>
    </div>
);

// Search and filter bar component
const SearchFilterBar = ({
    searchTerm,
    onSearchChange,
    onRefresh,
    isLoading
}: {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onRefresh: () => void;
    isLoading: boolean;
}) => {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <div className="p-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by phone number or name..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp/50 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => onSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    {/* <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl transition-colors ${showFilters ? 'bg-whatsapp text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        <Filter className="h-5 w-5" />
                    </button> */}
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                        >
                            <div className="flex gap-2 flex-wrap">
                                <button className="px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                    All Chats
                                </button>
                                <button className="px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                    Unread
                                </button>
                                <button className="px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                    Assigned to me
                                </button>
                                <button className="px-3 py-1.5 text-xs bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                    Without Lead
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Single chat item component
const ChatListItem = ({
    chat,
    isActive,
    onClick
}: {
    chat: ChatItem;
    isActive: boolean;
    onClick: () => void;
}) => {
    const displayName = chat.leadInfo?.fullName || chat._id;
    const displayPhone = chat.leadInfo?.phone10 || chat._id;
    const lastMsgText = chat.lastMessage?.message || '';
    const isUserMessage = chat.lastMessage?.sender === 'user';
    const hasMedia = chat.lastMessage?.mediaUrl;

    let previewText = '';
    if (hasMedia && !lastMsgText) {
        previewText = chat.lastMessage?.mediaType === 'image' ? '📷 Photo' :
            chat.lastMessage?.mediaType === 'video' ? '📹 Video' :
                chat.lastMessage?.mediaType === 'audio' ? '🎵 Audio' : '📎 Attachment';
    } else {
        previewText = truncateMessage(lastMsgText, 40);
    }

    if (isUserMessage && previewText) {
        previewText = `👤 ${previewText}`;
    }

    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer transition-all ${isActive ? 'bg-gray-200 border-l-4 border-l-gray-900' : 'bg-white hover:bg-gray-50'}`}
        >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full [bg-[#25D366] border-2 flex items-center justify-center text-gray-400 font-semibold text-lg shadow-sm">
                    {displayName.charAt(0).toUpperCase()}
                </div>
                {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-gray-800 text-sm truncate max-w-[140px] sm:max-w-[200px]">
                        {displayName}
                    </h3>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                        {formatChatTime(chat.lastMessageTime)}
                    </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                    {chat.lastMessage && (
                        <LastMessageStatus status={chat.lastMessage.status} sender={chat.lastMessage.sender} />
                    )}
                    <p className="text-xs text-gray-500 truncate flex-1">
                        {previewText || 'No messages yet'}
                    </p>
                </div>
                {chat.leadInfo?.assignedCounselor && (
                    <div className="">
                        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {chat.counselorInfo?.name || 'Assigned'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Empty state component
const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No conversations yet</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-xs">
            When leads message you, their conversations will appear here
        </p>
        <button
            onClick={onRefresh}
            className="px-4 py-2 bg-whatsapp text-white rounded-full text-sm font-medium flex items-center gap-2 hover:bg-whatsappDark transition-colors"
        >
            <RefreshCw className="h-4 w-4" />
            Refresh
        </button>
    </div>
);

// Main Chats Page Component
export default function ChatsPage() {
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false,
    });
    const [loadingMore, setLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Fetch chats from API
    const fetchChats = useCallback(async (page = 1, isLoadMore = false) => {
        if (isLoadMore && loadingMore) return;
        if (!isLoadMore) setLoading(true);
        else setLoadingMore(true);

        try {
            const params: any = {
                page,
                limit: 50,
            };
            if (searchTerm) {
                params.search = searchTerm;
            }

            const response = await api.get('/msg/recentChats', { params });

            if (response.data.success) {
                const newChats = response.data.data;
                const newPagination = response.data.pagination;

                if (isLoadMore) {
                    setChats(prev => [...prev, ...newChats]);
                } else {
                    setChats(newChats);
                }
                setPagination(newPagination);
            }
        } catch (error) {
            console.error('Failed to fetch chats:', error);
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchTerm]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchChats(1, false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Initial load
    useEffect(() => {
        fetchChats(1, false);
    }, []);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && pagination.hasMore && !loading && !loadingMore) {
                    fetchChats(pagination.page + 1, true);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [pagination.hasMore, loading, loadingMore, pagination.page]);

    const handleNewMessage = useCallback((newMessage: any) => {
        fetchChats(1, false);
    }, []);

    // Filter chats by search term (already handled by API, but client-side filter as backup)
    const filteredChats = chats.filter(chat => {
        if (!searchTerm) return true;
        const phone = chat._id || '';
        const name = chat.leadInfo?.fullName || '';
        return phone.includes(searchTerm) || name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="flex h-[88vh] bg-gray-50 overflow-hidden font-sans rounded-2xl">
            <div className={`${selectedChat ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[380px] xl:w-[420px] bg-white border-r border-gray-200 shadow-sm h-full overflow-hidden`}>
                <div className="bg-whatsapp px-4 py-4 flex items-center justify-between bg-[#25D366] ">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-white font-semibold text-lg">Chats</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <Phone className="h-5 w-5 text-white" />
                        </button>
                        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <MoreVertical className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>
                <SearchFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onRefresh={() => fetchChats(1, false)}
                    isLoading={loading}
                />

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {loading && chats.length === 0 ? (
                        Array.from({ length: 8 }).map((_, i) => <ChatSkeleton key={i} />)
                    ) : filteredChats.length === 0 ? (
                        <EmptyState onRefresh={() => fetchChats(1, false)} />
                    ) : (
                        <>
                            <AnimatePresence>
                                {filteredChats.map((chat) => (
                                    <ChatListItem
                                        key={chat._id}
                                        chat={chat}
                                        isActive={selectedChat?._id === chat._id}
                                        onClick={() => setSelectedChat(chat)}
                                    />
                                ))}
                            </AnimatePresence>

                            {/* Load more trigger */}
                            {pagination.hasMore && (
                                <div ref={observerTarget} className="py-4 flex justify-center">
                                    {loadingMore && (
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-whatsapp rounded-full animate-spin"></div>
                                            Loading more...
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* End of list */}
                            {!pagination.hasMore && chats.length > 0 && (
                                <div className="text-center py-4 text-xs text-gray-400">
                                    You've seen all conversations
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Chat Detail Panel */}
            <div className={`${selectedChat ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-gray-50 overflow-hidden`}>
                {selectedChat ? (
                    <div className="flex-1 flex flex-col h-full">
                        <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedChat(null)}
                                    className="lg:hidden p-2 -ml-2 rounded-full hover:bg-gray-100"
                                >
                                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                                </button>
                                <div className="w-10 h-10 rounded-full  flex items-center justify-center text-white font-semibold">
                                    {selectedChat.leadInfo?.fullName?.charAt(0) || selectedChat._id.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-gray-800">
                                        {selectedChat.leadInfo?.fullName || 'Unknown User'}
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        {selectedChat.leadInfo?.phone10 || selectedChat._id}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <Phone className="h-5 w-5 text-gray-600" />
                                </button>
                                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <MoreVertical className="h-5 w-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* WhatsApp Chat Component - integrated */}
                        <WhatsAppChat
                            lead={selectedChat.leadInfo ? {
                                _id: selectedChat.leadInfo._id,
                                fullName: selectedChat.leadInfo.fullName,
                                phone10: selectedChat.leadInfo.phone10,
                                email: selectedChat.leadInfo.email,
                                status: selectedChat.leadInfo.status,
                                source: selectedChat.leadInfo.source,
                            } : {
                                _id: selectedChat._id,
                                fullName: selectedChat._id,
                                phone10: selectedChat._id,
                                email: '',
                                status: '',
                                source: '',
                            }}
                            onClose={() => setSelectedChat(null)}
                            onNewMessage={handleNewMessage}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-gray-50 to-white">
                        <div className="w-28 h-28 bg-whatsapp/10 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle className="h-12 w-12 text-whatsapp" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to WhatsApp Chat</h3>
                        <p className="text-gray-500 max-w-md text-sm">
                            Select a conversation from the left to start messaging with your leads.
                            Send templates, media, and manage all your communications here.
                        </p>
                        <div className="mt-6 flex gap-2 text-xs text-gray-400">
                            <span className="px-2 py-1 bg-gray-100 rounded-full">💬 Real-time messages</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full">📎 Media sharing</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full">📝 Template picker</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
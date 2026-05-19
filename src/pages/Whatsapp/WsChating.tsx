// frontend/src/components/WhatsAppChat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    Paper,
    TextField,
    IconButton,
    CircularProgress,
    Tooltip,
    Menu,
    MenuItem,
    Button,
    Typography,
    Avatar
} from '@mui/material';
import {
    Send,
    Phone,
    Video,
    Info,
    Check,
    Clock,
    AlertCircle,
    ChevronLeft,
    Grid3x3,
    Paperclip,
    CheckCheck,
    FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../axiosInstance';
import { toast } from 'react-toastify';
import TemplatePicker from './TemplatePicker';


const getStatusIcon = (status) => {
    switch (status) {
        case 'sent':
            return <Check className="h-3 w-3 text-gray-400" />;
        case 'delivered':
            return <CheckCheck className="h-3 w-3 text-gray-500" />;
        case 'read':
            return <CheckCheck className="h-3 w-3 text-blue-500" />;
        case 'sending':
            return <Clock className="h-3 w-3 text-gray-400 animate-pulse" />;
        case 'failed':
            return <AlertCircle className="h-3 w-3 text-red-500" />;
        default:
            return <Check className="h-3 w-3 text-gray-400" />;
    }
};

const getMediaIdFromUrl = (url) => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.searchParams.get("mid");
    } catch (error) {
        return null;
    }
};


const MessageBubble = React.memo(({ message, isOwn, lead }) => {
    const isTemplate = message.templateName;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${isOwn ? 'justify-start' : 'justify-end'} mb-2`}
        >
            {isOwn && (
                <Avatar
                    sx={{ width: 32, height: 32, mr: 1, bgcolor: '#25D366' }}
                    className="flex-shrink-0"
                >
                    {lead?.fullName?.charAt(0) || 'A'}
                </Avatar>
            )}

            <div className={`max-w-[350px] min-w-none ${isOwn ? 'items-end' : 'items-end'}`}>
                {isTemplate && (
                    <div className="text-xs text-gray-500 mb-1 ml-1">
                        Template: {message.templateName}
                    </div>
                )}

                <div
                    className={`relative px-3 py-2 rounded-2xl ${isOwn
                        ? 'bg-gray-100 text-gray-900 rounded-tl-none'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tr-none border border-gray-200 dark:border-gray-700'
                        }`}
                >
                    {message.mediaUrl && (
                        <div className="mb-2">
                            {/* IMAGE */}
                            {message.mediaType === "image" && (
                                <img
                                    src={message.sender === "user" ? `https://server.gatewayabroadeducations.com/api/v1/ws/media/${getMediaIdFromUrl(message.mediaUrl)}` : `https://server.gatewayabroadeducations.com/uploads/${message.mediaUrl}`}
                                    alt="media"
                                    className="rounded-lg max-h-64 object-cover"
                                />
                            )}
                            {!message.mediaType && (
                                <img
                                    src={message.sender === "user" ? `https://server.gatewayabroadeducations.com/api/v1/ws/media/${getMediaIdFromUrl(message.mediaUrl)}` : `https://server.gatewayabroadeducations.com/uploads/${message.mediaUrl}`}
                                    alt="media"
                                    className="rounded-lg max-h-64 object-cover"
                                />
                            )}
                            {message.mediaType === "video" && (
                                <video
                                    controls
                                    className="rounded-lg max-h-64"
                                >
                                    <source src={message.sender === "user" ? `https://server.gatewayabroadeducations.com/api/v1/ws/media/${getMediaIdFromUrl(message.mediaUrl)}` : `https://server.gatewayabroadeducations.com/uploads/${message.mediaUrl}`} />
                                </video>
                            )}
                            {message.mediaType === "audio" && (
                                <audio controls className="w-full">
                                    <source src={message.sender === "user" ? `https://server.gatewayabroadeducations.com/api/v1/ws/media/${getMediaIdFromUrl(message.mediaUrl)}` : `https://server.gatewayabroadeducations.com/uploads/${message.mediaUrl}`} />
                                </audio>
                            )}
                            {message.mediaType === "document" && (
                                <a
                                    href={message.sender === "user" ? `https://server.gatewayabroadeducations.com/api/v1/ws/media/${getMediaIdFromUrl(message.mediaUrl)}` : `https://server.gatewayabroadeducations.com/uploads/${message.mediaUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg"
                                >
                                    <FileText className="h-5 w-5" />
                                    <span>
                                        {message.message || "Open Document"}
                                    </span>
                                </a>
                            )}
                        </div>
                    )}

                    <div className="whitespace-pre-wrap text-[13px] break-words">
                        {message.message}
                    </div>

                    <div className={`flex justify-end font-medium items-right gap-1 mt-1 text-[11px] ${!isOwn ? 'text-gray/80' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                        <span>{message.formattedTime}</span>
                        {!isOwn && getStatusIcon(message.status)}
                    </div>
                </div>

                {message.error && (
                    <div className="text-xs text-red-500 mt-1 ml-1">
                        Failed to send: {message.error}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

const WhatsAppChat = ({ lead, onClose, onNewMessage }) => {
    const [messages, setMessages] = useState({});
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [nextCursor, setNextCursor] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const observerTarget = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef(null);


    useEffect(() => {
        // if (!lead?._id) return;
        fetchMessages(null, true);
        const interval = setInterval(() => {
            fetchMessages();
        }, 5000);
        return () => clearInterval(interval);
    }, [lead]);

    // Setup intersection observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    loadMoreMessages();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, messages]);

    const fetchMessages = async (cursor = null, forceBottom = false) => {
        try {
            const response = await api.get(`/ws/message/${lead._id || lead.phone10}`, {
                params: { cursor, limit: 50 }
            });

            if (response.data.success) {
                const { messages: newMessages, pagination } = response.data.data;

                if (cursor) {
                    setMessages(prev => ({
                        ...newMessages,
                        ...prev
                    }));
                } else {
                    // Initial load
                    setMessages(newMessages);
                }

                setHasMore(pagination.hasMore);
                setNextCursor(pagination.nextCursor);
            }
            forceBottom && scrollToBottom();
        } catch (error) {
            console.error("Fetch messages error:", error);
            toast.error("Failed to load messages");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreMessages = async () => {
        if (nextCursor && !loadingMore) {
            setLoadingMore(true);
            await fetchMessages(nextCursor);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Optimistically add message
        const tempMessage = {
            _id: Date.now().toString(),
            message: messageText,
            status: 'sending',
            sentAt: new Date(),
            sender: 'system',
            phoneNumber: lead.phone10,
            formattedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        addMessageToGroup('Today', tempMessage);
        scrollToBottom();

        try {
            const response = await api.put(`/ws/message/${lead._id}`, {
                message: messageText
            });

            if (response.data.success) {
                updateMessageStatus(tempMessage._id, response.data.data);
                onNewMessage?.(response.data.data);
            } else {
                updateMessageStatus(tempMessage._id, { status: 'failed', error: 'Send failed' });
                toast.error("Failed to send message");
            }
        } catch (error) {
            console.error("Send error:", error);
            updateMessageStatus(tempMessage._id, { status: 'failed', error: error.message });
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const sendMediaMessage = async () => {
        if (!selectedFile || sending) return;

        const maxSize = 5 * 1024 * 1024;

        if (selectedFile.size > maxSize) {
            toast.error("File size must be less than 5 MB");
            return;
        }

        const messageText = newMessage.trim();
        setNewMessage('');

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append("file", selectedFile);

            const uploadResponse = await api.post(
                "/upload/single",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            const mediaUrl = uploadResponse.data.url;

            let mediaType = "document";

            if (selectedFile.type.startsWith("image")) {
                mediaType = "image";
            } else if (selectedFile.type.startsWith("video")) {
                mediaType = "video";
            } else if (selectedFile.type.startsWith("audio")) {
                mediaType = "audio";
            }

            const tempMessage = {
                _id: Date.now().toString(),
                message: messageText,
                mediaUrl,
                mediaType,
                status: "sending",
                sender: "system",
                formattedTime: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                })
            };

            addMessageToGroup("Today", tempMessage);

            const response = await api.post(
                `/ws/message/attach/${lead._id} `,
                {
                    mediaType,
                    mediaUrl,
                    caption: messageText,
                    filename: selectedFile.name
                }
            );

            if (response.data.success) {
                updateMessageStatus(
                    tempMessage._id,
                    response.data.data
                );
            }

            setSelectedFile(null);

        } catch (error) {
            console.error(error);
            toast.error("Failed to send media");
        } finally {
            setUploading(false);
        }
    }


    const sendTemplate = async (template, parameters) => {
        setTemplatePickerOpen(false);
        setSending(true);

        // Parse template and replace parameters
        let messagePreview = template.components.find(c => c.type === 'BODY')?.text || '';
        parameters.forEach((param, index) => {
            messagePreview = messagePreview.replace(`{{${index + 1}}}`, param);
        });

        const tempMessage = {
            _id: Date.now().toString(),
            templateName: template.name,
            message: messagePreview,
            status: 'sending',
            sentAt: new Date(),
            sender: 'system',
            phoneNumber: lead.phone10,
            formattedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        addMessageToGroup('Today', tempMessage);
        scrollToBottom();

        try {
            const response = await api.put(`/ws/template/msg/${lead._id}`, {
                templateId: template.id,
                templateName: template.name,
                parameters: parameters,
                language: template.language,
                messagePreview: messagePreview
            });

            if (response.data.success) {
                updateMessageStatus(tempMessage._id, response.data.data);
                onNewMessage?.(response.data.data);
            } else {
                updateMessageStatus(tempMessage._id, { status: 'failed', error: 'Send failed' });
                toast.error("Failed to send template");
            }
        } catch (error) {
            updateMessageStatus(tempMessage._id, { status: 'failed', error: error.message });
            toast.error("Failed to send template");
        } finally {
            setSending(false);
        }
    };

    const addMessageToGroup = (dateKey, message) => {
        setMessages(prev => {
            const newMessages = { ...prev };
            if (!newMessages[dateKey]) {
                newMessages[dateKey] = [];
            }
            newMessages[dateKey] = [...newMessages[dateKey], message];
            return newMessages;
        });
    };

    const updateMessageStatus = (tempId, realMessage) => {
        setMessages(prev => {
            const newMessages = { ...prev };
            for (const dateKey in newMessages) {
                const index = newMessages[dateKey].findIndex(m => m._id === tempId);
                if (index !== -1) {
                    newMessages[dateKey][index] = {
                        ...newMessages[dateKey][index],
                        ...realMessage,
                        status: realMessage.status
                    };
                    break;
                }
            }
            return newMessages;
        });
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <Paper elevation={0} className="max-h-[100%] flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <IconButton onClick={onClose} className="lg:hidden">
                        <ChevronLeft className="h-5 w-5" />
                    </IconButton>
                    <Avatar sx={{ bgcolor: '#25D366', width: 34, height: 34 }}>
                        {lead?.fullName?.charAt(0) || 'C'}
                    </Avatar>
                    <div>
                        <Typography variant="subtitle1" fontSize={"large"} className="font-bold">
                            {lead?.fullName}
                        </Typography>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Tooltip title="Voice Call">
                        <IconButton size="small">
                            <Phone className="h-5 w-5" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Video Call">
                        <IconButton size="small">
                            <Video className="h-5 w-5" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Lead Details">
                        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                            <Info className="h-5 w-5" />
                        </IconButton>
                    </Tooltip>
                </div>
            </div>

            {/* Messages Container */}
            <div
                ref={chatContainerRef}
                className="flex-1 h-full overflow-y-auto px-4 py-3 space-y-4"
                style={{
                    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(37, 211, 102, 0.05) 100%, transparent 100%)',
                    backgroundAttachment: 'fixed'
                }}
            >
                {loading ? (
                    <div className="flex justify-center py-8">
                        <CircularProgress size={40} />
                    </div>
                ) : (
                    <>
                        <div ref={observerTarget} className="min-h-[400px] text-center py-2">
                            {loadingMore && (
                                <CircularProgress size={24} className="text-gray-400" />
                            )}
                            {!hasMore && Object.keys(messages).length > 0 && (
                                <Typography variant="caption" className="text-gray-400">
                                    No more messages
                                </Typography>
                            )}
                        </div>

                        {/* Messages grouped by date */}
                        {Object.entries(messages).map(([dateKey, dateMessages]) => (
                            <div key={dateKey}>
                                <div className="flex justify-center my-4">
                                    <div className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                                        {dateKey}
                                    </div>
                                </div>

                                {dateMessages.map((message) => (
                                    <MessageBubble
                                        key={message._id}
                                        message={message}
                                        isOwn={message.sender === 'user'}
                                        lead={lead}
                                    />
                                ))}
                            </div>
                        ))}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}


            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
                {selectedFile && (
                    <div className="mb-2 p-2 border rounded-lg bg-gray-100 flex items-center justify-between">
                        <div className="text-sm">
                            {selectedFile.name}
                        </div>

                        <Button
                            color="error"
                            size="small"
                            onClick={() => setSelectedFile(null)}
                        >
                            Remove
                        </Button>
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <Tooltip title="Templates">
                        <IconButton
                            onClick={() => setTemplatePickerOpen(true)}
                            className="text-indigo-600"
                        >
                            <Grid3x3 className="h-5 w-5" />
                        </IconButton>
                    </Tooltip>
                    <input
                        type="file"
                        hidden
                        ref={fileInputRef}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (!file) return;

                            const maxSize = 5 * 1024 * 1024;

                            if (file.size > maxSize) {
                                toast.error("Maximum file size is 5 MB");
                                return;
                            }

                            setSelectedFile(file);
                        }}
                    />

                    <Tooltip title="Attach Media">
                        <IconButton onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="h-5 w-5" />
                        </IconButton>
                    </Tooltip>

                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        variant="outlined"
                        size="small"
                        disabled={sending}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                backgroundColor: 'transparent'
                            }
                        }}
                    />

                    <Tooltip title="Send">
                        <IconButton
                            onClick={() => {
                                if (selectedFile) {
                                    sendMediaMessage();
                                } else {
                                    sendMessage();
                                }
                            }}
                            disabled={!newMessage.trim() || sending}
                            sx={{
                                bgcolor: newMessage.trim() ? '#25D366' : 'transparent',
                                color: newMessage.trim() ? 'white' : 'gray',
                                '&:hover': {
                                    bgcolor: newMessage.trim() ? '#128C7E' : 'transparent'
                                }
                            }}
                        >
                            {sending ? <CircularProgress size={20} /> : <Send className="h-5 w-5" />}
                        </IconButton>
                    </Tooltip>
                </div>
            </div>

            {/* Template Picker Dialog */}
            <TemplatePicker
                open={templatePickerOpen}
                onClose={() => setTemplatePickerOpen(false)}
                onSelectTemplate={sendTemplate}
                lead={lead}
            />

            {/* Lead Info Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <MenuItem>
                    <Typography variant="body2">View Lead Details</Typography>
                </MenuItem>
                <MenuItem>
                    <Typography variant="body2">Share Contact</Typography>
                </MenuItem>
                <MenuItem>
                    <Typography variant="body2">Block Contact</Typography>
                </MenuItem>
            </Menu>
        </Paper>
    );
};

export default WhatsAppChat;
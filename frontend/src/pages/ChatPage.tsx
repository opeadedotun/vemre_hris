import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Send, Search, User as UserIcon, Loader2, MessageSquare, Paperclip } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ensureNotificationPermission, notifyNewMessage, shouldNotifyUser } from '../utils/notifications';

interface Colleague {
    id: number;
    full_name: string;
    email: string;
    job_title: string;
    passport: string | null;
    user_id: number | null;
    unread_count?: number;
}

interface Channel {
    id: number;
    name: string;
    type: string;
}

interface Message {
    id: number;
    channel: number;
    sender: number;
    sender_name: string;
    sender_passport?: string | null;
    content: string;
    file_url?: string | null;
    reply_to?: number | null;
    reply_to_snippet?: {
        id: number;
        text: string;
        sender: string;
    } | null;
    is_read?: boolean;
    created_at: string;
}

import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Trash2, CornerUpLeft, Smile, Trash } from 'lucide-react';

const ChatPage: React.FC = () => {
    const { user: authUser } = useAuth();
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [activeColleague, setActiveColleague] = useState<Colleague | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newFile, setNewFile] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // For typing debounce debounce
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const unreadCountRef = useRef<Record<number, number>>({});
    const lastMessageIdRef = useRef<number | null>(null);
    const initialMessagesLoadedRef = useRef(false);
    const initialColleaguesLoadedRef = useRef(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ensureNotificationPermission().catch(() => {});
    }, []);

    useEffect(() => {
        const fetchColleagues = async () => {
            try {
                const collRes = await api.get('/channels/colleagues/');
                const list = collRes.data || [];
                setColleagues(list);

                if (list.length > 0) {
                    const updatedCounts: Record<number, number> = {};
                    const notifyTargets: Colleague[] = [];

                    list.forEach((coll: Colleague) => {
                        const count = coll.unread_count || 0;
                        updatedCounts[coll.id] = count;
                        const previous = unreadCountRef.current[coll.id] || 0;
                        if (initialColleaguesLoadedRef.current && count > previous && activeColleague?.id !== coll.id) {
                            notifyTargets.push(coll);
                        }
                    });

                    unreadCountRef.current = updatedCounts;
                    initialColleaguesLoadedRef.current = true;

                    if (notifyTargets.length > 0 && shouldNotifyUser()) {
                        notifyTargets.forEach((coll) => {
                            notifyNewMessage('New message', `You have a new message from ${coll.full_name}.`, `coll-${coll.id}`).catch(() => {});
                        });
                    }
                }
            } catch (err) {
                console.error('Failed to fetch colleagues', err);
            } finally {
                setLoading(false);
            }
        };
        fetchColleagues();
        const interval = setInterval(fetchColleagues, 5000);
        return () => clearInterval(interval);
    }, [activeColleague?.id]);

    useEffect(() => {
        initialMessagesLoadedRef.current = false;
        lastMessageIdRef.current = null;
    }, [activeChannel?.id]);

    useEffect(() => {
        let interval: any;
        if (activeChannel) {
            const fetchMessagesAndTyping = async () => {
                try {
                    const res = await api.get(`/messages/?channel=${activeChannel.id}`);
                    const nextMessages = res.data || [];
                    setMessages(nextMessages);

                    if (nextMessages.length > 0) {
                        const latest = nextMessages[nextMessages.length - 1] as Message;
                        if (!initialMessagesLoadedRef.current) {
                            lastMessageIdRef.current = latest.id;
                            initialMessagesLoadedRef.current = true;
                        } else if (latest.sender !== authUser?.id && latest.id !== lastMessageIdRef.current) {
                            lastMessageIdRef.current = latest.id;
                            if (shouldNotifyUser()) {
                                const title = latest.sender_name ? `New message from ${latest.sender_name}` : 'New message';
                                const body = latest.content || 'Open chat to view.';
                                notifyNewMessage(title, body, `chan-${activeChannel.id}`).catch(() => {});
                            }
                        } else {
                            lastMessageIdRef.current = latest.id;
                        }
                    }
                    // Check typing status
                    const chanRes = await api.get(`/channels/${activeChannel.id}/`);
                    setTypingUsers(chanRes.data.typing_status || []);
                } catch (err) {
                    console.error('Failed to fetch messages', err);
                }
            };
            fetchMessagesAndTyping();
            interval = setInterval(fetchMessagesAndTyping, 2000);

            // Mark read when channel is opened
            api.post(`/channels/${activeChannel.id}/mark_read/`).catch(() => {});
        }
        return () => clearInterval(interval);
    }, [activeChannel, authUser?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startChat = async (colleague: Colleague) => {
        if (!colleague.user_id) {
            alert(`Cannot start chat: ${colleague.full_name} has no linked user account.`);
            return;
        }
        try {
            const res = await api.post('/channels/get_or_create_direct/', { user_id: colleague.user_id });
            const channel = res.data;
            setActiveChannel(channel);
            setActiveColleague(colleague);
        } catch (err) {
            console.error('Failed to start chat', err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !newFile) || !activeChannel || sending) return;
        setSending(true);

        try {
            const payload = new FormData();
            payload.append('channel', String(activeChannel.id));
            payload.append('content', newMessage.trim() || '[file]');
            if (newFile) payload.append('file_attachment', newFile);
            if (replyingTo) payload.append('reply_to', String(replyingTo.id));

            const res = await api.post('/messages/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMessages((prev) => [...prev, res.data]);
            setNewMessage('');
            setNewFile(null);
            setReplyingTo(null);
            setShowEmojiPicker(false);
            api.post(`/channels/${activeChannel.id}/mark_read/`).catch(() => {});
        } catch (err) {
            console.error('Failed to send message', err);
            alert('Unable to send message right now.');
        } finally {
            setSending(false);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (activeChannel) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                api.post(`/channels/${activeChannel.id}/typing/`).catch(() => {});
            }, 1000);
        }
    };

    const handleDeleteMessage = async (msgId: number) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            await api.delete(`/messages/${msgId}/`);
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (err) {
            alert('Failed to delete message.');
        }
    };

    const handleClearChat = async () => {
        if (!activeChannel) return;
        if (!confirm('Are you sure you want to clear this entire chat history? This cannot be undone.')) return;
        try {
            await api.post(`/channels/${activeChannel.id}/clear_chat/`);
            setMessages([]);
        } catch (err) {
            alert('Failed to clear chat.');
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage(prev => prev + emojiData.emoji);
    };

    const filteredColleagues = colleagues.filter((c) =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.job_title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="font-bold uppercase tracking-widest text-xs">Initializing Chat...</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-56px)] lg:h-[calc(100vh-120px)] bg-white rounded-none lg:rounded-3xl shadow-xl border-0 lg:border lg:border-slate-100 overflow-hidden">

            {/* â”€â”€â”€ Colleague List Panel â”€â”€â”€ */}
            <div className={`flex flex-col bg-slate-50 border-r border-slate-100 ${
                activeChannel ? 'hidden md:flex md:w-80' : 'flex w-full md:w-80'
            }`}>
                {/* Header */}
                <div className="p-4 bg-slate-900">
                    <h2 className="text-base font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                        <MessageSquare size={18} className="text-primary-400" /> Messages
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search colleagues..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-400 outline-none focus:border-primary-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Colleague List */}
                <div className="flex-1 overflow-y-auto">
                    <p className="px-4 pt-4 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">All Colleagues</p>
                    {filteredColleagues.map((coll) => (
                        <button key={coll.id} onClick={() => startChat(coll)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 border-b border-slate-100 last:border-0 transition-colors">
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow shrink-0">
                                {coll.passport ? <img src={coll.passport} alt={coll.full_name} className="w-full h-full object-cover" /> :
                                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-base">{coll.full_name.charAt(0)}</div>}
                            </div>
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="text-sm font-bold text-slate-800 truncate">{coll.full_name}</p>
                                <p className="text-xs text-slate-400 truncate">{coll.job_title}</p>
                            </div>
                            {coll.unread_count && coll.unread_count > 0 ? (
                                <div className="bg-green-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                                    {coll.unread_count > 9 ? '9+' : coll.unread_count}
                                </div>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>

            {/* â”€â”€â”€ Chat Pane â”€â”€â”€ */}
            {activeChannel ? (
                <div className="flex-1 flex flex-col min-w-0" style={{ background: '#e5ddd5' }}>

                    {/* Chat Header */}
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800 text-white shrink-0">
                        <button onClick={() => setActiveChannel(null)} className="md:hidden p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                            {activeColleague?.full_name?.charAt(0) ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">
                                {activeColleague ? activeColleague.full_name : activeChannel.name}
                            </p>
                            <p className="text-xs text-slate-400">
                                {typingUsers.length > 0 ? <span className="text-green-400">typing...</span> : 'tap to view contact'}
                            </p>
                        </div>
                        <button onClick={handleClearChat} className="p-2 rounded-full hover:bg-white/10 transition-colors shrink-0" title="Clear Chat">
                            <Trash2 size={18} className="text-red-400" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                        {messages.map((msg) => {
                            const isMe = msg.sender === authUser?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-2`}>
                                    <div className="group/msg flex items-end gap-1 max-w-[80%]">
                                        {!isMe && (
                                            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-300 shrink-0 mb-1">
                                                {msg.sender_passport ? <img src={msg.sender_passport} alt={msg.sender_name} className="w-full h-full object-cover" /> :
                                                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px] font-bold">{(msg.sender_name || 'U').charAt(0)}</div>}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            {/* Reply snippet */}
                                            {msg.reply_to_snippet && (
                                                <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs border-l-4 ${
                                                    isMe ? 'bg-[#c5e8a4] border-green-600 text-slate-700' : 'bg-white border-blue-500 text-slate-600'
                                                }`}>
                                                    <p className="font-bold">{msg.reply_to_snippet.sender}</p>
                                                    <p className="truncate">{msg.reply_to_snippet.text}</p>
                                                </div>
                                            )}
                                            {/* Bubble */}
                                            <div className={`relative px-3 py-2 rounded-2xl shadow-sm ${
                                                isMe
                                                    ? 'bg-[#dcf8c6] rounded-tr-none'
                                                    : 'bg-white rounded-tl-none'
                                            }`}>
                                                <p className={`text-sm text-slate-800 whitespace-pre-wrap break-words ${
                                                    msg.content.length <= 4 && /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+$/u.test(msg.content.trim()) ? 'text-4xl' : ''
                                                }`}>{msg.content}</p>
                                                {msg.file_url && (
                                                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 underline mt-1">
                                                        <Paperclip size={11} /> attachment
                                                    </a>
                                                )}
                                                {/* Time + read receipt */}
                                                <div className="flex items-center justify-end gap-0.5 mt-0.5">
                                                    <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    {isMe && <span className={`text-xs ${msg.is_read ? 'text-blue-500' : 'text-slate-400'} tracking-[-3px]`}>{msg.is_read ? 'âœ“âœ“' : 'âœ“'}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Action buttons on hover */}
                                        {isMe && (
                                            <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover/msg:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity shrink-0" title="Delete">
                                                <Trash size={13} />
                                            </button>
                                        )}
                                        {!isMe && (
                                            <button onClick={() => setReplyingTo(msg)} className="opacity-0 group-hover/msg:opacity-100 p-1 text-slate-400 hover:text-blue-500 transition-opacity shrink-0" title="Reply">
                                                <CornerUpLeft size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* â”€â”€â”€ Input Toolbar â”€â”€â”€ */}
                    <div className="shrink-0 bg-[#f0f2f5] border-t border-slate-200">
                        {/* Emoji Picker (absolute above toolbar) */}
                        {showEmojiPicker && (
                            <div className="relative">
                                <div className="absolute bottom-0 left-0 right-0 shadow-2xl z-50" style={{ height: 320 }}>
                                    <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={320} />
                                </div>
                            </div>
                        )}

                        {/* Reply Preview */}
                        {replyingTo && (
                            <div className="mx-3 mt-2 mb-1 px-3 py-2 bg-white border-l-4 border-green-500 rounded-lg flex justify-between items-center gap-2">
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-green-700">{replyingTo.sender_name}</p>
                                    <p className="text-xs text-slate-500 truncate">{replyingTo.content}</p>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600 shrink-0 font-bold text-lg leading-none">âœ•</button>
                            </div>
                        )}

                        {/* Input Row */}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-2">
                            {/* Left icons group */}
                            <div className="flex items-center bg-white rounded-full flex-1 min-w-0 shadow-sm border border-slate-200 overflow-hidden">
                                <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-2.5 text-slate-400 hover:text-amber-500 transition-colors shrink-0">
                                    <Smile size={22} />
                                </button>
                                <input
                                    type="text"
                                    placeholder="Type a message"
                                    className="flex-1 min-w-0 py-2.5 pr-2 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                                    value={newMessage}
                                    onChange={handleTyping}
                                />
                                <label className="p-2.5 text-slate-400 hover:text-primary-600 transition-colors cursor-pointer shrink-0">
                                    <Paperclip size={20} />
                                    <input type="file" className="hidden" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
                                </label>
                            </div>
                            {/* Send Button */}
                            <button type="submit" disabled={(!newMessage.trim() && !newFile) || sending}
                                className="w-11 h-11 rounded-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white flex items-center justify-center shrink-0 shadow-md transition-colors">
                                {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            </button>
                        </form>

                        {newFile && (
                            <p className="text-[10px] text-slate-500 pb-1.5 px-4 flex items-center gap-1">
                                <Paperclip size={10} /> {newFile.name}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 hidden md:flex flex-col items-center justify-center text-slate-400 bg-[#e5ddd5]">
                    <MessageSquare size={48} className="mb-4 text-slate-300" />
                    <p className="font-semibold text-slate-500">Select a colleague to start chatting</p>
                </div>
            )}
        </div>
    );
};

export default ChatPage;

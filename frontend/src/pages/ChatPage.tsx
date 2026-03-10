import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Send, Search, User as UserIcon, Loader2, MessageSquare, Paperclip } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface Colleague {
    id: number;
    full_name: string;
    email: string;
    job_title: string;
    passport: string | null;
    user_id: number | null;
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
    created_at: string;
}

const ChatPage: React.FC = () => {
    const { user: authUser } = useAuth();
    const [colleagues, setColleagues] = useState<Colleague[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newFile, setNewFile] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initChat = async () => {
            try {
                const [collRes, chanRes] = await Promise.all([
                    api.get('/channels/colleagues/'),
                    api.get('/channels/'),
                ]);
                setColleagues(collRes.data || []);
                setChannels(chanRes.data || []);
            } catch (err) {
                console.error('Failed to initialize chat', err);
            } finally {
                setLoading(false);
            }
        };
        initChat();
    }, []);

    useEffect(() => {
        let interval: any;
        if (activeChannel) {
            const fetchMessages = async () => {
                try {
                    const res = await api.get(`/messages/?channel=${activeChannel.id}`);
                    setMessages(res.data || []);
                } catch (err) {
                    console.error('Failed to fetch messages', err);
                }
            };
            fetchMessages();
            interval = setInterval(fetchMessages, 3000);
        }
        return () => clearInterval(interval);
    }, [activeChannel]);

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
            if (!channels.find((c) => c.id === channel.id)) {
                setChannels([channel, ...channels]);
            }
            setActiveChannel(channel);
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

            const res = await api.post('/messages/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMessages((prev) => [...prev, res.data]);
            setNewMessage('');
            setNewFile(null);
        } catch (err) {
            console.error('Failed to send message', err);
            alert('Unable to send message right now.');
        } finally {
            setSending(false);
        }
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
        <div className="h-[calc(100vh-120px)] flex bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
                <div className="p-6">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                        <MessageSquare className="text-primary-600" size={24} /> Messages
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Find a colleague..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
                    {channels.length > 0 && (
                        <div>
                            <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Chats</p>
                            <div className="space-y-1">
                                {channels.map((chan) => (
                                    <button
                                        key={chan.id}
                                        onClick={() => setActiveChannel(chan)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-2xl ${activeChannel?.id === chan.id ? 'bg-primary-600 text-white' : 'hover:bg-white text-slate-600'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${activeChannel?.id === chan.id ? 'bg-white/20' : 'bg-primary-50 text-primary-600'}`}>
                                            {chan.name.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="text-sm font-bold truncate">{chan.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">All Colleagues</p>
                        <div className="space-y-1">
                            {filteredColleagues.map((coll) => (
                                <button key={coll.id} onClick={() => startChat(coll)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white text-slate-600">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                                        {coll.passport ? <img src={coll.passport} alt={coll.full_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><UserIcon size={20} /></div>}
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="text-sm font-bold truncate">{coll.full_name}</p>
                                        <p className="text-[10px] text-slate-400 truncate uppercase">{coll.job_title}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {activeChannel ? (
                <div className="flex-1 flex flex-col">
                    <div className="px-8 py-4 bg-white border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">{activeChannel.name}</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/30">
                        {messages.map((msg) => {
                            const isMe = msg.sender === authUser?.id;
                            return (
                                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 mt-auto">
                                        {msg.sender_passport ? (
                                            <img src={msg.sender_passport} alt={msg.sender_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">
                                                {(msg.sender_name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                                        <div className={`px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white' : 'bg-white border border-slate-100 text-slate-700'}`}>
                                            {msg.content}
                                            {msg.file_url && (
                                                <div className="mt-2">
                                                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={`underline text-xs ${isMe ? 'text-white/90' : 'text-primary-600'}`}>
                                                        Open attachment
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest px-1 mt-1">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-6 bg-white border-t border-slate-100">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                            <label className="p-2 text-slate-400 hover:text-primary-600 cursor-pointer">
                                <Paperclip size={22} />
                                <input type="file" className="hidden" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
                            </label>
                            <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit" disabled={(!newMessage.trim() && !newFile) || sending} className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50">
                                {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            </button>
                        </form>
                        {newFile && <p className="text-xs text-slate-500 mt-2">Selected file: {newFile.name}</p>}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
                    <MessageSquare size={40} className="mb-4" />
                    <p>Select a colleague to start a conversation.</p>
                </div>
            )}
        </div>
    );
};

export default ChatPage;

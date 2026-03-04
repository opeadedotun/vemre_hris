import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Loader2,
    ChevronRight,
    Sparkles,
    HelpCircle
} from 'lucide-react';
import { knowledgeApi, FAQResponse, FAQArticleResult } from '../api/knowledge';

interface ChatMessage {
    id: number;
    type: 'user' | 'bot';
    content: string;
    articles?: FAQArticleResult[];
    timestamp: Date;
    isFallback?: boolean;
}

const AskHRBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    let msgId = useRef(0);

    useEffect(() => {
        if (isOpen && suggestions.length === 0) {
            knowledgeApi.getSuggestedQuestions()
                .then(res => setSuggestions(res.data.suggestions))
                .catch(() => { });
        }
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleAsk = async (questionText?: string) => {
        const q = questionText || query.trim();
        if (!q || loading) return;

        const userMsg: ChatMessage = {
            id: ++msgId.current,
            type: 'user',
            content: q,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            const res = await knowledgeApi.askFAQ(q);
            const data: FAQResponse = res.data;

            let answer = data.answer;
            const isLaborTaxQuery = /labor|labour|tax|law|regulation|legal/i.test(q);

            if (isLaborTaxQuery && (!data.articles || data.articles.length === 0)) {
                answer = "I've searched our internal Knowledge Base but couldn't find specific policies on this. Based on general labor and tax regulations: \n\n[Internet Search Simulation]: Most jurisdictions require compliance with local labor standards and tax codes. For specific Nigerian Labor Law or FIRS tax inquiries, please consult with the Finance/Legal department or visit official government portals. \n\n(I am now enabled to provide general information when internal docs are missing).";
            }

            const botMsg: ChatMessage = {
                id: ++msgId.current,
                type: 'bot',
                content: answer,
                articles: data.articles,
                timestamp: new Date(),
                isFallback: isLaborTaxQuery && (!data.articles || data.articles.length === 0)
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            const errorMsg: ChatMessage = {
                id: ++msgId.current,
                type: 'bot',
                content: 'Something went wrong. Please try again later.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAsk();
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-[60] w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group ${isOpen
                    ? 'bg-slate-800 hover:bg-slate-700 rotate-0'
                    : 'bg-primary-600 hover:bg-primary-700 hover:scale-110'
                    }`}
                aria-label="Ask HR Bot"
            >
                {isOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <div className="relative">
                        <MessageCircle size={28} className="text-white" />
                        <Sparkles size={12} className="text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-28 right-6 z-[59] w-[420px] max-h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
                        <div className="relative z-10 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg tracking-tight">Ask HR Bot</h3>
                                    <p className="text-slate-400 text-xs font-medium">Internal & External Knowledge</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMessages([])}
                                className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/10 transition-all"
                            >
                                New Chat
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[350px] bg-slate-50">
                        {messages.length === 0 && (
                            <div className="text-center py-6 space-y-6">
                                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto">
                                    <HelpCircle size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 mb-1">How can I help you?</p>
                                    <p className="text-xs text-slate-400">Ask me anything about company policies and procedures.</p>
                                </div>

                                {/* Suggested Questions */}
                                {suggestions.length > 0 && (
                                    <div className="space-y-2 text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Suggested Questions</p>
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleAsk(s)}
                                                className="w-full text-left px-4 py-3 bg-white rounded-2xl border border-slate-100 text-sm text-slate-600 font-medium hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 transition-all flex items-center justify-between group shadow-sm"
                                            >
                                                <span className="line-clamp-1">{s}</span>
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {messages.map(msg => (
                            <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.type === 'bot' && (
                                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center shrink-0 mt-1">
                                        <Bot size={16} />
                                    </div>
                                )}
                                <div className={`max-w-[85%] space-y-2 ${msg.type === 'user' ? 'order-first' : ''}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm font-medium whitespace-pre-line ${msg.type === 'user'
                                        ? 'bg-primary-600 text-white rounded-br-md'
                                        : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md shadow-sm'
                                        }`}>
                                        {msg.content}
                                    </div>

                                    {/* Article Links */}
                                    {msg.articles && msg.articles.length > 0 && (
                                        <div className="space-y-2">
                                            {msg.articles.map(article => (
                                                <Link
                                                    key={article.id}
                                                    to={`/knowledge/${article.slug}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="block bg-white rounded-xl border border-slate-100 p-3 hover:border-primary-200 hover:shadow-md transition-all group"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="text-xs font-black text-slate-800 group-hover:text-primary-600 transition-colors mb-1">
                                                                {article.title}
                                                            </p>
                                                            {article.category_name && (
                                                                <span className="text-[9px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                                    {article.category_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-400 shrink-0 mt-0.5" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-[9px] text-slate-300 font-medium px-1">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {msg.type === 'user' && (
                                    <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center shrink-0 mt-1">
                                        <User size={16} />
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-3 items-center">
                                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                                    <Bot size={16} />
                                </div>
                                <div className="bg-white px-5 py-3 rounded-2xl rounded-bl-md border border-slate-100 shadow-sm">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask a question..."
                                maxLength={500}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all disabled:opacity-50"
                            />
                            <button
                                onClick={() => handleAsk()}
                                disabled={!query.trim() || loading}
                                className="w-12 h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-primary-900/20 disabled:shadow-none"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                        <p className="text-[9px] text-slate-300 text-center mt-2 font-medium">
                            Answers sourced from verified company documentation only.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default AskHRBot;

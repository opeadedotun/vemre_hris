import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    MessageSquare,
    Send,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    Plus,
    Loader2,
    Filter,
    ArrowLeft
} from 'lucide-react';

interface TicketMessage {
    id: number;
    sender: number;
    sender_name: string;
    message: string;
    created_at: string;
    attachment: string | null;
}

interface HRTicket {
    id: number;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    assigned_to: number | null;
    assigned_to_name: string | null;
    created_at: string;
    updated_at: string;
    messages: TicketMessage[];
}

interface HelpdeskTabProps {
    employeeId: number;
    isAdminView?: boolean;
    mineOnly?: boolean;
}

const HelpdeskTab: React.FC<HelpdeskTabProps> = ({ employeeId, isAdminView = false, mineOnly = false }) => {
    const [tickets, setTickets] = useState<HRTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<HRTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Ticket States
    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        category: 'HR',
        priority: 'MEDIUM'
    });

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const url = mineOnly
                ? '/hr-tickets/?mine=1'
                : isAdminView ? '/hr-tickets/' : `/hr-tickets/?employee=${employeeId}`;
            const response = await api.get(url);
            setTickets(response.data);

            // Update selected ticket details if it's currently open
            if (selectedTicket) {
                const updated = response.data.find((t: HRTicket) => t.id === selectedTicket.id);
                if (updated) setSelectedTicket(updated);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [employeeId, mineOnly, isAdminView]);

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/hr-tickets/', {
                ...newTicket,
                employee: employeeId
            });
            setShowCreateModal(false);
            setNewTicket({
                subject: '',
                description: '',
                category: 'HR',
                priority: 'MEDIUM'
            });
            fetchTickets();
        } catch (error) {
            console.error('Error creating ticket:', error);
        } finally {
            setSending(false);
        }
    };

    const handleAddMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !newMessage.trim()) return;

        setSending(true);
        try {
            await api.post(`/hr-tickets/${selectedTicket.id}/add_message/`, {
                message: newMessage
            });
            setNewMessage('');
            fetchTickets();
        } catch (error) {
            console.error('Error adding message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedTicket) return;
        try {
            await api.patch(`/hr-tickets/${selectedTicket.id}/`, { status });
            fetchTickets();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'CLOSED': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getPriorityStyle = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'text-red-600 font-bold';
            case 'HIGH': return 'text-orange-600 font-bold';
            case 'MEDIUM': return 'text-amber-600 font-bold';
            case 'LOW': return 'text-emerald-600 font-bold';
            default: return 'text-slate-600';
        }
    };

    if (loading && tickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p>Loading tickets...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {selectedTicket ? (
                // Ticket Detail View
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <button
                            onClick={() => setSelectedTicket(null)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Tickets
                        </button>
                        <div className="flex gap-2">
                            {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleUpdateStatus(status)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${selectedTicket.status === status
                                        ? getStatusStyle(status)
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedTicket.subject}</h3>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className={`px-2 py-1 rounded-md border ${getStatusStyle(selectedTicket.status)}`}>
                                        {selectedTicket.status}
                                    </span>
                                    <span className="text-slate-400 font-medium">
                                        Category: <span className="text-slate-700 font-bold">{selectedTicket.category}</span>
                                    </span>
                                    <span className="text-slate-400 font-medium">
                                        Priority: <span className={getPriorityStyle(selectedTicket.priority)}>{selectedTicket.priority}</span>
                                    </span>
                                </div>
                            </div>
                            <div className="text-right text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Ticket #{selectedTicket.id}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 mb-8 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed border border-slate-100">
                            {selectedTicket.description}
                        </div>

                        <div className="space-y-6">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <MessageSquare size={16} className="text-primary-600" />
                                Conversation
                            </h4>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {selectedTicket.messages?.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                        <p className="text-sm">No messages yet. Send a reply below.</p>
                                    </div>
                                ) : (
                                    selectedTicket.messages?.map((msg) => (
                                        <div key={msg.id} className="flex gap-3 items-start">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-[10px] font-bold flex-shrink-0">
                                                {msg.sender_name?.[0] || 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-900">{msg.sender_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(msg.created_at).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-700 shadow-sm">
                                                    {msg.message}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleAddMessage} className="mt-6 flex gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your reply here..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 transition-all shadow-lg shadow-primary-900/20 flex items-center gap-2"
                                >
                                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                // Ticket List View
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                                <MessageSquare className="text-primary-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Support Tickets</h3>
                                <p className="text-xs text-slate-400">Manage employee queries and requests</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-white border border-slate-200 text-primary-600 hover:text-white hover:bg-primary-600 px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Plus size={16} />
                            New Ticket
                        </button>
                    </div>

                    <div className="grid gap-3">
                        {tickets.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 h-64 flex flex-col items-center justify-center text-slate-400 shadow-sm">
                                <MessageSquare size={48} className="opacity-10 mb-4" />
                                <p className="font-medium">No tickets found for this employee</p>
                            </div>
                        ) : (
                            tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-primary-300 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 left-0 w-1 h-full ${ticket.status === 'OPEN' ? 'bg-blue-500' :
                                        ticket.status === 'IN_PROGRESS' ? 'bg-amber-500' :
                                            ticket.status === 'RESOLVED' ? 'bg-green-500' : 'bg-slate-400'
                                        }`} />

                                    <div className="flex justify-between items-start mb-3">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{ticket.subject}</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{ticket.category} • #{ticket.id}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold border-2 ${getStatusStyle(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-500 line-clamp-1 mb-4 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                                        {ticket.description}
                                    </p>

                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                            <span className={`flex items-center gap-1 ${getPriorityStyle(ticket.priority)}`}>
                                                <AlertCircle size={12} />
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <span className="bg-primary-50 text-primary-600 px-2 py-1 rounded-full group-hover:bg-primary-600 group-hover:text-white transition-all">
                                            View Details
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">Create Support Ticket</h3>
                                <p className="text-xs text-slate-400 font-medium">Log a new query for this employee</p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Category</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                        value={newTicket.category}
                                        onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                                    >
                                        <option value="PAYROLL">Payroll Query</option>
                                        <option value="LEAVE">Leave Query</option>
                                        <option value="IT">IT Support</option>
                                        <option value="HR">General HR</option>
                                        <option value="POLICY">Policy Question</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Priority</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-bold"
                                        value={newTicket.priority}
                                        onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                                    >
                                        <option value="LOW" className="text-emerald-600">Low Priority</option>
                                        <option value="MEDIUM" className="text-amber-600">Medium Priority</option>
                                        <option value="HIGH" className="text-orange-600">High Priority</option>
                                        <option value="URGENT" className="text-red-600">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Subject</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Brief title of the issue"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium placeholder:text-slate-300"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Detailed Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Provide as much detail as possible..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium placeholder:text-slate-300 resize-none"
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex-1 bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-900/20 flex items-center justify-center gap-2"
                                >
                                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    Create Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HelpdeskTab;

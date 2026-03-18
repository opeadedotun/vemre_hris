import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Calendar,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    ArrowRight,
    FileText
} from 'lucide-react';

interface LeaveType {
    id: number;
    name: string;
    description: string;
    days_per_year: number;
    is_paid: boolean;
}

interface LeaveRequest {
    id: number;
    leave_type: number;
    leave_type_name: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    created_at: string;
}

const MyLeavesPage: React.FC = () => {
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [newRequest, setNewRequest] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [typesRes, requestsRes] = await Promise.all([
                api.get('/leave-types/'),
                api.get('/leave-requests/?mine=1')
            ]);
            setLeaveTypes(typesRes.data);
            setLeaveRequests(requestsRes.data);
        } catch (error) {
            console.error('Error fetching leave data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/leave-requests/', newRequest);
            setShowApplyModal(false);
            setNewRequest({
                leave_type: '',
                start_date: '',
                end_date: '',
                reason: ''
            });
            fetchData();
        } catch (error) {
            console.error('Error applying for leave:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
            case 'CANCELLED': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (loading && leaveRequests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p>Loading leave records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <Calendar className="text-primary-600" size={32} />
                        My Leave Management
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your time-off requests and balances</p>
                </div>
                <button
                    onClick={() => setShowApplyModal(true)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Apply for Leave
                </button>
            </div>

            {/* Leave Balances / Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {leaveTypes.map((type) => (
                    <div key={type.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Clock size={48} />
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{type.name}</h3>
                        <p className="text-xs text-slate-400 mb-4 line-clamp-1">{type.description}</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yearly Entitlement</p>
                                <p className="text-2xl font-black text-primary-600">{type.days_per_year} Days</p>
                            </div>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                {type.is_paid ? 'PAID' : 'UNPAID'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Request History */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Clock size={18} className="text-slate-400" />
                        Request History
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applied On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {leaveRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        No leave requests found.
                                    </td>
                                </tr>
                            ) : (
                                leaveRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-700 text-sm">{req.leave_type_name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">{new Date(req.start_date).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                                    to {new Date(req.end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-500 line-clamp-1 max-w-xs">{req.reason}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border-2 ${getStatusStyle(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">Apply for Leave</h3>
                                <p className="text-xs text-slate-400 font-medium">Submit a new time-off request</p>
                            </div>
                            <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleApply} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Leave Type</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                    value={newRequest.leave_type}
                                    onChange={(e) => setNewRequest({ ...newRequest, leave_type: e.target.value })}
                                >
                                    <option value="">Select a type...</option>
                                    {leaveTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Start Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                        value={newRequest.start_date}
                                        onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">End Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium"
                                        value={newRequest.end_date}
                                        onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Reason / Notes</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Briefly explain your request..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium placeholder:text-slate-300 resize-none"
                                    value={newRequest.reason}
                                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowApplyModal(false)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-primary-600 text-white py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-900/20 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyLeavesPage;

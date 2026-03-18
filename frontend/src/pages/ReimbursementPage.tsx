import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    CreditCard,
    Search,
    Clock,
    CheckCircle2,
    DollarSign,
    Loader2,
    Filter,
    Check,
    X,
    Receipt,
    Calendar,
    FileText,
    Plus
} from 'lucide-react';

interface Expense {
    id: number;
    employee_name: string;
    category_name: string;
    amount: string;
    date: string;
    description: string;
    status: string;
    attachment: string | null;
    created_at: string;
    payment_reference: string | null;
}

const ReimbursementPage: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // Default to what needs action
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [showReimburseModal, setShowReimburseModal] = useState<Expense | null>(null);
    const [paymentRef, setPaymentRef] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/expenses/');
            setExpenses(res.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReimburse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showReimburseModal) return;
        setProcessingId(showReimburseModal.id);
        try {
            await api.post(`/expenses/${showReimburseModal.id}/reimburse/`, {
                payment_reference: paymentRef
            });
            setShowReimburseModal(null);
            setPaymentRef('');
            fetchData();
        } catch (error) {
            console.error('Error reimbursing expense:', error);
            alert('Failed to process reimbursement. Please ensure all fields are correct.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleStatusUpdate = async (id: number, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            if (action === 'approve') {
                await api.post(`/expenses/${id}/approve/`);
            } else {
                await api.patch(`/expenses/${id}/`, { status: 'REJECTED' });
            }
            fetchData();
        } catch (error) {
            console.error(`Error ${action}ing expense:`, error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch = e.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || e.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'APPROVED': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'PAID': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Reimbursements</h1>
                    <p className="text-slate-500 mt-1">Review, approve, and process employee expense claims.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Awaiting Action', value: expenses.filter(e => e.status === 'PENDING').length, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Ready for Payment', value: expenses.filter(e => e.status === 'APPROVED').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Paid This Month', value: `₦${expenses.filter(e => e.status === 'PAID').reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toLocaleString()}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Claims', value: expenses.length, color: 'text-slate-600', bg: 'bg-slate-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search employee or description..."
                        className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary-500/20 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1">
                    {['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-[2.5rem] border border-slate-100">
                    <Loader2 className="animate-spin mb-4" size={40} />
                    <p className="font-medium tracking-wide">Fetching financial records...</p>
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                    <Receipt size={64} className="mx-auto text-slate-100 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-1">No matching claims</h3>
                    <p className="text-slate-500">Try adjusting your filters or search terms.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase transition-transform group-hover:scale-110">
                                                    {expense.employee_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{expense.employee_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: #{expense.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-700 text-sm">{expense.category_name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{expense.description}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Calendar size={12} className="text-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(expense.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">
                                            ₦{parseFloat(expense.amount).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block min-w-[100px] ${getStatusStyle(expense.status)}`}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-2">
                                                {expense.attachment && (
                                                    <a href={expense.attachment} target="_blank" className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="View Receipt">
                                                        <Receipt size={20} />
                                                    </a>
                                                )}
                                                {expense.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            disabled={processingId === expense.id}
                                                            onClick={() => handleStatusUpdate(expense.id, 'reject')}
                                                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Reject">
                                                            <X size={20} />
                                                        </button>
                                                        <button
                                                            disabled={processingId === expense.id}
                                                            onClick={() => handleStatusUpdate(expense.id, 'approve')}
                                                            className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Approve">
                                                            <Check size={20} />
                                                        </button>
                                                    </>
                                                )}
                                                {expense.status === 'APPROVED' && (
                                                    <button
                                                        disabled={processingId === expense.id}
                                                        onClick={() => setShowReimburseModal(expense)}
                                                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                                                        <DollarSign size={14} /> Pay Now
                                                    </button>
                                                )}
                                                {expense.status === 'PAID' && (
                                                    <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-100">
                                                        <Check size={12} /> Completed
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Reimbursement Modal */}
            {showReimburseModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-emerald-900 mb-1">Process Payment</h3>
                                <p className="text-xs text-emerald-600 font-medium tracking-tight">Finalizing reimbursement for {showReimburseModal.employee_name}</p>
                            </div>
                            <button onClick={() => setShowReimburseModal(null)} className="text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 p-2 rounded-full transition-all">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleReimburse} className="p-8 space-y-6">
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount to Pay</span>
                                    <span className="text-2xl font-black text-emerald-600">₦{parseFloat(showReimburseModal.amount).toLocaleString()}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</span>
                                    <span className="text-xs font-bold text-slate-700">{showReimburseModal.category_name}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Payment Reference / Transaction ID</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input
                                        required
                                        type="text"
                                        placeholder="e.g. TRN-123456789"
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-bold text-sm tracking-widest uppercase placeholder:normal-case font-mono"
                                        value={paymentRef}
                                        onChange={(e) => setPaymentRef(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 pl-1">This will be visible to the employee.</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReimburseModal(null)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingId === showReimburseModal.id}
                                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2"
                                >
                                    {processingId === showReimburseModal.id ? <Loader2 size={18} className="animate-spin" /> : <DollarSign size={18} />}
                                    Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReimbursementPage;

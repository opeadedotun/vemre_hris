import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    CreditCard,
    Plus,
    Search,
    Clock,
    CheckCircle2,
    XCircle,
    Receipt,
    Loader2,
    Filter,
    ArrowRight,
    DollarSign,
    Calendar,
    FileText
} from 'lucide-react';

interface Expense {
    id: number;
    category_name: string;
    amount: string;
    date: string;
    description: string;
    status: string;
    attachment: string | null;
    approved_at: string | null;
    reimbursed_at: string | null;
    payment_reference: string | null;
}

const MyExpensesPage: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [categories, setCategories] = useState<{ id: number, name: string }[]>([]);

    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        attachment: null as File | null
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expRes, catRes] = await Promise.all([
                api.get('/expenses/?mine=1'),
                api.get('/expense-categories/')
            ]);
            setExpenses(expRes.data);
            setCategories(catRes.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('category', formData.category);
            data.append('amount', formData.amount);
            data.append('date', formData.date);
            data.append('description', formData.description);
            if (formData.attachment) {
                data.append('attachment', formData.attachment);
            }

            await api.post('/expenses/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            setFormData({
                category: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                attachment: null
            });
            fetchData();
        } catch (error) {
            console.error('Error submitting expense:', error);
        } finally {
            setSubmitting(false);
        }
    };

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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Expenses</h1>
                    <p className="text-slate-500 mt-1">Submit and track your reimbursement claims.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
                >
                    <Plus size={20} /> New Claim
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Pending', value: expenses.filter(e => e.status === 'PENDING').length, icon: Clock, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Total Paid', value: expenses.filter(e => e.status === 'PAID').length, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Current Month Out', value: `₦${expenses.filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toLocaleString()}`, icon: DollarSign, color: 'bg-primary-50 text-primary-600' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={`${stat.color} p-4 rounded-2xl`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[400px]">
                <div className="flex justify-between items-center mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="Search by description..."
                            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p className="font-medium">Loading claims...</p>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                        <Receipt size={64} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No expenses yet</h3>
                        <p className="text-slate-500 mb-8 max-w-xs mx-auto">Submit your first reimbursement claim by clicking the 'New Claim' button.</p>
                        <button onClick={() => setShowModal(true)} className="text-primary-600 font-bold flex items-center gap-2 mx-auto hover:gap-3 transition-all">Submit First Claim <ArrowRight size={18} /></button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {expenses.filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase())).map(expense => (
                            <div key={expense.id} className="group bg-white rounded-3xl border border-slate-100 p-6 hover:border-primary-300 hover:shadow-xl transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(expense.status)}`}>
                                            {expense.status}
                                        </span>
                                        <span className="text-2xl font-black text-slate-900">₦{parseFloat(expense.amount).toLocaleString()}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-1">{expense.category_name}</h3>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{expense.description}</p>

                                    <div className="space-y-2 py-4 border-y border-slate-50">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                            <Calendar size={14} />
                                            {new Date(expense.date).toLocaleDateString()}
                                        </div>
                                        {expense.payment_reference && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                                <FileText size={14} />
                                                Ref: {expense.payment_reference}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">ID: #{expense.id}</span>
                                    {expense.attachment && (
                                        <a href={expense.attachment} target="_blank" className="text-primary-600 text-xs font-bold flex items-center gap-1 hover:underline">
                                            <Receipt size={14} /> View Receipt
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-1">New Expense Claim</h3>
                                <p className="text-xs text-slate-400 font-medium">Submit your receipts for reimbursement</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-all">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Category</label>
                                    <select
                                        required
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-medium"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Amount (₦)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-bold"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Expense Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-medium"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Receipt/Attachment</label>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="w-full bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-xs text-slate-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100 transition-all font-medium"
                                        onChange={(e) => setFormData({ ...formData, attachment: e.target.files ? e.target.files[0] : null })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="What was this expense for?"
                                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all font-medium placeholder:text-slate-300 resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
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
                                    Submit Claim
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyExpensesPage;

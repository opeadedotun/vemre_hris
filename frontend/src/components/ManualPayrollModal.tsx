import * as React from 'react';
import { useState, useEffect } from 'react';
import { X, User, Hash, Briefcase, Calendar, CreditCard, Loader2, Save, AlertTriangle, Clock } from 'lucide-react';
import api from '../api/axios';

interface Employee {
    id: number;
    full_name: string;
    employee_code: string;
    job_title: string;
    department_name: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    month: string;
    onSuccess: () => void;
}

const ManualPayrollModal: React.FC<Props> = ({ isOpen, onClose, month, onSuccess }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
    const [daysWorked, setDaysWorked] = useState<number>(0);
    const [dailyRate, setDailyRate] = useState<number>(2000);
    const [disciplinaryDays, setDisciplinaryDays] = useState<number>(0);
    const [latenessHours, setLatenessHours] = useState<number>(0);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await api.get('/employees/');
            setEmployees(res.data);
        } catch (err) {
            console.error('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
            setSelectedEmployeeId('');
            setDaysWorked(0);
            setDailyRate(2000);
            setDisciplinaryDays(0);
            setLatenessHours(0);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeId || daysWorked <= 0) return;

        setSubmitting(true);
        try {
            await api.post(`/payroll-runs/create_manual_record/`, {
                employee_id: selectedEmployeeId,
                days_worked: daysWorked,
                daily_rate: dailyRate,
                disciplinary_days: disciplinaryDays,
                lateness_hours: latenessHours,
                month: month
            });
            alert('Manual record created successfully');
            onSuccess();
            onClose();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create manual record');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const selectedEmployee = employees.find(e => String(e.id) === selectedEmployeeId);

    const discDeduction = disciplinaryDays * dailyRate;
    const lateDeduction = latenessHours * (dailyRate / 8);
    const estimatedTotal = (daysWorked * dailyRate) - discDeduction - lateDeduction;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={20} className="text-primary-600" />
                        Manual Payroll Entry
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Select Worker (Field Agent/Casual)</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedEmployee && (
                            <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-primary-600">
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-primary-900">{selectedEmployee.job_title}</p>
                                    <p className="text-[10px] text-primary-600 uppercase font-bold tracking-tight">{selectedEmployee.department_name}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Days Worked</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="0"
                                        value={daysWorked}
                                        onChange={(e) => setDaysWorked(Number(e.target.value))}
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Daily Rate (₦)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                                    <input
                                        type="number"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="2000"
                                        value={dailyRate}
                                        onChange={(e) => setDailyRate(Number(e.target.value))}
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Disciplinary (Days)</label>
                                <div className="relative">
                                    <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={18} />
                                    <input
                                        type="number"
                                        className="w-full pl-10 pr-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none text-red-700"
                                        placeholder="0"
                                        value={disciplinaryDays}
                                        onChange={(e) => setDisciplinaryDays(Number(e.target.value))}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lateness (Hours)</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={18} />
                                    <input
                                        type="number"
                                        className="w-full pl-10 pr-4 py-3 bg-orange-50 border border-orange-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none text-orange-700"
                                        placeholder="0"
                                        value={latenessHours}
                                        onChange={(e) => setLatenessHours(Number(e.target.value))}
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-4 text-white">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Estimated Total Pay (Net)</p>
                            <p className="text-2xl font-black">₦{estimatedTotal.toLocaleString()}</p>
                            {(discDeduction > 0 || lateDeduction > 0) && (
                                <p className="text-[10px] text-red-400 mt-1 font-bold">
                                    Deductions: -₦{(discDeduction + lateDeduction).toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !selectedEmployeeId || daysWorked <= 0}
                            className="flex-1 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Generate Slip
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualPayrollModal;

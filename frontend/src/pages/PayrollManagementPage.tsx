import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { CreditCard, Calendar, Play, CheckCircle, Loader2, Search, FileText, Download } from 'lucide-react';

const PayrollManagementPage: React.FC = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [payrollRun, setPayrollRun] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/v1/payroll-runs/?month=${month}`);
            const runs = res.data;
            if (runs.length > 0) {
                // Fetch the full details of the latest run for this month
                const detailRes = await api.get(`/v1/payroll-runs/${runs[0].id}/`);
                setPayrollRun(detailRes.data);
            } else {
                setPayrollRun(null);
            }
        } catch (err) {
            console.error('Failed to fetch payroll');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, [month]);

    const handleProcess = async () => {
        setProcessing(true);
        try {
            const res = await api.post('/v1/payroll-runs/process/', { month });
            alert(res.data.message);
            fetchPayroll();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to process payroll');
        } finally {
            setProcessing(false);
        }
    };

    const filteredRecords = payrollRun?.records?.filter((r: any) =>
        r.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 text-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Payroll Management</h1>
                    <p className="text-slate-500 text-sm">Automated salary calculation based on attendance</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                        />
                    </div>
                    <button
                        onClick={handleProcess}
                        disabled={processing}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-900/20 disabled:opacity-50 transition-all"
                    >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        Process Payroll
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                    <p>Fetching payroll records...</p>
                </div>
            ) : !payrollRun ? (
                <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <CreditCard size={64} className="text-slate-100 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No Payroll Data</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        Payroll has not been processed for {month}. Click the "Process Payroll" button to generate salary records.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-primary-700 rounded-2xl p-6 text-white shadow-xl shadow-primary-900/30">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-100 opacity-80 mb-1">Total Net Payout</p>
                            <p className="text-3xl font-black mb-6">
                                {payrollRun.records.reduce((sum: number, r: any) => sum + parseFloat(r.net_salary), 0).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs py-2 border-b border-primary-600/50">
                                    <span className="opacity-70">Total Employees</span>
                                    <span className="font-bold">{payrollRun.records.length}</span>
                                </div>
                                <div className="flex justify-between text-xs py-2 border-b border-primary-600/50">
                                    <span className="opacity-70">Month</span>
                                    <span className="font-bold uppercase">{payrollRun.month}</span>
                                </div>
                                <div className="flex justify-between text-xs py-2">
                                    <span className="opacity-70">Status</span>
                                    <span className="font-bold px-2 py-0.5 bg-white/20 rounded text-[10px] uppercase">{payrollRun.status}</span>
                                </div>
                            </div>
                            <button className="w-full mt-6 bg-white text-primary-700 font-bold py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center justify-center gap-2">
                                <CheckCircle size={18} />
                                Approve Payroll
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search records..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                                    <Download size={20} />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <th className="px-6 py-4 text-left">Employee</th>
                                            <th className="px-4 py-4 text-right">Basic + Allow.</th>
                                            <th className="px-4 py-4 text-right">Late Ded.</th>
                                            <th className="px-4 py-4 text-right">Absent Ded.</th>
                                            <th className="px-6 py-4 text-right">Net Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredRecords.map((r: any) => (
                                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-700">{r.employee_name}</p>
                                                </td>
                                                <td className="px-4 py-4 text-right text-xs text-slate-500 font-medium">
                                                    {(parseFloat(r.basic_salary) + parseFloat(r.allowances)).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-4 text-right text-xs text-red-400">
                                                    {r.late_deductions > 0 ? `-${parseFloat(r.late_deductions).toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-4 py-4 text-right text-xs text-red-400">
                                                    {r.absent_deductions > 0 ? `-${parseFloat(r.absent_deductions).toLocaleString()}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-black text-slate-800">{parseFloat(r.net_salary).toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PayrollManagementPage;

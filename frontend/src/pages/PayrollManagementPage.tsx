import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { CreditCard, Calendar, Play, CheckCircle, Loader2, Search, FileText, Download, Eye, Mail, FileDown, Plus } from 'lucide-react';
import PayrollDetailModal from '../components/PayrollDetailModal';
import ManualPayrollModal from '../components/ManualPayrollModal';

const PayrollManagementPage: React.FC = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [payrollRun, setPayrollRun] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // To track which record is being emailed

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/payroll-runs/?month=${month}`);
            const runs = res.data;
            if (runs.length > 0) {
                const detailRes = await api.get(`/payroll-runs/${runs[0].id}/`);
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
            const res = await api.post('/payroll-runs/process/', { month });
            alert(res.data.message);
            fetchPayroll();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to process payroll');
        } finally {
            setProcessing(false);
        }
    };

    const handleDownload = async () => {
        if (!payrollRun) return;
        try {
            const res = await api.get(`/payroll-runs/${payrollRun.id}/download/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `payroll_${payrollRun.month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download payroll.');
        }
    };

    const handleApprove = async () => {
        if (!payrollRun) return;
        if (!confirm(`Are you sure you want to approve the payroll for ${payrollRun.month}?`)) return;

        setProcessing(true);
        try {
            await api.post(`/payroll-runs/${payrollRun.id}/approve/`);
            alert('Payroll approved successfully!');
            fetchPayroll();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to approve payroll');
        } finally {
            setProcessing(false);
        }
    };

    const openDetail = (record: any) => {
        setSelectedRecord(record);
        setIsModalOpen(true);
    };

    const handleDownloadPDF = async (recordId: number, empCode: string) => {
        try {
            const res = await api.get(`/payroll-records/${recordId}/payslip_pdf/`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payslip_${empCode}_${month}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download PDF payslip.');
        }
    };

    const handleSendEmail = async (recordId: number) => {
        setActionLoading(String(recordId));
        try {
            const res = await api.post(`/payroll-records/${recordId}/send_payslip/`);
            alert(res.data.message);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to send email.');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredRecords = payrollRun?.records?.filter((r: any) =>
        r.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const fmt = (val: string | number) => parseFloat(String(val)).toLocaleString();

    return (
        <div className="space-y-6 text-slate-900">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Payroll Management</h1>
                    <p className="text-slate-500 text-sm">Automated salary calculation with NTA 2025 tax compliance</p>
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
                        onClick={() => setIsManualModalOpen(true)}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm"
                    >
                        <Plus size={18} className="text-primary-600" />
                        Manual Payroll
                    </button>
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
                                    <span className="opacity-70">Total Tax</span>
                                    <span className="font-bold">
                                        ₦{payrollRun.records.reduce((sum: number, r: any) => sum + parseFloat(r.tax_deduction || '0'), 0).toLocaleString()}
                                    </span>
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
                            <button
                                onClick={handleApprove}
                                disabled={processing || payrollRun.status !== 'DRAFT'}
                                className="w-full mt-6 bg-white text-primary-700 font-bold py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {processing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                {payrollRun.status === 'DRAFT' ? 'Approve Payroll' : 'Approved'}
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
                                <button
                                    onClick={handleDownload}
                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all flex items-center gap-1"
                                    title="Download CSV"
                                >
                                    <Download size={20} />
                                    <span className="text-xs font-bold hidden md:inline">Download</span>
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                            <th className="px-4 py-4 text-left">Employee</th>
                                            <th className="px-3 py-4 text-right">Basic</th>
                                            <th className="px-3 py-4 text-right">Other Allowances</th>
                                            <th className="px-3 py-4 text-right">Late Ded.</th>
                                            <th className="px-3 py-4 text-right">Tax</th>
                                            <th className="px-4 py-4 text-right">Net Salary</th>
                                            <th className="px-2 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredRecords.map((r: any) => (
                                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openDetail(r)}>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-bold text-slate-700">{r.employee_name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-medium">{r.employee_code}</p>
                                                </td>
                                                <td className="px-3 py-4 text-right text-xs text-slate-500 font-medium">
                                                    {fmt(r.basic_salary)}
                                                </td>
                                                <td className="px-3 py-4 text-right text-xs text-slate-500">
                                                    {fmt(r.other_allowances || 0)}
                                                </td>
                                                <td className="px-3 py-4 text-right text-xs text-red-400">
                                                    {parseFloat(r.late_deductions) > 0 ? `-${fmt(r.late_deductions)}` : '-'}
                                                </td>
                                                <td className="px-3 py-4 text-right text-xs text-orange-500 font-medium">
                                                    {parseFloat(r.tax_deduction || '0') > 0 ? `-${fmt(r.tax_deduction)}` : '-'}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <span className="text-sm font-black text-slate-800">{fmt(r.net_salary)}</span>
                                                </td>
                                                <td className="px-2 py-4">
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDownloadPDF(r.id, r.employee_code); }}
                                                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                            title="Download PDF"
                                                        >
                                                            <FileDown size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSendEmail(r.id); }}
                                                            disabled={actionLoading === String(r.id)}
                                                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all disabled:opacity-50"
                                                            title="Email to Official Email"
                                                        >
                                                            {actionLoading === String(r.id) ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                                        </button>
                                                        <button className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                                                            <Eye size={16} />
                                                        </button>
                                                    </div>
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

            <PayrollDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                record={selectedRecord}
                month={month}
                onEmail={handleSendEmail}
                emailLoading={actionLoading === String(selectedRecord?.id)}
            />

            <ManualPayrollModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                month={month}
                onSuccess={fetchPayroll}
            />
        </div>
    );
};

export default PayrollManagementPage;

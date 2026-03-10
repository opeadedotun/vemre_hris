import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Loader2, Wallet, FileDown } from 'lucide-react';
import logo from '../assets/logo.png';

const MyPayoutPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [runs, setRuns] = useState<any[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [selectedRun, setSelectedRun] = useState<number | ''>('');

    useEffect(() => {
        const run = async () => {
            try {
                const [runsRes, recRes] = await Promise.all([
                    api.get('/payroll-runs/'),
                    api.get('/payroll-records/'),
                ]);
                const runData = runsRes.data || [];
                setRuns(runData);
                setRows(recRes.data || []);
                if (runData.length > 0) {
                    setSelectedRun(runData[0].id);
                }
            } catch (err) {
                console.error('Failed to load payout data', err);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    const runMap = useMemo(() => {
        const map: Record<number, any> = {};
        runs.forEach((r) => {
            map[r.id] = r;
        });
        return map;
    }, [runs]);

    const filteredRows = useMemo(() => {
        if (!selectedRun) return [];
        return rows.filter((r) => r.payroll_run === selectedRun);
    }, [rows, selectedRun]);

    const fmt = (v: any) => Number(v || 0).toLocaleString();

    const downloadPayslip = async (recordId: number, month: string) => {
        try {
            const res = await api.get(`/payroll-records/${recordId}/payslip_pdf/`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `Payslip_${month}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error('Failed to download payslip', err);
            alert('Unable to download this payslip.');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2"><Wallet className="text-primary-600" />My Payout Details</h1>
                <p className="text-slate-500">View your generated payslip by month.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <label className="text-xs font-semibold text-slate-500">Payroll Month</label>
                <select className="mt-2 w-full md:w-80 border border-slate-200 rounded-lg p-2" value={selectedRun} onChange={(e) => setSelectedRun(Number(e.target.value))}>
                    {runs.map((r) => (
                        <option key={r.id} value={r.id}>{r.month} ({r.status})</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="py-16 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" />Loading payroll...</div>
            ) : filteredRows.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                    No payroll records found for this month.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredRows.map((r) => {
                        const run = runMap[r.payroll_run];
                        return (
                            <div key={r.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <img src={logo} alt="Company Logo" className="h-12 w-auto object-contain" />
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Payslip</p>
                                            <p className="text-xl font-extrabold text-slate-900">{run?.month || 'Month'}</p>
                                            <p className="text-sm text-slate-500">{r.employee_name || ''}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary-50 text-primary-700 border border-primary-100">
                                            {run?.status || 'DRAFT'}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Basic</p>
                                        <p className="text-lg font-black text-slate-900">{fmt(r.basic_salary)}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Allowances</p>
                                        <p className="text-lg font-black text-slate-900">{fmt(r.total_allowances)}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lateness</p>
                                        <p className="text-lg font-black text-red-600">-{fmt(r.late_deductions)}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tax</p>
                                        <p className="text-lg font-black text-amber-600">-{fmt(r.tax_deduction)}</p>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Net Salary</p>
                                        <p className="text-2xl font-black text-emerald-700">{fmt(r.net_salary)}</p>
                                    </div>
                                    <button onClick={() => downloadPayslip(r.id, run?.month || 'month')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700">
                                        <FileDown size={16} /> Download Payslip
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyPayoutPage;

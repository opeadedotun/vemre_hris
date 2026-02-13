import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Trophy,
    Search,
    Loader2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Lock,
    Unlock,
    Printer
} from 'lucide-react';

interface PerformanceRecord {
    id: number;
    employee_name: string;
    employee_code: string;
    department_name: string;
    total_score: number;
    performance_rating: string;
    department_rank: number;
    is_locked: boolean;
}

const PerformanceSummaryPage: React.FC = () => {
    const [records, setRecords] = useState<PerformanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    const fetchPerformance = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/v1/performance-summaries/?month=${month}`);
            // In real scenario, the backend would handle sorting/ranking
            // But we'll do a quick sort here if backend doesn't provide rank yet
            const sorted = response.data.sort((a: any, b: any) => b.total_score - a.total_score);
            setRecords(sorted);
        } catch (error) {
            console.error('Error fetching performance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, [month]);

    const toggleLock = async (record: PerformanceRecord) => {
        try {
            await api.patch(`/v1/performance-summaries/${record.id}/`, { is_locked: !record.is_locked });
            fetchPerformance();
        } catch (err) {
            alert('Error toggling lock status');
        }
    };

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case 'EXCELLENT': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'VERY GOOD': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'GOOD': return 'bg-green-100 text-green-700 border-green-200';
            case 'AVERAGE': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'POOR': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Performance Rankings</h1>
                    <p className="text-slate-500 text-sm">Monthly performance leaderboard and ratings</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm font-bold text-slate-600 hover:bg-slate-50 transition-all print:hidden"
                    >
                        <Printer size={18} />
                        Print Report
                    </button>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-sm print:hidden">
                        <Calendar size={18} className="text-slate-400" />
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                        />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 20mm; }
                    body { background: white; }
                    main { margin: 0 !important; padding: 0 !important; }
                    aside { display: none !important; }
                    .print\\:hidden { display: none !important; }
                }
            `}} />

            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <span>Analyzing performance data...</span>
                        </div>
                    ) : records.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Rank</th>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4 text-center">Score</th>
                                    <th className="px-6 py-4">Rating</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.map((record, idx) => (
                                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {idx === 0 && <Trophy size={16} className="text-yellow-500" />}
                                                {idx === 1 && <Trophy size={16} className="text-slate-400" />}
                                                {idx === 2 && <Trophy size={16} className="text-amber-600" />}
                                                <span className={`font-bold ${idx < 3 ? 'text-lg' : 'text-slate-500'}`}>
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-800">{record.employee_name || 'Loading...'}</p>
                                                <p className="text-xs text-slate-400">{record.department_name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-block px-3 py-1 bg-slate-100 rounded-full font-bold text-slate-700">
                                                {record.total_score}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getRatingColor(record.performance_rating)}`}>
                                                {record.performance_rating}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                {record.is_locked ? (
                                                    <span className="flex items-center gap-1 text-slate-400 text-xs italic">
                                                        <Lock size={12} /> Locked
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-primary-600 text-xs">
                                                        <Unlock size={12} /> Open
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleLock(record)}
                                                className={`p-2 rounded-lg transition-all ${record.is_locked
                                                    ? 'text-slate-400 hover:text-primary-600 hover:bg-primary-50'
                                                    : 'text-primary-600 hover:text-slate-700 hover:bg-slate-100'
                                                    }`}
                                                title={record.is_locked ? 'Unlock' : 'Lock Performance'}
                                            >
                                                {record.is_locked ? <Unlock size={18} /> : <Lock size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-20 text-center text-slate-500">
                            <Trophy className="mx-auto mb-4 opacity-20" size={64} />
                            <p>No performance data recorded for this month.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PerformanceSummaryPage;

import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Loader2, BarChart3, Award } from 'lucide-react';

interface KPIRecord {
    id: number;
    month: string;
    kpi_name?: string;
    target_points: string | number;
    actual_points: string | number;
    score_percentage: string | number;
    weighted_score: string | number;
    weight_points?: string | number;
}

interface PerformanceSummary {
    id: number;
    month: string;
    total_score: string | number;
    performance_rating?: string;
    department_rank?: number | null;
    probation_status?: string | null;
    remarks?: string | null;
}

const scoreTone = (score: number) => {
    if (score >= 90) {
        return { text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (score >= 70) {
        return { text: 'text-lime-700', badge: 'bg-lime-50 text-lime-700 border-lime-200' };
    }
    if (score >= 50) {
        return { text: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { text: 'text-red-700', badge: 'bg-red-50 text-red-700 border-red-200' };
};

const scoreText = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-lime-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
};

const MyKPIPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<KPIRecord[]>([]);
    const [summaries, setSummaries] = useState<PerformanceSummary[]>([]);
    const [employee, setEmployee] = useState<any>(null);

    useEffect(() => {
        const run = async () => {
            try {
                const [meRes, kpiRes, perfRes] = await Promise.all([
                    api.get('/employees/me/'),
                    api.get('/employee-kpis/'),
                    api.get('/performance-summaries/'),
                ]);
                setEmployee(meRes.data);
                setRows(kpiRes.data || []);
                setSummaries(perfRes.data || []);
            } catch (err) {
                console.error('Failed to load KPIs', err);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    const summaryByMonth = useMemo(() => {
        const map: Record<string, PerformanceSummary> = {};
        summaries.forEach((s) => {
            map[s.month] = s;
        });
        return map;
    }, [summaries]);

    const grouped = useMemo(() => {
        const map: Record<string, KPIRecord[]> = {};
        rows.forEach((row) => {
            if (!map[row.month]) {
                map[row.month] = [];
            }
            map[row.month].push(row);
        });
        return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
    }, [rows]);

    const formatMonth = (month: string) => {
        try {
            return new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch {
            return month;
        }
    };

    const fmt = (value: string | number | undefined) => Number(value || 0).toLocaleString();

    if (loading) {
        return (
            <div className="py-16 text-center text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2" />
                Loading KPI records...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="text-primary-600" />
                    My KPI Report Card
                </h1>
                <p className="text-slate-500">Your role-based performance records only.</p>
            </div>

            {grouped.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                    No KPI records found yet.
                </div>
            ) : (
                <div className="space-y-6">
                    {grouped.map(([month, items]) => {
                        const summary = summaryByMonth[month];
                        const totalScore = summary?.total_score ?? items.reduce((acc, item) => acc + Number(item.weighted_score || 0), 0);
                        const rating = summary?.performance_rating || 'Pending';
                        const rank = summary?.department_rank;
                        const probation = summary?.probation_status;
                        const tone = scoreTone(Number(totalScore || 0));

                        return (
                            <div key={month} className="bg-white border border-slate-200 rounded-2xl p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Report Card</p>
                                        <h2 className="text-2xl font-extrabold text-slate-900">{formatMonth(month)}</h2>
                                        <p className="text-sm text-slate-500">
                                            {employee?.full_name || employee?.first_name || 'Employee'}
                                            {employee?.job_title ? ` | ${employee.job_title}` : ''}
                                            {employee?.department_name ? ` | ${employee.department_name}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total Score</p>
                                            <p className={`text-3xl font-black ${tone.text}`}>{Number(totalScore || 0).toFixed(2)}</p>
                                        </div>
                                        <div className={`px-3 py-2 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center gap-2 ${tone.badge}`}>
                                            <Award size={14} /> {rating}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Department Rank</p>
                                        <p className="text-lg font-bold text-slate-900">{rank ? `#${rank}` : 'N/A'}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Probation Status</p>
                                        <p className="text-lg font-bold text-slate-900">{probation || 'N/A'}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Remarks</p>
                                        <p className="text-sm font-semibold text-slate-700">{summary?.remarks || 'No remarks yet.'}</p>
                                    </div>
                                </div>

                                <div className="mt-6 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3 text-left">KPI</th>
                                                <th className="px-4 py-3 text-right">Target</th>
                                                <th className="px-4 py-3 text-right">Actual</th>
                                                <th className="px-4 py-3 text-right">Score %</th>
                                                <th className="px-4 py-3 text-right">Weighted</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((r) => {
                                                const itemScore = Number(r.score_percentage || 0);
                                                return (
                                                    <tr key={r.id} className="border-t border-slate-100">
                                                        <td className="px-4 py-3">{r.kpi_name || 'General KPI'}</td>
                                                        <td className="px-4 py-3 text-right">{fmt(r.target_points)}</td>
                                                        <td className="px-4 py-3 text-right">{fmt(r.actual_points)}</td>
                                                        <td className={`px-4 py-3 text-right font-semibold ${scoreText(itemScore)}`}>{fmt(r.score_percentage)}%</td>
                                                        <td className="px-4 py-3 text-right font-semibold">{fmt(r.weighted_score)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyKPIPage;

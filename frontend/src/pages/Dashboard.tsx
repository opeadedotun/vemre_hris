import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Users,
    Target,
    TrendingUp,
    Trophy,
    Loader2,
    ChevronRight,
    BarChart3,
    Landmark,
    Clock,
    Calendar,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/v1/users/stats/');
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-2" size={48} />
            <span className="font-medium">Aggregating enterprise analytics...</span>
        </div>
    );

    const barData = {
        labels: stats?.top_performers.map((p: any) => p.name) || [],
        datasets: [
            {
                label: 'Performance Score',
                data: stats?.top_performers.map((p: any) => p.score) || [],
                backgroundColor: 'rgba(14, 92, 66, 0.8)',
                borderRadius: 8,
            },
        ],
    };

    const pieData = {
        labels: ['Excellent', 'Good', 'Fair', 'Unsatisfactory'],
        datasets: [
            {
                data: [
                    stats?.rating_distribution?.EXCELLENT || 0,
                    stats?.rating_distribution?.GOOD || 0,
                    stats?.rating_distribution?.FAIR || 0,
                    stats?.rating_distribution?.UNSATISFACTORY || 0,
                ],
                backgroundColor: [
                    '#0E5C42',
                    '#16996d',
                    '#fbbf24',
                    '#ef4444',
                ],
                borderWidth: 0,
            },
        ],
    };

    return (
        <div className="space-y-8 text-slate-900">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Enterprise Overview</h1>
                    <p className="text-slate-500 mt-1 font-medium">Hello, {user?.username} • Access Level: {user?.role}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
                    <Calendar size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">{new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all">
                    <div className="p-4 bg-primary-50 text-primary-700 rounded-xl">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Count</p>
                        <p className="text-2xl font-black text-slate-800">{stats?.total_employees}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all">
                    <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Avg. Score</p>
                        <p className="text-2xl font-black text-emerald-700">{stats?.avg_performance}%</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all">
                    <div className="p-4 bg-amber-50 text-amber-700 rounded-xl">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Late Days</p>
                        <p className="text-2xl font-black text-amber-700">{stats?.attendance_stats?.late_days}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all">
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl">
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Absences</p>
                        <p className="text-2xl font-black text-red-700">{stats?.attendance_stats?.absent_days}</p>
                    </div>
                </div>
            </div>

            {/* Role-Specific Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Overview (Finance & Admin) */}
                {(user?.role === 'ADMIN' || user?.role === 'FINANCE') && (
                    <div className="lg:col-span-1 bg-primary-900 text-white rounded-2xl p-8 flex flex-col justify-between shadow-xl shadow-primary-900/20">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <Landmark size={32} className="text-primary-300" />
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${stats?.payroll_stats?.status === 'PAID' ? 'bg-green-500' : 'bg-primary-700'}`}>
                                    {stats?.payroll_stats?.status}
                                </span>
                            </div>
                            <p className="text-primary-200 text-xs font-bold uppercase tracking-widest mb-2 font-medium">Monthly Gross Payout</p>
                            <p className="text-3xl font-black">
                                {stats?.payroll_stats?.total_payout.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/payroll'}
                            className="mt-8 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2"
                        >
                            View Payroll Details
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                <div className={`${(user?.role === 'ADMIN' || user?.role === 'FINANCE') ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white p-8 rounded-2xl shadow-sm border border-slate-100`}>
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Trophy size={20} className="text-amber-500" />
                        Monthly Top Performers
                    </h3>
                    <div className="h-64">
                        <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-primary-600" />
                        Performance Distribution
                    </h3>
                    <div className="h-64 flex justify-center">
                        <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="bg-primary-50 p-8 rounded-2xl border border-primary-100 flex flex-col justify-center">
                    <h3 className="text-xl font-black text-primary-900 mb-4">Finalize Appraisals</h3>
                    <p className="text-primary-700 mb-8 opacity-80 leading-relaxed font-medium">
                        Monthly performance reports are ready for batch generation. Ensure all departmental KPI entries are accurate before generating the final appraisal summary for the month.
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => window.location.href = '/performance'} className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20">
                            Run Appraisal Summary
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

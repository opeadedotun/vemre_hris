import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Clock,
    FileText,
    MessageSquare,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Loader2,
    TrendingUp,
    MapPin,
    ArrowRight,
    Lock,
    DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { knowledgeApi, OnboardingProgress } from '../api/knowledge';

const ESSDashboard: React.FC = () => {
    const { user } = useAuth();
    const [employee, setEmployee] = useState<any>(null);
    const [attendance, setAttendance] = useState<any>(null);
    const [stats, setStats] = useState({
        activeTickets: 0,
        pendingDocuments: 0
    });
    const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [todayLog, setTodayLog] = useState<any>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch employee profile
                const empRes = await api.get('/employees/me/');
                setEmployee(empRes.data);

                // Fetch current month attendance
                const currentMonth = new Date().toISOString().slice(0, 7);
                const attRes = await api.get(`/attendance-monthly-summaries/?month=${currentMonth}&mine=1`);
                if (attRes.data.length > 0) {
                    setAttendance(attRes.data[0]);
                }

                // Check today's clock status
                const today = new Date().toISOString().slice(0, 10);
                const logsRes = await api.get(`/attendance-logs/?date=${today}&mine=1`);
                if (logsRes.data.length > 0) {
                    setTodayLog(logsRes.data[0]);
                }

                // Fetch ticket stats
                const ticketRes = await api.get(`/hr-tickets/?mine=1`);
                const openTickets = ticketRes.data.filter((t: any) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;

                // Fetch document stats
                const docRes = await api.get(`/employee-documents/?mine=1`);

                setStats({
                    activeTickets: openTickets,
                    pendingDocuments: docRes.data.length
                });

                // Fetch onboarding
                try {
                    const onbRes = await knowledgeApi.getMyOnboarding();
                    setOnboarding(onbRes.data);
                } catch (e) {
                    // Ignore if no onboarding
                }

            } catch (error) {
                console.error('Error fetching ESS data:', error);
                setLoadError('Unable to load your self-service data. Please contact HR.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleClockIn = async () => {
        if (!employee?.id) {
            alert('Employee profile not found. Please contact HR.');
            return;
        }

        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setActionLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await api.post('/employees/clock_in/', { latitude, longitude });
                    alert(res.data.message);

                    // Refresh data
                    const today = new Date().toISOString().slice(0, 10);
                    const logsRes = await api.get(`/attendance-logs/?date=${today}&mine=1`);
                    if (logsRes.data.length > 0) {
                        setTodayLog(logsRes.data[0]);
                    }
                } catch (error: any) {
                    alert(error.response?.data?.error || 'Failed to clock in');
                } finally {
                    setActionLoading(false);
                }
            },
            (error) => {
                alert('Please enable location access to clock in.');
                setActionLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="font-medium">Preparing your personal dashboard...</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
                {loadError}
            </div>
        );
    }

    const completedCount = onboarding?.completed_items?.length || 0;
    const checklistCount = onboarding?.checklist?.length || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Welcome back, {employee?.first_name || user?.username}!
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        {employee?.job_title} • {employee?.department_name}
                    </p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <Calendar className="text-primary-600" size={20} />
                    <span className="text-sm font-bold text-slate-700">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* Onboarding Banner */}
            {onboarding && !onboarding.is_completed && (
                <div
                    onClick={() => window.location.href = '/onboarding'}
                    className="bg-primary-600 hover:bg-primary-700 p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer group transition-all shadow-xl shadow-primary-900/20 animate-bounce-subtle"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">Complete your Onboarding</h3>
                            <p className="text-primary-100/80 font-medium">You've finished {completedCount} of {checklistCount} items in your {onboarding.guide_title} guide.</p>
                        </div>
                    </div>
                    <button className="bg-white text-primary-600 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 group-hover:translate-x-2 transition-all">
                        Resume Guide
                        <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {/* Quick Actions / Clock-in Section */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-primary-900/20">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Clock size={160} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-primary-300">
                            <MapPin size={12} />
                            Geofencing Active
                        </div>
                        <h2 className="text-2xl font-bold">Ready to start your day?</h2>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Clock in from your browser. Ensure your location permissions are enabled for accurate geofencing.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleClockIn}
                            disabled={actionLoading || (todayLog?.check_in && todayLog?.check_out)}
                            className="bg-primary-600 hover:bg-primary-500 disabled:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary-950/40 transition-all active:scale-95 flex items-center gap-3"
                        >
                            {actionLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : todayLog?.check_in && !todayLog?.check_out ? (
                                'Clock Out'
                            ) : todayLog?.check_in && todayLog?.check_out ? (
                                'Completed'
                            ) : (
                                'Clock In'
                            )}
                            {!actionLoading && <ArrowRight size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Personalized Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mb-4">
                        <MessageSquare size={24} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Active Tickets</p>
                    <p className="text-3xl font-black text-slate-900">{stats.activeTickets}</p>
                    <p className="text-xs text-blue-600 mt-2 font-bold cursor-pointer hover:underline" onClick={() => window.location.href = '/my-tickets'}>View all tickets</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit mb-4">
                        <FileText size={24} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">My Documents</p>
                    <p className="text-3xl font-black text-slate-900">{stats.pendingDocuments}</p>
                    <p className="text-xs text-indigo-600 mt-2 font-bold cursor-pointer hover:underline" onClick={() => window.location.href = '/my-documents'}>Access folder</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit mb-4">
                        <Clock size={24} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Late Days</p>
                    <p className="text-3xl font-black text-slate-900">{attendance?.total_late_days || 0}</p>
                    <p className="text-xs text-amber-600 mt-2 font-bold tracking-tight">Current Month</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-4">
                        <TrendingUp size={24} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Performance Index</p>
                    <p className="text-3xl font-black text-slate-900">{attendance?.avg_performance || 'N/A'}</p>
                    <p className="text-xs text-emerald-600 mt-2 font-bold cursor-pointer hover:underline" onClick={() => window.location.href = '/my-kpis'}>View KPI Details</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="p-3 bg-primary-50 text-primary-600 rounded-xl w-fit mb-4">
                        <DollarSign size={24} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Recent Payslip</p>
                    <p className="text-3xl font-black text-slate-900">
                        {attendance?.net_salary ? `₦${parseFloat(attendance.net_salary).toLocaleString()}` : 'Pending'}
                    </p>
                    <p className="text-xs text-primary-600 mt-2 font-bold cursor-pointer hover:underline" onClick={() => window.location.href = '/my-payout'}>View Payout Details</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Attendance Summary */}
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Calendar size={20} className="text-primary-600" />
                        Attendance Summary
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-sm font-medium text-slate-600">Late (30 mins)</span>
                            <span className="font-bold text-slate-900">{attendance?.total_late_30 || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-sm font-medium text-slate-600">Late (1 hour)</span>
                            <span className="font-bold text-slate-900">{attendance?.total_late_1hr || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <span className="text-sm font-medium text-slate-600">Absences</span>
                            <span className="font-bold text-slate-900">{attendance?.absent_days || 0}</span>
                        </div>
                        <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-sm font-bold text-red-600 uppercase tracking-widest">Total Deductions</span>
                            <span className="text-2xl font-black text-red-600">₦{parseFloat(attendance?.salary_deduction_amount || '0').toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Helpful Links / Secondary Stats */}
                <div className="space-y-6">
                    <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden flex items-center justify-between">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Security Hub</h3>
                            <p className="text-slate-400 text-xs mb-4">Keep your account secure by rotating your password regularly.</p>
                            <button className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center gap-2">
                                <Lock size={14} />
                                Change Password
                            </button>
                        </div>
                        <Lock size={80} className="text-white/5 absolute -right-4 -bottom-4" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Leave Balance</p>
                            <p className="text-2xl font-black text-slate-900">0 Days</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Company Rank</p>
                            <p className="text-2xl font-black text-slate-900">N/A</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ESSDashboard;


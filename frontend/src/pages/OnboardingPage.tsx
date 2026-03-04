import * as React from 'react';
import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Circle,
    Rocket,
    BookOpen,
    ShieldCheck,
    Clock,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { knowledgeApi, OnboardingProgress } from '../api/knowledge';

const OnboardingPage: React.FC = () => {
    const [progress, setProgress] = useState<OnboardingProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const res = await knowledgeApi.getMyOnboarding();
            setProgress(res.data);
        } catch (err: any) {
            console.error('Error fetching onboarding:', err);
            setError(err.response?.data?.detail || 'Failed to load onboarding guide');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleItem = async (item: string) => {
        if (!progress || updating) return;

        const currentItems = [...progress.completed_items];
        const index = currentItems.indexOf(item);

        if (index > -1) {
            currentItems.splice(index, 1);
        } else {
            currentItems.push(item);
        }

        setUpdating(true);
        try {
            const res = await knowledgeApi.updateOnboardingProgress(progress.id, currentItems);
            setProgress(res.data);
        } catch (err) {
            console.error('Error updating progress:', err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="font-bold uppercase tracking-widest text-xs">Preparing your journey...</p>
            </div>
        );
    }

    if (error || !progress) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-xl">
                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-4">No Onboarding Assigned</h2>
                <p className="text-slate-500 mb-8">
                    {error || "It looks like there isn't an onboarding guide assigned to your job role yet. Please contact your manager or HR department."}
                </p>
                <div className="pt-8 border-t border-slate-100">
                    <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Reference Code: ONB-404</p>
                </div>
            </div>
        );
    }

    const completionPercentage = Math.round((progress.completed_items.length / progress.checklist.length) * 100) || 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="relative bg-slate-900 rounded-[3rem] p-12 text-white overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-primary-500/20 text-primary-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-primary-500/30">
                            <Rocket size={14} />
                            Welcome Aboard!
                        </div>
                        <h1 className="text-5xl font-black tracking-tight">{progress.guide_title}</h1>
                        <p className="text-slate-400 text-lg max-w-lg">
                            We're excited to have you join the team. Complete these essential steps to get fully up to speed.
                        </p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-slate-800"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * completionPercentage) / 100}
                                    className="text-primary-500 transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black">{completionPercentage}%</span>
                                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Complete</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative background art */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-xl prose prose-slate max-w-none">
                        <div className="flex items-center gap-3 mb-8 not-prose">
                            <BookOpen className="text-primary-600" size={28} />
                            <h2 className="text-2xl font-black text-slate-800 m-0">Guide & Procedures</h2>
                        </div>
                        <div
                            dangerouslySetInnerHTML={{ __html: progress.guide_content || '<p>Loading content...</p>' }}
                            className="text-slate-600 leading-relaxed font-medium"
                        />
                    </div>
                </div>

                {/* Checklist Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden sticky top-8">
                        <div className="p-8 bg-slate-50 border-b border-slate-200">
                            <h3 className="text-lg font-black text-slate-800 flex items-center justify-between">
                                Checklist
                                <span className="text-primary-600 bg-primary-50 px-3 py-1 rounded-full text-xs font-black">
                                    {progress.completed_items.length}/{progress.checklist.length}
                                </span>
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {progress.checklist.map((item, idx) => {
                                const isDone = progress.completed_items.includes(item);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleToggleItem(item)}
                                        disabled={updating}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group hover:scale-[1.02] active:scale-[0.98] ${isDone
                                            ? 'bg-green-50 border-green-100 text-green-700'
                                            : 'bg-white border-slate-100 text-slate-600 hover:border-primary-200 shadow-sm'
                                            }`}
                                    >
                                        <div className={`shrink-0 transition-colors ${isDone ? 'text-green-600' : 'text-slate-300 group-hover:text-primary-400'}`}>
                                            {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </div>
                                        <span className={`text-sm font-bold ${isDone ? 'line-through opacity-60' : ''}`}>
                                            {item}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {progress.is_completed && (
                            <div className="p-8 bg-green-600 text-white text-center">
                                <ShieldCheck size={32} className="mx-auto mb-3" />
                                <h4 className="font-black text-lg mb-1">Onboarding Complete!</h4>
                                <p className="text-xs text-green-100 font-medium">You're all set. Keep up the great work!</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-100 rounded-3xl border border-slate-200 text-center">
                        <Clock size={20} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Started on {new Date(progress.started_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;

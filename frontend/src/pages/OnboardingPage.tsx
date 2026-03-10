import * as React from 'react';
import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2, AlertCircle, Plus } from 'lucide-react';
import { knowledgeApi, OnboardingProgress, OnboardingGuide } from '../api/knowledge';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const OnboardingPage: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [progress, setProgress] = useState<OnboardingProgress | null>(null);
    const [guides, setGuides] = useState<OnboardingGuide[]>([]);
    const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newGuide, setNewGuide] = useState({ job_role: '', title: '', content: '', checklist: '' });

    const fetchEmployeeGuide = async () => {
        try {
            const res = await knowledgeApi.getMyOnboarding();
            const payload: any = res.data;
            if (payload?.id) {
                setProgress(payload);
            } else {
                setError(payload?.detail || 'No onboarding guide assigned yet.');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load onboarding guide');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminData = async () => {
        try {
            const [guidesRes, rolesRes] = await Promise.all([
                knowledgeApi.getOnboardingGuides(),
                api.get('/job-roles/'),
            ]);
            setGuides(guidesRes.data || []);
            setRoles(rolesRes.data || []);
        } catch (err) {
            console.error('Failed to load admin onboarding data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchAdminData();
        } else {
            fetchEmployeeGuide();
        }
    }, [isAdmin]);

    const handleToggleItem = async (item: string) => {
        if (!progress || updating) return;
        const currentItems = [...progress.completed_items];
        const index = currentItems.indexOf(item);
        if (index > -1) currentItems.splice(index, 1);
        else currentItems.push(item);

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

    const createGuide = async (e: React.FormEvent) => {
        e.preventDefault();
        const checklist_json = newGuide.checklist
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean);

        try {
            await knowledgeApi.createOnboardingGuide({
                job_role: Number(newGuide.job_role),
                title: newGuide.title,
                content: newGuide.content,
                checklist_json,
            });
            setNewGuide({ job_role: '', title: '', content: '', checklist: '' });
            fetchAdminData();
        } catch (err) {
            console.error('Failed to create guide', err);
            alert('Unable to create onboarding guide.');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p>Loading onboarding...</p>
            </div>
        );
    }

    if (isAdmin) {
        return (
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Onboarding Guide Admin</h1>
                    <p className="text-slate-500">Create role-specific onboarding guides for employees.</p>
                </div>

                <form onSubmit={createGuide} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2"><Plus size={16} /> New Role Guide</h2>
                    <select required className="w-full border border-slate-200 rounded-lg p-3" value={newGuide.job_role} onChange={(e) => setNewGuide({ ...newGuide, job_role: e.target.value })}>
                        <option value="">Select role</option>
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <input required className="w-full border border-slate-200 rounded-lg p-3" placeholder="Guide title" value={newGuide.title} onChange={(e) => setNewGuide({ ...newGuide, title: e.target.value })} />
                    <textarea required rows={4} className="w-full border border-slate-200 rounded-lg p-3" placeholder="Guide content" value={newGuide.content} onChange={(e) => setNewGuide({ ...newGuide, content: e.target.value })} />
                    <textarea rows={5} className="w-full border border-slate-200 rounded-lg p-3" placeholder="Checklist (one item per line)" value={newGuide.checklist} onChange={(e) => setNewGuide({ ...newGuide, checklist: e.target.value })} />
                    <button className="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold">Create Guide</button>
                </form>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50"><h2 className="font-bold text-slate-800">Existing Guides</h2></div>
                    <div className="divide-y divide-slate-100">
                        {guides.map((g) => (
                            <div key={g.id} className="px-6 py-4">
                                <p className="font-semibold text-slate-800">{g.title}</p>
                                <p className="text-xs text-slate-500">Role: {g.job_role_name}</p>
                                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{g.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !progress) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-10 bg-white rounded-2xl border border-slate-200 text-center">
                <AlertCircle className="mx-auto mb-4 text-amber-500" size={34} />
                <h2 className="text-2xl font-bold text-slate-800 mb-3">No Onboarding Assigned</h2>
                <p className="text-slate-500">{error || 'No onboarding guide assigned to your role yet.'}</p>
            </div>
        );
    }

    const completionPercentage = Math.round((progress.completed_items.length / progress.checklist.length) * 100) || 0;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-slate-900 rounded-2xl p-8 text-white">
                <h1 className="text-3xl font-black">{progress.guide_title}</h1>
                <p className="text-slate-300 mt-2">Completion: {completionPercentage}%</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="prose max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: progress.guide_content || '' }} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h2 className="font-bold text-slate-800">Checklist</h2>
                {progress.checklist.map((item, idx) => {
                    const done = progress.completed_items.includes(item);
                    return (
                        <button key={idx} onClick={() => handleToggleItem(item)} className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 ${done ? 'bg-green-50 border-green-200 text-green-700' : 'border-slate-200 text-slate-700'}`}>
                            {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                            <span>{item}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default OnboardingPage;

import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Users,
    Briefcase,
    LayoutGrid,
    List,
    Plus,
    Search,
    MoreVertical,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    UserPlus,
    Calendar,
    MessageSquare,
    ClipboardCheck,
    Loader2,
    Filter
} from 'lucide-react';

interface JobPosting {
    id: number;
    title: string;
    department_name: string;
    status: string;
    is_public: boolean;
    created_at: string;
}

interface Applicant {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
    job_title: string;
    applied_at: string;
}

const STAGES = [
    { id: 'APPLIED', label: 'Applied', icon: UserPlus, color: 'text-blue-500' },
    { id: 'SCREENING', label: 'Phone Screen', icon: MessageSquare, color: 'text-purple-500' },
    { id: 'TECHNICAL', label: 'Technical', icon: ClipboardCheck, color: 'text-orange-500' },
    { id: 'INTERVIEW', label: 'Interview', icon: Calendar, color: 'text-indigo-500' },
    { id: 'OFFER', label: 'Offer', icon: CheckCircle2, color: 'text-emerald-500' },
    { id: 'REJECTED', label: 'Rejected', icon: XCircle, color: 'text-red-500' }
];

const RecruitmentPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'kanban' | 'jobs'>('kanban');
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showJobModal, setShowJobModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jobsRes, appsRes] = await Promise.all([
                api.get('/recruitment/jobs/'),
                api.get('/recruitment/applicants/')
            ]);
            setJobs(jobsRes.data);
            setApplicants(appsRes.data);
        } catch (error) {
            console.error('Error fetching recruitment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateApplicantStatus = async (id: number, status: string) => {
        try {
            await api.post(`/recruitment/applicants/${id}/change_status/`, { status });
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const filteredApplicants = applicants.filter(app =>
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary-600 w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Recruitment Hub</h1>
                    <p className="text-slate-500 mt-1">Manage job postings and track applicant progress.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('kanban')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'kanban' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutGrid size={18} /> ATS Board
                    </button>
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'jobs' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Briefcase size={18} /> Job Postings
                    </button>
                </div>
            </div>

            {/* Quick Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Applicants', value: applicants.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Open Positions', value: jobs.filter(j => j.status === 'OPEN').length, icon: Briefcase, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Active Interviews', value: applicants.filter(a => a.status === 'INTERVIEW').length, icon: Calendar, color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'In Screening', value: applicants.filter(a => a.status === 'SCREENING').length, icon: MessageSquare, color: 'bg-purple-50 text-purple-600' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={`${stat.color} p-4 rounded-2xl`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-black">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[600px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search applicants or job titles..."
                            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {activeTab === 'jobs' && (
                        <button
                            onClick={() => setShowJobModal(true)}
                            className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30"
                        >
                            <Plus size={20} /> Post New Job
                        </button>
                    )}
                </div>

                {activeTab === 'kanban' ? (
                    /* Kanban Board */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {STAGES.map(stage => (
                            <div key={stage.id} className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <stage.icon size={18} className={stage.color} />
                                        {stage.label}
                                        <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-black">
                                            {filteredApplicants.filter(a => a.status === stage.id).length}
                                        </span>
                                    </h3>
                                    <MoreVertical size={16} className="text-slate-300 cursor-pointer" />
                                </div>

                                <div className="space-y-4 bg-slate-50/50 p-4 rounded-3xl min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar border border-slate-100/50">
                                    {filteredApplicants.filter(a => a.status === stage.id).map(app => (
                                        <div
                                            key={app.id}
                                            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                                    {app.first_name[0]}{app.last_name[0]}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {STAGES.filter(s => s.id !== stage.id).slice(0, 2).map(nextStage => (
                                                        <button
                                                            key={nextStage.id}
                                                            onClick={() => updateApplicantStatus(app.id, nextStage.id)}
                                                            className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-primary-600 rounded-lg"
                                                            title={`Move to ${nextStage.label}`}
                                                        >
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-slate-900">{app.first_name} {app.last_name}</h4>
                                            <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-2">{app.job_title}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                <Clock size={12} />
                                                Applied {new Date(app.applied_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}

                                    {filteredApplicants.filter(a => a.status === stage.id).length === 0 && (
                                        <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm">
                                            No applicants
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {jobs.map(job => (
                            <div key={job.id} className="group bg-white rounded-3xl border border-slate-100 p-6 hover:border-primary-300 hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                            <Briefcase size={24} />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors text-lg mb-1">{job.title}</h3>
                                    <p className="text-sm font-medium text-slate-500 mb-4">{job.department_name}</p>

                                    <div className="flex items-center gap-4 py-3 border-y border-slate-50 mb-4">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <Calendar size={14} />
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </div>
                                        {job.is_public ? (
                                            <span className="flex items-center gap-1.5 text-xs text-blue-600 font-bold">
                                                <CheckCircle2 size={14} /> Public
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                                <XCircle size={14} /> Private
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-[10px] font-black text-slate-200 uppercase tracking-tighter">ID: #{job.id}</span>
                                    <button className="text-primary-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                                        Manage
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Job Modal */}
            {showJobModal && (
                <JobModal
                    onClose={() => setShowJobModal(false)}
                    onSuccess={() => {
                        setShowJobModal(false);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

interface JobModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const JobModal: React.FC<JobModalProps> = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<{ id: number, name: string }[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        location: 'Remote',
        job_type: 'FULL_TIME',
        description: '',
        requirements: '',
        is_public: true
    });

    useEffect(() => {
        api.get('/departments/').then(res => setDepartments(res.data));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/recruitment/jobs/', formData);
            onSuccess();
        } catch (error) {
            console.error('Error creating job:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-10 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">Post New Job</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><XCircle className="text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Job Title</label>
                            <input required className="w-full bg-slate-50 border-none rounded-xl p-3" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                            <select required className="w-full bg-slate-50 border-none rounded-xl p-3" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                <option value="">Select Dept</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Location</label>
                            <select className="w-full bg-slate-50 border-none rounded-xl p-3" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                                <option value="On-site">On-site</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Job Type</label>
                            <select className="w-full bg-slate-50 border-none rounded-xl p-3" value={formData.job_type} onChange={e => setFormData({ ...formData, job_type: e.target.value })}>
                                <option value="FULL_TIME">Full Time</option>
                                <option value="PART_TIME">Part Time</option>
                                <option value="CONTRACT">Contract</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                        <textarea rows={4} className="w-full bg-slate-50 border-none rounded-xl p-3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Requirements</label>
                        <textarea rows={4} className="w-full bg-slate-50 border-none rounded-xl p-3" value={formData.requirements} onChange={e => setFormData({ ...formData, requirements: e.target.value })} />
                    </div>

                    <div className="flex items-center gap-3">
                        <input type="checkbox" checked={formData.is_public} onChange={e => setFormData({ ...formData, is_public: e.target.checked })} className="w-5 h-5 accent-primary-600 rounded" />
                        <label className="text-sm font-bold text-slate-700">Make this posting public immediately</label>
                    </div>

                    <button disabled={loading} className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        Post Job
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RecruitmentPage;

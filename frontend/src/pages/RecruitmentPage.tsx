import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Briefcase, LayoutGrid, Plus, Search, ChevronRight, Loader2 } from 'lucide-react';

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
    status: string;
    job_title: string;
    applied_at: string;
}

const STAGES = [
    { id: 'APPLIED', label: 'Applied' },
    { id: 'SCREENING', label: 'Screening' },
    { id: 'TECHNICAL', label: 'Technical' },
    { id: 'INTERVIEW', label: 'Interview' },
    { id: 'OFFER', label: 'Offer' },
    { id: 'REJECTED', label: 'Rejected' },
];

const RecruitmentPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'kanban' | 'jobs'>('kanban');
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showJobModal, setShowJobModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jobsRes, appsRes] = await Promise.all([
                api.get('/recruitment/jobs/'),
                api.get('/recruitment/applicants/'),
            ]);
            setJobs(jobsRes.data || []);
            setApplicants(appsRes.data || []);
        } catch (error) {
            console.error('Error fetching recruitment data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateApplicantStatus = async (id: number, status: string) => {
        try {
            await api.post(`/recruitment/applicants/${id}/change_status/`, { status });
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const manageJob = async (job: JobPosting) => {
        try {
            if (job.status === 'DRAFT') {
                await api.post(`/recruitment/jobs/${job.id}/publish/`);
            } else if (job.status === 'OPEN') {
                await api.patch(`/recruitment/jobs/${job.id}/`, { status: 'CLOSED', is_public: false });
            } else {
                await api.patch(`/recruitment/jobs/${job.id}/`, { status: 'OPEN', is_public: true });
            }
            fetchData();
        } catch (error) {
            console.error('Error managing job:', error);
            alert('Unable to update job status.');
        }
    };

    const filteredApplicants = applicants.filter((app) =>
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin text-primary-600 w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Recruitment Hub</h1>
                    <p className="text-slate-500">Manage postings and applicant pipeline.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('kanban')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'kanban' ? 'bg-white text-primary-600' : 'text-slate-500'}`}>
                        <LayoutGrid className="inline mr-2" size={16} /> ATS Board
                    </button>
                    <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === 'jobs' ? 'bg-white text-primary-600' : 'text-slate-500'}`}>
                        <Briefcase className="inline mr-2" size={16} /> Job Postings
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Total Applicants</p><p className="text-2xl font-bold">{applicants.length}</p></div>
                <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Open Positions</p><p className="text-2xl font-bold">{jobs.filter(j => j.status === 'OPEN').length}</p></div>
                <div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs text-slate-500">Draft Positions</p><p className="text-2xl font-bold">{jobs.filter(j => j.status === 'DRAFT').length}</p></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                <div className="flex justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg" placeholder="Search applicants or jobs" />
                    </div>
                    {activeTab === 'jobs' && (
                        <button onClick={() => setShowJobModal(true)} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold">
                            <Plus className="inline mr-1" size={16} /> Post Job
                        </button>
                    )}
                </div>

                {activeTab === 'kanban' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {STAGES.map((stage) => (
                            <div key={stage.id} className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-semibold mb-3">{stage.label}</h3>
                                <div className="space-y-2">
                                    {filteredApplicants.filter(a => a.status === stage.id).map((app) => (
                                        <div key={app.id} className="bg-white border border-slate-200 rounded-lg p-3">
                                            <p className="font-semibold text-sm">{app.first_name} {app.last_name}</p>
                                            <p className="text-xs text-slate-500">{app.job_title}</p>
                                            <div className="mt-2 flex gap-1 flex-wrap">
                                                {STAGES.filter(s => s.id !== stage.id).map((n) => (
                                                    <button key={n.id} onClick={() => updateApplicantStatus(app.id, n.id)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">
                                                        {n.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jobs.map((job) => (
                            <div key={job.id} className="border border-slate-200 rounded-xl p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-slate-900">{job.title}</p>
                                        <p className="text-sm text-slate-500">{job.department_name}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded bg-slate-100">{job.status}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">Posted {new Date(job.created_at).toLocaleDateString()}</p>
                                <button onClick={() => manageJob(job)} className="mt-3 text-primary-600 text-sm font-semibold inline-flex items-center gap-1">
                                    {job.status === 'DRAFT' ? 'Publish' : job.status === 'OPEN' ? 'Close' : 'Reopen'} <ChevronRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
    const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        department: '',
        location: 'Remote',
        job_type: 'FULL_TIME',
        description: '',
        requirements: '',
        is_public: true,
    });

    useEffect(() => {
        api.get('/departments/').then((res) => setDepartments(res.data || []));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/recruitment/jobs/', formData);
            onSuccess();
        } catch (error) {
            console.error('Error creating job:', error);
            alert('Unable to create job posting.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Post New Job</h2>
                    <button onClick={onClose} className="text-slate-400">Close</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input required className="w-full border border-slate-200 rounded-lg p-3" placeholder="Job title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                    <select required className="w-full border border-slate-200 rounded-lg p-3" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                        <option value="">Select department</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select className="w-full border border-slate-200 rounded-lg p-3" value={formData.job_type} onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                    </select>
                    <textarea rows={3} className="w-full border border-slate-200 rounded-lg p-3" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    <textarea rows={3} className="w-full border border-slate-200 rounded-lg p-3" placeholder="Requirements" value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} />
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} />
                        Publish immediately
                    </label>
                    <button disabled={loading} className="w-full py-3 rounded-lg bg-primary-600 text-white font-semibold">
                        {loading ? 'Posting...' : 'Post Job'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RecruitmentPage;

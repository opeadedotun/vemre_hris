import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Briefcase, LayoutGrid, Plus, Search, ChevronRight, Loader2, Eye, FileDown, Mail } from 'lucide-react';

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
    full_name?: string;
    email: string;
    phone: string;
    status: string;
    job_title: string;
    job_department?: string;
    job_location?: string | null;
    job_type?: string | null;
    job_description?: string | null;
    job_requirements?: string | null;
    job_salary_range?: string | null;
    job_closing_date?: string | null;
    applied_at: string;
    resume?: string | null;
    resume_url?: string | null;
    resume_filename?: string | null;
    resume_size_kb?: number | null;
    cover_letter?: string | null;
    linkedin_profile?: string | null;
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
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
    const [offerLoadingId, setOfferLoadingId] = useState<number | null>(null);
    const [offerEmailingId, setOfferEmailingId] = useState<number | null>(null);

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const mediaBase = apiBase.replace(/\/api(\/v1)?$/, '');

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
            const res = await api.post(`/recruitment/applicants/${id}/change_status/`, { status });
            if (status === 'REJECTED') {
                if (res.data?.rejection_email_error) {
                    alert(res.data.rejection_email_error);
                } else if (res.data?.rejection_email_sent) {
                    alert('Rejection email sent successfully.');
                }
            }
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

    const resolveResumeLink = (app: Applicant) => {
        if (app.resume_url) return app.resume_url;
        if (app.resume) {
            if (app.resume.startsWith('http')) return app.resume;
            return `${mediaBase}${app.resume}`;
        }
        return null;
    };

    const downloadOfferLetter = async (app: Applicant) => {
        setOfferLoadingId(app.id);
        try {
            const res = await api.get(`/recruitment/applicants/${app.id}/offer_letter/`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Offer_Letter_${app.first_name}_${app.last_name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error generating offer letter:', error);
            alert('Unable to generate offer letter.');
        } finally {
            setOfferLoadingId(null);
        }
    };

    const sendOfferLetter = async (app: Applicant) => {
        setOfferEmailingId(app.id);
        try {
            const res = await api.post(`/recruitment/applicants/${app.id}/send_offer_letter/`);
            alert(res.data?.message || 'Offer letter sent successfully.');
        } catch (error: any) {
            console.error('Error sending offer letter:', error);
            alert(error.response?.data?.error || 'Unable to send offer letter.');
        } finally {
            setOfferEmailingId(null);
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
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-sm">{app.full_name || `${app.first_name} ${app.last_name}`}</p>
                                                    <p className="text-xs text-slate-500">{app.job_title}</p>
                                                    <p className="text-[10px] text-slate-400">{app.email}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedApplicant(app)}
                                                    className="p-1 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                                                    title="View application details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                            <div className="mt-2 flex gap-1 flex-wrap">
                                                {STAGES.filter(s => s.id !== stage.id).map((n) => (
                                                    <button key={n.id} onClick={() => updateApplicantStatus(app.id, n.id)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">
                                                        {n.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {app.status === 'OFFER' && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => downloadOfferLetter(app)}
                                                        disabled={offerLoadingId === app.id}
                                                        className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-700 hover:bg-primary-100"
                                                    >
                                                        <FileDown size={12} className="inline mr-1" />
                                                        {offerLoadingId === app.id ? 'Generating...' : 'Offer Letter'}
                                                    </button>
                                                    <button
                                                        onClick={() => sendOfferLetter(app)}
                                                        disabled={offerEmailingId === app.id}
                                                        className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                    >
                                                        <Mail size={12} className="inline mr-1" />
                                                        {offerEmailingId === app.id ? 'Sending...' : 'Send Offer'}
                                                    </button>
                                                </div>
                                            )}
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

            {selectedApplicant && (
                <ApplicantDetailModal
                    applicant={selectedApplicant}
                    onClose={() => setSelectedApplicant(null)}
                    resolveResumeLink={resolveResumeLink}
                />
            )}
        </div>
    );
};

interface ApplicantDetailModalProps {
    applicant: Applicant;
    onClose: () => void;
    resolveResumeLink: (app: Applicant) => string | null;
}

const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({ applicant, onClose, resolveResumeLink }) => {
    const resumeLink = resolveResumeLink(applicant);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">{applicant.full_name || `${applicant.first_name} ${applicant.last_name}`}</h2>
                        <p className="text-slate-500">{applicant.job_title} · {applicant.status}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400">Close</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Application Details</h3>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p><span className="font-semibold">Email:</span> {applicant.email}</p>
                            <p><span className="font-semibold">Phone:</span> {applicant.phone}</p>
                            <p><span className="font-semibold">LinkedIn:</span> {applicant.linkedin_profile || 'N/A'}</p>
                            <p><span className="font-semibold">Applied:</span> {new Date(applicant.applied_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">CV Details</h3>
                        <div className="text-sm text-slate-600 space-y-1">
                            <p><span className="font-semibold">File Name:</span> {applicant.resume_filename || 'N/A'}</p>
                            <p><span className="font-semibold">File Size:</span> {applicant.resume_size_kb ? `${applicant.resume_size_kb} KB` : 'N/A'}</p>
                            {resumeLink ? (
                                <a href={resumeLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
                                    <FileDown size={14} /> Download CV
                                </a>
                            ) : (
                                <p className="text-slate-400">No CV uploaded.</p>
                            )}
                        </div>
                    </div>
                </div>

                {applicant.cover_letter && (
                    <div className="mt-6">
                        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Cover Letter</h3>
                        <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{applicant.cover_letter}</p>
                    </div>
                )}

                <div className="mt-6">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Job Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm text-slate-600">
                        <p><span className="font-semibold">Department:</span> {applicant.job_department || 'N/A'}</p>
                        <p><span className="font-semibold">Location:</span> {applicant.job_location || 'N/A'}</p>
                        <p><span className="font-semibold">Job Type:</span> {applicant.job_type || 'N/A'}</p>
                        <p><span className="font-semibold">Salary Range:</span> {applicant.job_salary_range || 'N/A'}</p>
                        <p><span className="font-semibold">Closing Date:</span> {applicant.job_closing_date ? new Date(applicant.job_closing_date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    {applicant.job_description && (
                        <div className="mt-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</p>
                            <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{applicant.job_description}</p>
                        </div>
                    )}
                    {applicant.job_requirements && (
                        <div className="mt-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Requirements</p>
                            <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{applicant.job_requirements}</p>
                        </div>
                    )}
                </div>
            </div>
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

import React, { useState } from 'react';
import api from '../api/axios';
import { X, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ApplicationFormProps {
    job: {
        id: number;
        title: string;
    };
    onClose: () => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ job, onClose }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
    });
    const [resume, setResume] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResume(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const data = new FormData();
        data.append('job_posting', job.id.toString());
        data.append('first_name', formData.first_name);
        data.append('last_name', formData.last_name);
        data.append('email', formData.email);
        data.append('phone', formData.phone);
        data.append('linkedin_url', formData.linkedin_url);
        if (resume) {
            data.append('resume', resume);
        }

        try {
            await api.post('/recruitment/applicants/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit application. Please check your inputs.');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-6">
                <div className="bg-white rounded-[2rem] w-full max-w-lg p-12 text-center shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold mb-4">Application Sent!</h2>
                    <p className="text-slate-500 mb-10 leading-relaxed">
                        Thank you for applying for the <strong>{job.title}</strong> position.
                        Our team will review your application and be in touch soon.
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-primary-600 transition-all shadow-xl shadow-primary-900/20"
                    >
                        Return to Careers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-6">
            <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[95vh] overflow-y-auto shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="p-8 md:p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-extrabold">Apply for</h2>
                            <p className="text-primary-600 font-bold">{job.title}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="text-slate-400" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
                            <AlertCircle className="shrink-0" size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">First Name</label>
                                <input
                                    required
                                    type="text"
                                    name="first_name"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Last Name</label>
                                <input
                                    required
                                    type="text"
                                    name="last_name"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                            <input
                                required
                                type="email"
                                name="email"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Phone Number</label>
                            <input
                                required
                                type="tel"
                                name="phone"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">LinkedIn Profile (URL)</label>
                            <input
                                type="url"
                                name="linkedin_url"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                value={formData.linkedin_url}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Resume / CV</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    onChange={handleFileChange}
                                />
                                <div className={`
                                    border-2 border-dashed rounded-2xl p-6 text-center transition-all
                                    ${resume ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 group-hover:border-primary-400'}
                                `}>
                                    <Upload className={`mx-auto mb-2 ${resume ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <p className={`text-sm font-medium ${resume ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {resume ? resume.name : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">PDF, DOC up to 10MB</p>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={submitting}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-primary-600 transition-all shadow-xl shadow-primary-900/20 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Processing...
                                </>
                            ) : (
                                'Submit Application'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApplicationForm;

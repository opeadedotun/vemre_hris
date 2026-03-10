import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Briefcase, MapPin, Building2, Search, Filter, Loader2, Calendar } from 'lucide-react';
import ApplicationForm from '../components/ApplicationForm';

interface JobPosting {
    id: number;
    title: string;
    department_name: string;
    location: string;
    job_type: string;
    description: string;
    requirements: string;
    created_at: string;
}

const CareersPage: React.FC = () => {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
    const [isApplying, setIsApplying] = useState(false);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await api.get('/recruitment/jobs/');
                setJobs(response.data);
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Hero Section */}
            <section className="bg-slate-900 text-white py-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-transparent"></div>
                <div className="max-w-5xl mx-auto relative z-10 text-center">
                    <h1 className="text-5xl font-extrabold mb-6 tracking-tight">Join Our Global Team</h1>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        Build the future of enterprise management with us. Explore our open positions and find your next role.
                    </p>

                    <div className="max-w-2xl mx-auto relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by title, department, or keywords..."
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all backdrop-blur-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Jobs Listing */}
            <main className="max-w-5xl mx-auto py-16 px-6">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Filter className="text-primary-600" />
                        Open Roles ({filteredJobs.length})
                    </h2>
                </div>

                <div className="grid gap-6">
                    {filteredJobs.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <Briefcase className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg">No positions match your search criteria yet.</p>
                        </div>
                    ) : (
                        filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                className="group bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                onClick={() => setSelectedJob(job)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                {job.department_name}
                                            </span>
                                            <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                {(job.job_type || 'FULL_TIME').replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold group-hover:text-primary-600 transition-colors">
                                            {job.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-6 text-slate-500 text-sm">
                                            <span className="flex items-center gap-2">
                                                <MapPin size={16} /> {job.location}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Calendar size={16} /> {new Date(job.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-600 transition-colors whitespace-nowrap"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedJob(job);
                                            setIsApplying(true);
                                        }}
                                    >
                                        Apply Now
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-500 py-12 text-center border-t border-slate-800">
                <p>&copy; {new Date().getFullYear()} VemreHR Enterprise. All rights reserved.</p>
            </footer>

            {/* Job Detail Modal */}
            {selectedJob && !isApplying && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <button className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-2 text-sm font-medium" onClick={() => setSelectedJob(null)}>
                                        &larr; Back to Listings
                                    </button>
                                    <h2 className="text-4xl font-extrabold">{selectedJob.title}</h2>
                                    <div className="flex gap-4 mt-4 text-slate-500 font-medium">
                                        <span className="flex items-center gap-1"><Building2 size={18} /> {selectedJob.department_name}</span>
                                        <span className="flex items-center gap-1"><MapPin size={18} /> {selectedJob.location}</span>
                                    </div>
                                </div>
                                <button
                                    className="bg-primary-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30"
                                    onClick={() => setIsApplying(true)}
                                >
                                    Apply for this role
                                </button>
                            </div>

                            <div className="space-y-10">
                                <section>
                                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                                        The Role
                                    </h4>
                                    <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {selectedJob.description}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                                        What You'll Need
                                    </h4>
                                    <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                        {selectedJob.requirements}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Application Form Modal */}
            {isApplying && selectedJob && (
                <ApplicationForm
                    job={selectedJob}
                    onClose={() => {
                        setIsApplying(false);
                        setSelectedJob(null);
                    }}
                />
            )}
        </div>
    );
};

export default CareersPage;


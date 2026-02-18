import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Upload, FileText, Calendar, CheckCircle, AlertCircle, Loader2, Download, Building2, Lock, Unlock, TrendingUp, Award, AlertTriangle } from 'lucide-react';

interface Branch {
    id: number;
    name: string;
}

interface UploadStatus {
    branch_name: string;
    is_uploaded: boolean;
    file_name?: string;
    uploaded_at?: string;
}

interface MonthlySummary {
    employee_name: string;
    total_late_30: number;
    total_late_1hr: number;
    total_query: number;
    total_late_days: number;
    salary_deduction_amount: string;
}

const AttendanceManagementPage: React.FC = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
    const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
    const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
    const [uploads, setUploads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const fetchBranches = async () => {
        try {
            const res = await api.get('/v1/branches/');
            setBranches(res.data);
            if (res.data.length > 0 && !selectedBranch) {
                setSelectedBranch(res.data[0].id);
            }
        } catch (err) {
            console.error('Failed to fetch branches');
        }
    };

    const fetchUploadStatuses = async () => {
        try {
            const res = await api.get(`/v1/attendance-uploads/?month=${month}`);
            const uploads = res.data;

            // Create status map for each branch
            const statusMap: { [key: string]: UploadStatus } = {};
            branches.forEach(branch => {
                const upload = uploads.find((u: any) => u.branch === branch.id);
                statusMap[branch.name] = {
                    branch_name: branch.name,
                    is_uploaded: !!upload,
                    file_name: upload?.file_name,
                    uploaded_at: upload?.uploaded_at
                };
            });

            setUploadStatuses(Object.values(statusMap));
            setUploads(uploads);
        } catch (err) {
            console.error('Failed to fetch upload statuses');
        }
    };

    const fetchMonthlySummaries = async () => {
        try {
            const res = await api.get(`/v1/attendance-monthly-summaries/?month=${month}`);
            setMonthlySummaries(res.data);
        } catch (err) {
            console.error('Failed to fetch monthly summaries');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchBranches(), fetchUploadStatuses(), fetchMonthlySummaries()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [month]);

    useEffect(() => {
        if (branches.length > 0) {
            fetchUploadStatuses();
        }
    }, [branches]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !selectedBranch) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('month', month);
        formData.append('branch', selectedBranch.toString());

        try {
            await api.post('/v1/attendance-uploads/process/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Attendance uploaded and processed successfully');
            setFile(null);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to process attendance file.');
        } finally {
            setUploading(false);
        }
    };

    const handleProcessMonthly = async () => {
        if (!confirm(`Process monthly attendance for ${month}? This will calculate deductions and generate disciplinary actions.`)) {
            return;
        }

        setProcessing(true);
        try {
            await api.post('/v1/attendance-summaries/process_monthly/', { month });
            alert('Monthly attendance processed successfully!');
            fetchMonthlySummaries();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to process monthly attendance.');
        } finally {
            setProcessing(false);
        }
    };

    const allBranchesUploaded = uploadStatuses.length > 0 && uploadStatuses.every(s => s.is_uploaded);
    const totalDeductions = monthlySummaries.reduce((sum, s) => sum + parseFloat(s.salary_deduction_amount || '0'), 0);

    return (
        <div className="space-y-6 text-slate-900">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Attendance Management</h1>
                    <p className="text-slate-500 text-sm">Multi-branch attendance processing with automated deductions</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                    <Calendar size={20} className="text-slate-400" />
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                    />
                </div>
            </div>

            {/* Branch Upload Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {uploadStatuses.map((status) => (
                    <div key={status.branch_name} className={`p-4 rounded-xl border-2 transition-all ${status.is_uploaded
                            ? 'bg-green-50 border-green-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Building2 size={16} className={status.is_uploaded ? 'text-green-600' : 'text-slate-400'} />
                                <h3 className="font-bold text-sm">{status.branch_name}</h3>
                            </div>
                            {status.is_uploaded ? (
                                <CheckCircle size={16} className="text-green-600" />
                            ) : (
                                <AlertCircle size={16} className="text-slate-400" />
                            )}
                        </div>
                        {status.is_uploaded ? (
                            <div className="text-xs text-green-700">
                                <p className="font-medium truncate">{status.file_name}</p>
                                <p className="text-green-600/70">{status.uploaded_at ? new Date(status.uploaded_at).toLocaleDateString() : ''}</p>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">Not uploaded</p>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Upload size={18} />
                            Upload Attendance
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            {/* Branch Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Branch</label>
                                <select
                                    value={selectedBranch || ''}
                                    onChange={(e) => setSelectedBranch(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                                <input
                                    type="file"
                                    id="attendance-file"
                                    className="hidden"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="attendance-file" className="cursor-pointer group">
                                    <FileText className="mx-auto mb-2 text-slate-300 group-hover:text-primary-500 transition-colors" size={48} />
                                    <p className="text-sm font-medium text-slate-600">
                                        {file ? file.name : 'Click to select Excel/CSV file'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase">Auto-detects columns</p>
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={!file || !selectedBranch || uploading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-900/20 transition-all"
                            >
                                {uploading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                Process Upload
                            </button>
                        </form>
                    </div>

                    {/* Monthly Processing Control */}
                    <div className={`p-6 rounded-xl shadow-sm border-2 transition-all ${allBranchesUploaded
                            ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            {allBranchesUploaded ? <Unlock size={18} className="text-primary-600" /> : <Lock size={18} className="text-slate-400" />}
                            Monthly Processing
                        </h2>
                        {allBranchesUploaded ? (
                            <div className="space-y-3">
                                <p className="text-xs text-primary-700 font-medium">✓ All branches have uploaded data</p>
                                <button
                                    onClick={handleProcessMonthly}
                                    disabled={processing}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg transition-all"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={18} /> : <TrendingUp size={18} />}
                                    Process Monthly
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 font-medium">⚠ Waiting for all branches to upload</p>
                                <div className="text-[10px] text-slate-400 space-y-1">
                                    {uploadStatuses.filter(s => !s.is_uploaded).map(s => (
                                        <p key={s.branch_name}>• {s.branch_name} pending</p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analytics Dashboard */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={16} className="text-amber-600" />
                                <p className="text-xs font-bold text-amber-700 uppercase">Late 30min</p>
                            </div>
                            <p className="text-2xl font-bold text-amber-900">
                                {monthlySummaries.reduce((sum, s) => sum + s.total_late_30, 0)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle size={16} className="text-orange-600" />
                                <p className="text-xs font-bold text-orange-700 uppercase">Late 1hr</p>
                            </div>
                            <p className="text-2xl font-bold text-orange-900">
                                {monthlySummaries.reduce((sum, s) => sum + s.total_late_1hr, 0)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={16} className="text-red-600" />
                                <p className="text-xs font-bold text-red-700 uppercase">Query</p>
                            </div>
                            <p className="text-2xl font-bold text-red-900">
                                {monthlySummaries.reduce((sum, s) => sum + s.total_query, 0)}
                            </p>
                        </div>
                    </div>

                    {/* Monthly Summary Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800">Processed Attendance ({month})</h2>
                            <div className="text-sm">
                                <span className="text-slate-500">Total Deductions: </span>
                                <span className="font-bold text-red-600">₦{totalDeductions.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm">
                                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-6 py-3 text-left">Employee</th>
                                        <th className="px-4 py-3 text-center">Late 30</th>
                                        <th className="px-4 py-3 text-center">Late 1Hr</th>
                                        <th className="px-4 py-3 text-center">Query</th>
                                        <th className="px-4 py-3 text-center">Total Late</th>
                                        <th className="px-4 py-3 text-right">Deduction</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                <Loader2 className="animate-spin mx-auto mb-2" />
                                                Loading summaries...
                                            </td>
                                        </tr>
                                    ) : monthlySummaries.length > 0 ? (
                                        monthlySummaries.map((s, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-800">{s.employee_name}</p>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">{s.total_late_30}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-bold">{s.total_late_1hr}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold">{s.total_query}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center text-sm font-bold text-slate-600">
                                                    {s.total_late_days}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm font-bold text-red-600">
                                                    ₦{parseFloat(s.salary_deduction_amount || '0').toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                                No processed attendance data. Upload files and click "Process Monthly".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceManagementPage;

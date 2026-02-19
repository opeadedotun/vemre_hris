import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Upload, FileText, Calendar, CheckCircle, AlertCircle, Loader2, Download, Building2, Lock, Unlock, TrendingUp, Award, AlertTriangle, UserPlus, Mail, X, Printer, Copy } from 'lucide-react';

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
    absent_days: number;
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

    // Manual Entry state
    const [employees, setEmployees] = useState<any[]>([]);
    const [manualForm, setManualForm] = useState({ employee: '', date: '', check_in: '', check_out: '', branch: '' });
    const [savingManual, setSavingManual] = useState(false);

    // Query Letter state
    const [queryLetter, setQueryLetter] = useState<string | null>(null);
    const [queryEmployee, setQueryEmployee] = useState('');
    const [generatingQuery, setGeneratingQuery] = useState(false);

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

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/v1/employees/');
            setEmployees(res.data);
        } catch (err) {
            console.error('Failed to fetch employees');
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
        await Promise.all([fetchBranches(), fetchUploadStatuses(), fetchMonthlySummaries(), fetchEmployees()]);
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

    const handleProcessMonthly = async (branchId?: number) => {
        const branchName = branchId ? branches.find(b => b.id === branchId)?.name : 'all branches';
        if (!confirm(`Process monthly attendance for ${branchName} in ${month}? This will calculate deductions and generate disciplinary actions.`)) {
            return;
        }

        setProcessing(true);
        try {
            await api.post('/v1/attendance-summaries/process_monthly/', {
                month,
                branch: branchId
            });
            alert(`${branchName} attendance processed successfully!`);
            fetchMonthlySummaries();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to process attendance.');
        } finally {
            setProcessing(false);
        }
    };

    const handleManualEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingManual(true);
        try {
            const res = await api.post('/v1/attendance-uploads/manual_entry/', manualForm);
            alert(res.data.message);
            setManualForm({ employee: '', date: '', check_in: '', check_out: '', branch: '' });
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save manual entry.');
        } finally {
            setSavingManual(false);
        }
    };

    const handleGenerateQuery = async () => {
        if (!queryEmployee) return;
        setGeneratingQuery(true);
        try {
            const res = await api.post('/v1/attendance-uploads/generate_query/', { employee: queryEmployee, month });
            setQueryLetter(res.data.letter);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to generate query letter.');
        } finally {
            setGeneratingQuery(false);
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

            {/* Removed Branch Upload Status Cards as per user request */}

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
                                <div className="flex gap-2">
                                    <select
                                        value={selectedBranch || ''}
                                        onChange={(e) => setSelectedBranch(Number(e.target.value))}
                                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleProcessMonthly(selectedBranch || undefined)}
                                        disabled={processing || !selectedBranch}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 disabled:opacity-50"
                                        title="Process selected branch"
                                    >
                                        {processing ? <Loader2 className="animate-spin" size={14} /> : <TrendingUp size={14} />}
                                        Process
                                    </button>
                                </div>
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
                    <div className="p-6 rounded-xl shadow-sm border-2 transition-all bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
                        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Unlock size={18} className="text-primary-600" />
                            Global Monthly Processing
                        </h2>
                        <div className="space-y-3">
                            <p className="text-xs text-primary-700 font-medium">Re-calculate for all branches with available data</p>
                            <button
                                onClick={() => handleProcessMonthly()}
                                disabled={processing}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg transition-all"
                            >
                                {processing ? <Loader2 className="animate-spin" size={18} /> : <TrendingUp size={18} />}
                                Process All Branches
                            </button>
                            {!allBranchesUploaded && (
                                <div className="p-2 bg-amber-50 rounded border border-amber-100 mt-2">
                                    <p className="text-[10px] text-amber-700 font-bold uppercase flex items-center gap-1">
                                        <AlertTriangle size={10} />
                                        Pending Uploads
                                    </p>
                                    <p className="text-[10px] text-amber-600 mt-1">
                                        {uploadStatuses.filter(s => !s.is_uploaded).map(s => s.branch_name).join(', ')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Manual Entry Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <UserPlus size={18} />
                            Manual Entry
                        </h2>
                        <form onSubmit={handleManualEntry} className="space-y-3">
                            <select
                                value={manualForm.employee}
                                onChange={(e) => setManualForm({ ...manualForm, employee: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select Employee</option>
                                {employees.map((emp: any) => (
                                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                ))}
                            </select>
                            <select
                                value={manualForm.branch}
                                onChange={(e) => setManualForm({ ...manualForm, branch: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select Branch</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={manualForm.date}
                                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                required
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Check In</label>
                                    <input
                                        type="time"
                                        value={manualForm.check_in}
                                        onChange={(e) => setManualForm({ ...manualForm, check_in: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Check Out</label>
                                    <input
                                        type="time"
                                        value={manualForm.check_out}
                                        onChange={(e) => setManualForm({ ...manualForm, check_out: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={savingManual}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-900/20 transition-all"
                            >
                                {savingManual ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                                Save Entry
                            </button>
                        </form>
                    </div>

                    {/* Query Letter Generator */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Mail size={18} />
                            Generate Query Letter
                        </h2>
                        <div className="space-y-3">
                            <select
                                value={queryEmployee}
                                onChange={(e) => setQueryEmployee(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select Employee</option>
                                {employees.map((emp: any) => (
                                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleGenerateQuery}
                                disabled={!queryEmployee || generatingQuery}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-900/20 transition-all"
                            >
                                {generatingQuery ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                                Generate Query
                            </button>
                        </div>
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
                                        <th className="px-4 py-3 text-center">Absences</th>
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
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${s.absent_days > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                                        {s.absent_days}
                                                    </span>
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

            {/* Query Letter Modal */}
            {queryLetter && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Query Letter</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(queryLetter);
                                        alert('Copied to clipboard!');
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Copy"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        const w = window.open('', '_blank');
                                        if (w) {
                                            w.document.write(`<pre style="font-family: serif; white-space: pre-wrap; max-width: 700px; margin: 40px auto;">${queryLetter}</pre>`);
                                            w.print();
                                        }
                                    }}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Print"
                                >
                                    <Printer size={16} />
                                </button>
                                <button
                                    onClick={() => setQueryLetter(null)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <pre className="whitespace-pre-wrap text-sm text-slate-700 font-serif leading-relaxed">{queryLetter}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceManagementPage;

import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Upload, FileText, Calendar, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';

const AttendanceManagementPage: React.FC = () => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [uploads, setUploads] = useState<any[]>([]);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uploadRes, summaryRes] = await Promise.all([
                api.get('/v1/attendance-uploads/'),
                api.get(`/v1/attendance-summaries/?month=${month}`)
            ]);
            setUploads(uploadRes.data);
            setSummaries(summaryRes.data);
        } catch (err) {
            console.error('Failed to fetch attendance data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('month', month);

        try {
            await api.post('/v1/attendance-uploads/process/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Attendance uploaded and processed successfully');
            setFile(null);
            fetchData();
        } catch (err) {
            alert('Failed to process attendance file.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 text-slate-900">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Attendance Management</h1>
                    <p className="text-slate-500 text-sm">Bulk import attendance logs and track monthly presence</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Upload size={18} />
                            Upload Logs
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                                <input
                                    type="file"
                                    id="attendance-file"
                                    className="hidden"
                                    accept=".csv"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="attendance-file" className="cursor-pointer group">
                                    <FileText className="mx-auto mb-2 text-slate-300 group-hover:text-primary-500 transition-colors" size={48} />
                                    <p className="text-sm font-medium text-slate-600">
                                        {file ? file.name : 'Click to select CSV file'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase">Format: employee_code, date, check_in, check_out, status</p>
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={!file || uploading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary-900/20 transition-all"
                            >
                                {uploading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                Process Upload
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Download size={18} />
                            Upload History
                        </h2>
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                            {uploads.slice(0, 10).map((u) => (
                                <div key={u.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="p-2 bg-white rounded-lg text-slate-400">
                                        <FileText size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-700 truncate">{u.file_name}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(u.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-primary-600 uppercase">{u.month}</span>
                                </div>
                            ))}
                            {uploads.length === 0 && (
                                <p className="text-xs text-slate-400 text-center py-4 italic">No recent uploads</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Table Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
                            <h2 className="font-bold text-slate-800">Monthly Attendance Summary ({month})</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-6 py-3 text-left">Employee</th>
                                        <th className="px-4 py-3 text-center">Present</th>
                                        <th className="px-4 py-3 text-center">Absent</th>
                                        <th className="px-4 py-3 text-center">Late</th>
                                        <th className="px-4 py-3 text-center">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                <Loader2 className="animate-spin mx-auto mb-2" />
                                                Loading summaries...
                                            </td>
                                        </tr>
                                    ) : summaries.length > 0 ? (
                                        summaries.map((s) => (
                                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-800">{s.employee_name}</p>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">{s.present_days}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold">{s.absent_days}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">{s.late_days}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center text-sm font-bold text-slate-500">
                                                    {s.total_days}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                                No attendance data available for this month.
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

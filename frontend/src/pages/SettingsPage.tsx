import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Trash2, Settings as SettingsIcon, ShieldAlert, RotateCcw, Download, Upload, Info } from 'lucide-react';
import api from '../api/axios';

interface TargetRow {
    key: string;
    count: number;
}

const SettingsPage: React.FC = () => {
    const [targets, setTargets] = useState<TargetRow[]>([]);
    const [protectedTargets, setProtectedTargets] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const developerLogo = '/acenelog.png';

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin-settings/overview/');
            setTargets(res.data.targets || []);
            setProtectedTargets(res.data.protected || []);
        } catch (err) {
            console.error('Failed to load settings overview', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    const purgeTarget = async (target: string) => {
        if (!window.confirm(`Delete all records for "${target}"? This cannot be undone.`)) return;
        setBusyKey(target);
        try {
            await api.post('/admin-settings/purge/', { target });
            await fetchOverview();
        } catch (err) {
            console.error('Purge failed', err);
            alert('Unable to delete records for this target.');
        } finally {
            setBusyKey(null);
        }
    };

    const resetDefaults = async () => {
        if (!window.confirm('Reset the app to default? This will clear operational data.')) return;
        setResetting(true);
        try {
            await api.post('/admin-settings/reset_defaults/');
            await fetchOverview();
            alert('App reset completed.');
        } catch (err) {
            console.error('Reset failed', err);
            alert('Unable to reset the app.');
        } finally {
            setResetting(false);
        }
    };

    const exportData = async () => {
        setExporting(true);
        try {
            const res = await api.get('/admin-settings/export_data/', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vemrehr_backup.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error('Export failed', err);
            alert('Unable to export data.');
        } finally {
            setExporting(false);
        }
    };

    const importData = async (file: File) => {
        if (!window.confirm('Importing data will overwrite current records. Continue?')) return;
        setImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('reset', '1');
            await api.post('/admin-settings/import_data/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await fetchOverview();
            alert('Data import completed.');
        } catch (err) {
            console.error('Import failed', err);
            alert('Unable to import data.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <SettingsIcon className="text-primary-600" size={30} />
                    Admin Settings
                </h1>
                <p className="text-slate-500 mt-1">Manage app settings and erase non-payroll operational data safely.</p>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={resetDefaults}
                    disabled={resetting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-60"
                >
                    {resetting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                    Reset to Default
                </button>
                <button
                    onClick={exportData}
                    disabled={exporting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
                >
                    {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Export Data
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-60"
                >
                    {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    Import Data
                </button>
                <button
                    onClick={() => setAboutOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-200 text-primary-700 font-semibold hover:bg-primary-50"
                >
                    <Info size={16} /> About
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            importData(file);
                            e.currentTarget.value = '';
                        }
                    }}
                />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 flex items-start gap-3">
                <ShieldAlert size={18} className="mt-0.5" />
                <p className="text-sm font-medium">
                    KPI and payroll records are protected. Performance summaries and attendance entries can be reset here.
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="font-bold text-slate-800">Data Management</h2>
                </div>
                {loading ? (
                    <div className="py-16 text-center text-slate-400">
                        <Loader2 className="animate-spin mx-auto mb-2" size={28} />
                        <p>Loading app data levels...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {targets.map((row) => (
                            <div key={row.key} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-slate-800">{row.key.replace(/_/g, ' ')}</p>
                                    <p className="text-xs text-slate-500">{row.count} record(s)</p>
                                </div>
                                <button
                                    onClick={() => purgeTarget(row.key)}
                                    disabled={busyKey === row.key}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                                >
                                    {busyKey === row.key ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="font-bold text-slate-800 mb-3">Protected Core Data</h2>
                <div className="flex flex-wrap gap-2">
                    {protectedTargets.map((item) => (
                        <span key={item} className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold">
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {aboutOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <img src={developerLogo} alt="Acenet Technology" className="h-12 w-auto object-contain" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Developer</p>
                                    <p className="text-xl font-extrabold text-slate-900">Acenet Technology</p>
                                </div>
                            </div>
                            <button onClick={() => setAboutOpen(false)} className="text-slate-400 hover:text-slate-600">Close</button>
                        </div>
                        <p className="text-sm text-slate-600">
                            VemreHR is an enterprise performance and workforce management platform built to streamline HR operations,
                            attendance, payroll, and KPI tracking for growing teams.
                        </p>
                        <div className="mt-4 border-t border-slate-100 pt-4">
                            <p className="text-sm font-semibold text-slate-900">Opeyemi Adedotun</p>
                            <p className="text-sm text-slate-600">ope_adedotun@live.com</p>
                            <p className="text-sm text-slate-600">08161836558</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;

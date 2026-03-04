import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    FileText,
    Upload,
    Download,
    Trash2,
    Loader2,
    Plus,
    X,
    FileCheck
} from 'lucide-react';

interface Document {
    id: number;
    title: string;
    document_type: string;
    file: string;
    uploaded_at: string;
    uploaded_by_name: string;
}

interface DocumentsTabProps {
    employeeId: number;
}

const DOCUMENT_TYPES = [
    { value: 'CONTRACT', label: 'Employment Contract' },
    { value: 'ID_PROOF', label: 'ID Proof' },
    { value: 'CERTIFICATE', label: 'Educational Certificate' },
    { value: 'RESUME', label: 'Resume / CV' },
    { value: 'PAYSLIP', label: 'Payslip' },
    { value: 'OTHER', label: 'Other' },
];

const DocumentsTab: React.FC<DocumentsTabProps> = ({ employeeId }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [newDoc, setNewDoc] = useState({
        title: '',
        document_type: 'OTHER',
        file: null as File | null
    });

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/employee-documents/?employee=${employeeId}`);
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [employeeId]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.file || !newDoc.title) return;

        const formData = new FormData();
        formData.append('employee', employeeId.toString());
        formData.append('title', newDoc.title);
        formData.append('document_type', newDoc.document_type);
        formData.append('file', newDoc.file);

        setUploading(true);
        try {
            await api.post('/employee-documents/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsUploadModalOpen(false);
            setNewDoc({ title: '', document_type: 'OTHER', file: null });
            fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Error uploading document');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            await api.delete(`/employee-documents/${id}/`);
            fetchDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Error deleting document');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="text-sm font-medium">Fetching secure records...</span>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Employee Dossier</h3>
                <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-all border border-primary-200"
                >
                    <Plus size={14} />
                    Add Document
                </button>
            </div>

            {documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                    {documents.map((doc) => (
                        <div key={doc.id} className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between hover:border-primary-200 transition-all group shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-primary-50 group-hover:text-primary-600 transition-all">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{doc.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded text-center">
                                            {DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={doc.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                    title="Download"
                                >
                                    <Download size={18} />
                                </a>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400">
                    <FileCheck className="mx-auto mb-2 opacity-20" size={48} />
                    <p className="text-sm font-medium">No documents on file for this employee.</p>
                </div>
            )}

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Upload Document</h3>
                            <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newDoc.title}
                                    onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                                    placeholder="e.g. 2024 Employment Contract"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Type</label>
                                <select
                                    value={newDoc.document_type}
                                    onChange={e => setNewDoc({ ...newDoc, document_type: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                                >
                                    {DOCUMENT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select File</label>
                                <div className="relative group/file">
                                    <input
                                        type="file"
                                        required
                                        onChange={e => setNewDoc({ ...newDoc, file: e.target.files?.[0] || null })}
                                        className="hidden"
                                        id="doc-file-upload"
                                    />
                                    <label
                                        htmlFor="doc-file-upload"
                                        className="w-full px-4 py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer group-hover/file:border-primary-400 transition-all bg-slate-50 group-hover/file:bg-primary-50/50"
                                    >
                                        <Upload className="text-slate-300 group-hover/file:text-primary-500 transition-colors" size={32} />
                                        <span className="text-xs font-bold text-slate-500 group-hover/file:text-primary-700">
                                            {newDoc.file ? newDoc.file.name : 'Choose file or drag & drop'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="flex-1 py-3 text-slate-600 font-bold text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="flex-1 py-3 bg-primary-600 text-white font-bold text-sm rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            Submit Securely
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsTab;

import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import DocumentsTab from '../components/DocumentsTab';
import { Loader2, FileText } from 'lucide-react';

const MyDocumentsPage: React.FC = () => {
    const [employeeId, setEmployeeId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const response = await api.get('/employees/me/');
                setEmployeeId(response.data.id);
            } catch (error) {
                console.error('Error fetching employee profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin mb-2" size={48} />
            <span className="font-medium">Loading your documents...</span>
        </div>
    );

    if (!employeeId) return (
        <div className="p-8 text-center text-red-500 font-bold">
            Employee profile not found. Please contact HR.
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                    <FileText className="text-primary-600" size={32} />
                    My Documents
                </h1>
                <p className="text-slate-500 mt-1 font-medium">View and manage your personal employee files</p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <DocumentsTab employeeId={employeeId} mineOnly />
            </div>
        </div>
    );
};

export default MyDocumentsPage;

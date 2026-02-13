import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    History,
    Search,
    Loader2,
    Download,
    Filter,
    Eye,
    FileText
} from 'lucide-react';

interface AppraisalRecord {
    id: number;
    employee_name: string;
    appraisal_period: string;
    total_score: number;
    rating: string;
    reviewer_name: string;
    appraisal_date: string;
}

const HistoryPage: React.FC = () => {
    const [appraisals, setAppraisals] = useState<AppraisalRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchHistory = async () => {
        try {
            const response = await api.get('/v1/appraisals/');
            setAppraisals(response.data);
        } catch (error) {
            console.error('Error fetching appraisal history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredHistory = appraisals.filter(a =>
        a.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.appraisal_period.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Appraisal History</h1>
                    <p className="text-slate-500 text-sm">Historical record of performance reviews and appraisals</p>
                </div>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-semibold">
                    <Download size={18} />
                    Export All
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or period..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <span>Retrieving historical records...</span>
                        </div>
                    ) : filteredHistory.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Period</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4">Rating</th>
                                    <th className="px-6 py-4">Reviewer</th>
                                    <th className="px-6 py-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.map((a) => (
                                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-800">{a.employee_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {a.appraisal_period}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">{a.total_score}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                {a.rating}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {a.reviewer_name}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="View Details">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-20 text-center text-slate-500">
                            <FileText className="mx-auto mb-4 opacity-20" size={64} />
                            <p>No appraisal history found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;

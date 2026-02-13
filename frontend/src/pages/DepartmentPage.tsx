import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Building2, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import DepartmentModal from '../components/DepartmentModal';

interface Department {
    id: number;
    name: string;
    description: string;
    created_at: string;
}

const DepartmentPage: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState<Department | undefined>();

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/v1/departments/');
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleEdit = (dept: Department) => {
        setSelectedDept(dept);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedDept(undefined);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                await api.delete(`/v1/departments/${id}/`);
                fetchDepartments();
            } catch (error) {
                alert('Error deleting department. It may have employees assigned to it.');
            }
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
                    <p className="text-slate-500 text-sm">Manage company departments and structure</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    <Plus size={20} />
                    Add Department
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search departments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-medium text-slate-800"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <span>Loading departments...</span>
                        </div>
                    ) : filteredDepartments.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Created Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDepartments.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                                    <Building2 size={18} />
                                                </div>
                                                <span className="font-semibold text-slate-800">{dept.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate">
                                            {dept.description || 'No description'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {new Date(dept.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(dept)}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dept.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-20 text-center text-slate-500">
                            <Building2 className="mx-auto mb-4 opacity-20" size={64} />
                            <p>No departments found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>

            <DepartmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchDepartments}
                department={selectedDept}
            />
        </div>
    );
};

export default DepartmentPage;

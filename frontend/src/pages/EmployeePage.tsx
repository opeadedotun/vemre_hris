import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    Plus,
    Users,
    Search,
    Edit2,
    Trash2,
    Loader2,
    Mail,
    Hash,
    Briefcase,
    FileUp,
    Filter,
    X
} from 'lucide-react';
import EmployeeModal from '../components/EmployeeModal';

interface Employee {
    id: number;
    employee_code: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    department_name: string;
    department: number;
    job_role: number | null;
    job_title: string;
    employment_status: string;
    probation_end_date?: string;
    is_active: boolean;
    created_at: string;
    passport?: string;
}

const EmployeePage: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/v1/employees/');
            setEmployees(response.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleView = (employee: Employee) => {
        setSelectedEmployee(employee);
        setIsDetailOpen(true);
    };

    const handleAdd = () => {
        setSelectedEmployee(undefined);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to PERMANENTLY delete this employee? This action cannot be undone.')) {
            try {
                await api.delete(`/v1/employees/${id}/`);
                fetchEmployees();
                setIsDetailOpen(false);
                setIsModalOpen(false);
                alert('Employee deleted successfully.');
            } catch (error) {
                alert('Error deleting employee.');
            }
        }
    };

    const handleDeactivate = async (id: number, active: boolean) => {
        if (window.confirm(`Are you sure you want to ${active ? 'deactivate' : 'activate'} this employee?`)) {
            try {
                await api.patch(`/v1/employees/${id}/`, { is_active: !active });
                fetchEmployees();
            } catch (error) {
                alert('Error updating employee status.');
            }
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            await api.post('/v1/employees/import_csv/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchEmployees();
            alert('Employees imported successfully');
        } catch (error) {
            alert('Error importing employees. Please check the CSV format.');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        (emp.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employee_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
                    <p className="text-slate-500 text-sm">Manage staff records and performance profiles</p>
                </div>
                <div className="flex gap-3">
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-semibold cursor-pointer">
                        <FileUp size={18} />
                        Bulk Import
                        <input type="file" className="hidden" accept=".csv" onChange={handleImport} />
                    </label>
                    <button
                        onClick={handleAdd}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-semibold shadow-primary-900/20"
                    >
                        <Plus size={18} />
                        Add Employee
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <span>Loading employees...</span>
                        </div>
                    ) : filteredEmployees.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center group/img relative cursor-pointer" onClick={() => handleView(emp)}>
                                                    {emp.passport ? (
                                                        <img src={emp.passport} alt={emp.full_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-slate-500 font-bold">{emp.full_name?.[0] || 'E'}</span>
                                                    )}
                                                </div>
                                                <div className="cursor-pointer" onClick={() => handleView(emp)}>
                                                    <p className="font-bold text-slate-800">{emp.full_name}</p>
                                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                                        <Hash size={12} />
                                                        <span>{emp.employee_code}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Mail size={14} className="text-slate-400" />
                                                    <span>{emp.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Briefcase size={14} className="text-slate-400" />
                                                    <span>{emp.job_title} • {emp.department_name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${emp.employment_status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                    emp.employment_status === 'TERMINATED' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {emp.employment_status}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium px-2">
                                                    System: {emp.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(emp)}
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(emp.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Permanently Delete"
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
                            <Users className="mx-auto mb-4 opacity-20" size={64} />
                            <p>No employees found.</p>
                        </div>
                    )}
                </div>
            </div>

            <EmployeeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchEmployees}
                employee={selectedEmployee}
            />

            {/* Employee Detail Modal */}
            {isDetailOpen && selectedEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
                        <div className="h-32 bg-primary-600 relative">
                            <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-8 pb-8">
                            <div className="relative -mt-16 flex items-end gap-6 mb-8">
                                <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-slate-100">
                                    {selectedEmployee.passport ? (
                                        <img src={selectedEmployee.passport} alt={selectedEmployee.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-400">
                                            {selectedEmployee.full_name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="mb-2">
                                    <h2 className="text-3xl font-bold text-slate-900">{selectedEmployee.full_name}</h2>
                                    <p className="text-slate-500 font-medium">{selectedEmployee.job_title} • {selectedEmployee.department_name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 text-sm">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Contact Information</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Email</span>
                                            <span className="font-semibold text-slate-800">{selectedEmployee.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Employee Code</span>
                                            <span className="font-semibold text-slate-800">{selectedEmployee.employee_code}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Joined Date</span>
                                            <span className="font-semibold text-slate-800">{new Date(selectedEmployee.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Administrative Details</h3>
                                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Department</span>
                                            <span className="font-semibold text-slate-800">{selectedEmployee.department_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Role</span>
                                            <span className="font-semibold text-slate-800">{selectedEmployee.job_title}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Probation Ends</span>
                                            <span className="font-semibold text-slate-800">{selectedEmployee.probation_end_date ? new Date(selectedEmployee.probation_end_date).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Status</span>
                                            <span className={`font-bold ${selectedEmployee.employment_status === 'ACTIVE' ? 'text-green-600' :
                                                selectedEmployee.employment_status === 'TERMINATED' ? 'text-red-600' : 'text-slate-600'
                                                }`}>
                                                {selectedEmployee.employment_status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button onClick={() => { setIsDetailOpen(false); handleEdit(selectedEmployee); }} className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-900/20">Edit Profile</button>
                                <button onClick={() => handleDelete(selectedEmployee.id)} className="flex-1 border border-red-200 text-red-600 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors">Delete Employee</button>
                                <button onClick={() => setIsDetailOpen(false)} className="px-8 border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeePage;

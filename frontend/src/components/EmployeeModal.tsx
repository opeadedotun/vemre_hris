import * as React from 'react';
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../api/axios';

interface Department {
    id: number;
    name: string;
}

interface JobRole {
    id: number;
    name: string;
    department: number;
}

interface EmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employee?: {
        id: number;
        employee_code: string;
        full_name: string;
        first_name: string;
        last_name: string;
        email: string;
        department: number;
        job_role: number | null;
        job_title: string;
        date_joined?: string;
        employment_status: string;
        probation_end_date?: string;
        is_active: boolean;
        passport?: string;
    };
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    employee
}) => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
    const [formData, setFormData] = useState({
        employee_code: '',
        first_name: '',
        last_name: '',
        email: '',
        department: '',
        job_role: '',
        job_title: '',
        date_joined: '',
        employment_status: 'ACTIVE',
        probation_end_date: '',
        is_active: true
    });
    const [passport, setPassport] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [deptRes, roleRes] = await Promise.all([
                    api.get('/v1/departments/'),
                    api.get('/v1/job-roles/')
                ]);
                setDepartments(deptRes.data);
                setJobRoles(roleRes.data);
            } catch (err) {
                console.error('Failed to fetch metadata');
            }
        };
        if (isOpen) fetchMetadata();
    }, [isOpen]);

    useEffect(() => {
        if (employee) {
            setFormData({
                employee_code: employee.employee_code,
                first_name: employee.first_name,
                last_name: employee.last_name,
                email: employee.email,
                department: employee.department?.toString() || '',
                job_role: employee.job_role?.toString() || '',
                job_title: employee.job_title,
                date_joined: employee.date_joined || '',
                employment_status: employee.employment_status || 'ACTIVE',
                probation_end_date: employee.probation_end_date || '',
                is_active: employee.is_active
            });
        } else {
            setFormData({
                employee_code: '',
                first_name: '',
                last_name: '',
                email: '',
                department: '',
                job_role: '',
                job_title: '',
                date_joined: new Date().toISOString().split('T')[0],
                employment_status: 'ACTIVE',
                probation_end_date: '',
                is_active: true
            });
        }
        setPassport(null);
    }, [employee, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const submitData = new FormData();
            if (employee?.employee_code) {
                submitData.append('employee_code', employee.employee_code);
            }
            submitData.append('full_name', `${formData.first_name} ${formData.last_name}`.trim());
            submitData.append('email', formData.email);
            submitData.append('department', formData.department);
            if (formData.job_role) submitData.append('job_role', formData.job_role);
            submitData.append('job_title', formData.job_title);
            if (formData.date_joined) submitData.append('date_joined', formData.date_joined);
            submitData.append('employment_status', formData.employment_status);
            if (formData.probation_end_date) submitData.append('probation_end_date', formData.probation_end_date);
            submitData.append('is_active', formData.is_active ? 'True' : 'False');

            if (passport) {
                submitData.append('passport', passport);
            }

            if (employee) {
                await api.patch(`/v1/employees/${employee.id}/`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/v1/employees/', submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submission error:', err.response?.data);
            const data = err.response?.data;
            if (typeof data === 'string') {
                setError(data);
            } else if (data && typeof data === 'object') {
                // Handle DRF style errors: { detail: '...' } or { field: ['error'] }
                const firstError = Object.values(data).flat()[0];
                setError(typeof firstError === 'string' ? firstError : 'Invalid data submitted.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">
                        {employee ? 'Edit Employee' : 'Add New Employee'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center mb-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                                {passport ? (
                                    <img src={URL.createObjectURL(passport)} alt="Preview" className="w-full h-full object-cover" />
                                ) : employee?.passport ? (
                                    <img src={employee.passport} alt="Passport" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-slate-400 text-xs text-center px-2 font-medium">Click to upload Passport</span>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPassport(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">First Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Enter first name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Enter last name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Work Email *</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="email@vemre.com"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Department *</label>
                            <select
                                required
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value, job_role: '' })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">KPI Role (Framework)</label>
                            <select
                                value={formData.job_role}
                                onChange={(e) => {
                                    const roleId = e.target.value;
                                    const role = jobRoles.find(r => r.id.toString() === roleId);
                                    setFormData({
                                        ...formData,
                                        job_role: roleId,
                                        job_title: role ? role.name : formData.job_title
                                    });
                                }}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                            >
                                <option value="">Custom / None</option>
                                {jobRoles
                                    .filter(r => !formData.department || r.department.toString() === formData.department)
                                    .map((role) => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Job Title / Designation *</label>
                        <input
                            type="text"
                            required
                            value={formData.job_title}
                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="e.g. Operations Manager"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Date Joined *</label>
                            <input
                                type="date"
                                required
                                value={formData.date_joined}
                                onChange={(e) => setFormData({ ...formData, date_joined: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Employment Status *</label>
                            <select
                                required
                                value={formData.employment_status}
                                onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="TERMINATED">Terminated</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Probation End Date</label>
                            <input
                                type="date"
                                value={formData.probation_end_date}
                                onChange={(e) => setFormData({ ...formData, probation_end_date: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active Employee</label>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md shadow-primary-900/20"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            {employee ? 'Update Employee' : 'Add Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeModal;

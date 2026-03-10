import * as React from 'react';
import { useState, useEffect } from 'react';
import { X, Loader2, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

interface Department {
    id: number;
    name: string;
}

interface JobRole {
    id: number;
    name: string;
    department: number;
}

interface AttendanceLog {
    id: number;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    status: string;
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
    const { user: authUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'INFO' | 'ATTENDANCE'>('INFO');
    const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
    const [fetchingAttendance, setFetchingAttendance] = useState(false);
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
                    api.get('/departments/'),
                    api.get('/job-roles/')
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
        setActiveTab('INFO');
    }, [employee, isOpen]);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!employee || activeTab !== 'ATTENDANCE') return;
            setFetchingAttendance(true);
            try {
                const res = await api.get('/attendance/');
                // Filter for this employee and current month
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();

                const filtered = res.data.filter((a: any) => {
                    const d = new Date(a.date);
                    return a.employee === employee.id &&
                        (d.getMonth() + 1) === currentMonth &&
                        d.getFullYear() === currentYear;
                });
                setAttendance(filtered);
            } catch (err) {
                console.error('Failed to fetch attendance');
            } finally {
                setFetchingAttendance(false);
            }
        };
        fetchAttendance();
    }, [activeTab, employee]);

    if (!isOpen) return null;

    const isReadOnly = employee && (authUser?.role === 'USER' || authUser?.email === employee.email) && authUser?.role !== 'ADMIN';

    const handleSubmit = async (e: React.FormEvent) => {
        if (isReadOnly) return;
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
                await api.patch(`/employees/${employee.id}/`, submitData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/employees/', submitData, {
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
                {employee ? (
                    <div className="bg-emerald-600 px-6 py-10 text-white relative overflow-hidden">
                        {/* Decorative Patterns */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-black/10"></div>

                        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10">
                            <X size={24} />
                        </button>
                        <div className="relative z-10">
                            <div className="flex justify-center mb-4">
                                <img src={logo} alt="Logo" className="h-12 w-auto brightness-0 invert opacity-80" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">
                                {employee.full_name}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                                    {employee.employee_code}
                                </span>
                                <span className="text-emerald-100/60 text-xs font-medium">• Employee Record</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-800 uppercase">
                            Add New Employee
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                )}

                {employee && (
                    <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Role & Department</span>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <span>{employee.job_title}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-primary-600">{departments.find(d => d.id === employee.department)?.name || '...'}</span>
                            </div>
                        </div>
                        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${employee.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {employee.employment_status}
                        </div>
                    </div>
                )}

                {employee && (
                    <div className="flex border-b border-slate-100 bg-slate-50/50">
                        <button
                            onClick={() => setActiveTab('INFO')}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'INFO' ? 'bg-white text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <UserIcon size={14} />
                            Basic Info
                        </button>
                        {(authUser?.role === 'ADMIN' || authUser?.email === employee.email) && (
                            <button
                                onClick={() => setActiveTab('ATTENDANCE')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'ATTENDANCE' ? 'bg-white text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <CalendarIcon size={14} />
                                Attendance
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'INFO' ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
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
                                    disabled={isReadOnly}
                                    className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${isReadOnly ? 'bg-slate-50 text-slate-500 opacity-60' : ''}`}
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
                                    disabled={isReadOnly}
                                    className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${isReadOnly ? 'bg-slate-50 text-slate-500 opacity-60' : ''}`}
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
                                disabled={isReadOnly}
                                className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${isReadOnly ? 'bg-slate-50 text-slate-500 opacity-60' : ''}`}
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
                                    disabled={isReadOnly}
                                    className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium ${isReadOnly ? 'bg-slate-50 text-slate-500 opacity-60' : ''}`}
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
                                    disabled={isReadOnly}
                                    className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium ${isReadOnly ? 'bg-slate-50 text-slate-500 opacity-60' : ''}`}
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
                                disabled={isReadOnly}
                                className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${isReadOnly ? 'bg-slate-50 text-slate-500 opacity-60' : ''}`}
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
                                    disabled={isReadOnly}
                                    className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${isReadOnly ? 'bg-slate-50 text-slate-500 opacity-60' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Employment Status *</label>
                                <select
                                    required
                                    value={formData.employment_status}
                                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                                    disabled={isReadOnly}
                                    className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium ${isReadOnly ? 'bg-slate-50 text-slate-500 opacity-60' : ''}`}
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
                                    disabled={isReadOnly}
                                    className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${isReadOnly ? 'bg-slate-50 text-slate-500 opacity-60' : ''}`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className={`w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded ${isReadOnly ? 'opacity-50' : ''}`}
                                disabled={isReadOnly}
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active Employee</label>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                            >
                                {isReadOnly ? 'Close' : 'Cancel'}
                            </button>
                            {!isReadOnly && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center gap-2 shadow-md shadow-primary-900/20"
                                >
                                    {loading && <Loader2 size={18} className="animate-spin" />}
                                    {employee ? 'Update Employee' : 'Add Employee'}
                                </button>
                            )}
                        </div>
                    </form>
                ) : (
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Current Month Attendance</h3>
                            <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase tracking-widest">
                                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        {fetchingAttendance ? (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                                <Loader2 className="animate-spin" size={32} />
                                <p className="text-xs font-bold uppercase tracking-widest">Loading logs...</p>
                            </div>
                        ) : attendance.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <CalendarIcon size={40} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">No attendance logs found for this period.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {attendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' })}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                {log.clock_in || '--:--'} - {log.clock_out || '--:--'}
                                            </p>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${log.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                            log.status === 'LATE' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {log.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full mt-4 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeModal;


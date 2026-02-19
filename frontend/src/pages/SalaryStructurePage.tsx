import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Landmark, Briefcase, Plus, Save, Loader2, Info } from 'lucide-react';

const SalaryStructurePage: React.FC = () => {
    const [roles, setRoles] = useState<any[]>([]);
    const [salaries, setSalaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedRole, setSelectedRole] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        job_role: '',
        basic_salary: 0,
        housing_allowance: 0,
        transport_allowance: 0,
        medical_allowance: 0,
        utility_allowance: 0,
        other_allowances: 0,
        late_deduction_rate: 500,
        absent_deduction_rate: 1000
    });
    const [jobRoleData, setJobRoleData] = useState({
        shift_start: '',
        shift_end: '',
        work_days_type: 'MON_FRI'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, salaryRes] = await Promise.all([
                api.get('/v1/job-roles/'),
                api.get('/v1/salary-structures/')
            ]);
            setRoles(rolesRes.data);
            setSalaries(salaryRes.data);
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSelectRole = (role: any) => {
        setSelectedRole(role);
        const existing = salaries.find(s => s.job_role === role.id);
        if (existing) {
            setFormData({
                job_role: existing.job_role,
                basic_salary: Number(existing.basic_salary),
                housing_allowance: Number(existing.housing_allowance || 0),
                transport_allowance: Number(existing.transport_allowance || 0),
                medical_allowance: Number(existing.medical_allowance || 0),
                utility_allowance: Number(existing.utility_allowance || 0),
                other_allowances: Number(existing.other_allowances),
                late_deduction_rate: Number(existing.late_deduction_rate),
                absent_deduction_rate: Number(existing.absent_deduction_rate)
            });
        } else {
            setFormData({
                job_role: role.id,
                basic_salary: 0,
                housing_allowance: 0,
                transport_allowance: 0,
                medical_allowance: 0,
                utility_allowance: 0,
                other_allowances: 0,
                late_deduction_rate: 500,
                absent_deduction_rate: 1000
            });
        }
        setJobRoleData({
            shift_start: role.shift_start || '',
            shift_end: role.shift_end || '',
            work_days_type: role.work_days_type || 'MON_FRI'
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const existing = salaries.find(s => s.job_role === formData.job_role);
            if (existing) {
                await api.put(`/v1/salary-structures/${existing.id}/`, formData);
            } else {
                await api.post('/v1/salary-structures/', formData);
            }

            // Also update Job Role shift data
            await api.patch(`/v1/job-roles/${selectedRole.id}/`, jobRoleData);

            alert('Salary structure and shift settings saved successfully');
            fetchData();
        } catch (err) {
            alert('Failed to save salary structure.');
        } finally {
            setSaving(false);
        }
    };

    const grossTotal = formData.basic_salary + formData.housing_allowance + formData.transport_allowance +
        formData.medical_allowance + formData.utility_allowance + formData.other_allowances;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-900">
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Briefcase size={18} />
                        Job Roles
                    </h2>
                    <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                        {loading ? (
                            <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>
                        ) : roles.map(role => (
                            <button
                                key={role.id}
                                onClick={() => handleSelectRole(role)}
                                className={`w-full text-left p-3 rounded-lg text-sm transition-all ${selectedRole?.id === role.id
                                    ? 'bg-primary-50 text-primary-700 border border-primary-100 font-bold'
                                    : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                                    }`}
                            >
                                {role.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                {!selectedRole ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center h-full flex flex-col items-center justify-center">
                        <Landmark size={64} className="text-slate-100 mb-4" />
                        <p className="text-slate-400 font-medium">Select a job role to define its salary structure.</p>
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">{selectedRole.name}</h1>
                                <p className="text-slate-500 text-sm">Define base pay and monthly allowances</p>
                            </div>
                            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                                <Landmark size={24} />
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            {/* Basic Salary */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Basic Salary (Monthly)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.basic_salary}
                                    onChange={(e) => setFormData({ ...formData, basic_salary: Number(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-bold text-lg"
                                />
                            </div>

                            {/* Allowances Grid */}
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                <h3 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-4">Monthly Allowances</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Housing Allowance</label>
                                        <input
                                            type="number"
                                            value={formData.housing_allowance}
                                            onChange={(e) => setFormData({ ...formData, housing_allowance: Number(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transport Allowance</label>
                                        <input
                                            type="number"
                                            value={formData.transport_allowance}
                                            onChange={(e) => setFormData({ ...formData, transport_allowance: Number(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medical Allowance</label>
                                        <input
                                            type="number"
                                            value={formData.medical_allowance}
                                            onChange={(e) => setFormData({ ...formData, medical_allowance: Number(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utility Allowance</label>
                                        <input
                                            type="number"
                                            value={formData.utility_allowance}
                                            onChange={(e) => setFormData({ ...formData, utility_allowance: Number(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Other Allowances</label>
                                        <input
                                            type="number"
                                            value={formData.other_allowances}
                                            onChange={(e) => setFormData({ ...formData, other_allowances: Number(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Shift Configuration */}
                            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                                <h3 className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-4">Shift Configuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shift Start</label>
                                        <input
                                            type="time"
                                            required
                                            value={jobRoleData.shift_start}
                                            onChange={(e) => setJobRoleData({ ...jobRoleData, shift_start: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-primary-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Shift End</label>
                                        <input
                                            type="time"
                                            required
                                            value={jobRoleData.shift_end}
                                            onChange={(e) => setJobRoleData({ ...jobRoleData, shift_end: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-primary-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Work Days</label>
                                        <select
                                            value={jobRoleData.work_days_type}
                                            onChange={(e) => setJobRoleData({ ...jobRoleData, work_days_type: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border border-primary-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="MON_FRI">Monday-Friday</option>
                                            <option value="DAILY">Daily (Mon-Sun)</option>
                                            <option value="SHIFT_4_4">4 Days On, 4 Days Off</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Deduction Rules */}
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-4">Deduction Rules (Per Day)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lateness Penalty</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.late_deduction_rate}
                                            onChange={(e) => setFormData({ ...formData, late_deduction_rate: Number(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Absence Penalty</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.absent_deduction_rate}
                                            onChange={(e) => setFormData({ ...formData, absent_deduction_rate: Number(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Total</p>
                                    <p className="text-2xl font-black text-slate-800">
                                        ₦{grossTotal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-900/20 disabled:opacity-50 transition-all"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    Save Salary Structure
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalaryStructurePage;

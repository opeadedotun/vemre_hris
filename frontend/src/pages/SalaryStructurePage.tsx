import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Landmark, Briefcase, Save, Loader2, Info, Clock, ToggleLeft, ToggleRight } from 'lucide-react';

const SalaryStructurePage: React.FC = () => {
    const [roles, setRoles] = useState<any[]>([]);
    const [salaries, setSalaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedRole, setSelectedRole] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        job_role: '',
        basic_salary: 0,
        other_allowances: 0,
        use_manual_tax: false,
        manual_tax_amount: 0,
        has_pension: true,
        has_nhf: true,
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
                api.get('/job-roles/'),
                api.get('/salary-structures/')
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
                other_allowances: Number(existing.other_allowances),
                use_manual_tax: existing.use_manual_tax ?? false,
                manual_tax_amount: Number(existing.manual_tax_amount) || 0,
                has_pension: existing.has_pension ?? true,
                has_nhf: existing.has_nhf ?? true,
            });
        } else {
            setFormData({
                job_role: role.id,
                basic_salary: 0,
                other_allowances: 0,
                use_manual_tax: false,
                manual_tax_amount: 0,
                has_pension: true,
                has_nhf: true,
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
            const payload = { ...formData };
            const existing = salaries.find(s => s.job_role === formData.job_role);
            if (existing) {
                await api.put(`/salary-structures/${existing.id}/`, payload);
            } else {
                await api.post('/salary-structures/', payload);
            }

            // Also update Job Role shift data
            await api.patch(`/job-roles/${selectedRole.id}/`, jobRoleData);

            alert('Salary structure and shift settings saved successfully');
            fetchData();
        } catch (err) {
            alert('Failed to save salary structure.');
        } finally {
            setSaving(false);
        }
    };

    const grossTotal = formData.basic_salary + formData.other_allowances;
    // Calculate estimated pension & NHF deductions for display
    const estPension = formData.has_pension ? formData.basic_salary * 0.08 : 0;
    const estNhf = formData.has_nhf ? formData.basic_salary * 0.025 : 0;

    const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${value
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
            >
                {value ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {value ? 'Enabled' : 'Disabled'}
            </button>
        </div>
    );

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

                            {/* Allowances */}
                            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                <h3 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-4">Monthly Allowances</h3>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Other Allowances</label>
                                    <input
                                        type="number"
                                        value={formData.other_allowances}
                                        onChange={(e) => setFormData({ ...formData, other_allowances: Number(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                            </div>

                            {/* Statutory Deduction Flags */}
                            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                                <h3 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-3">Statutory Deductions</h3>
                                <div className="divide-y divide-orange-100">
                                    <Toggle
                                        label={`Pension (8% of Basic ≈ ₦${estPension.toLocaleString('en-NG', { maximumFractionDigits: 0 })})`}
                                        value={formData.has_pension}
                                        onChange={(v) => setFormData({ ...formData, has_pension: v })}
                                    />
                                    <Toggle
                                        label={`NHF (2.5% of Basic ≈ ₦${estNhf.toLocaleString('en-NG', { maximumFractionDigits: 0 })})`}
                                        value={formData.has_nhf}
                                        onChange={(v) => setFormData({ ...formData, has_nhf: v })}
                                    />
                                </div>
                            </div>

                            {/* Tax Configuration */}
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3">Income Tax</h3>
                                <Toggle
                                    label="Use Manual Tax Amount (overrides auto PAYE)"
                                    value={formData.use_manual_tax}
                                    onChange={(v) => setFormData({ ...formData, use_manual_tax: v })}
                                />
                                {formData.use_manual_tax && (
                                    <div className="mt-3 space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fixed Monthly Tax Amount (₦)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={formData.manual_tax_amount}
                                            onChange={(e) => setFormData({ ...formData, manual_tax_amount: Number(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                            placeholder="e.g. 15000"
                                        />
                                        <p className="text-[10px] text-blue-500">This amount will be deducted directly from the employee's pay each month in place of the computed PAYE tax.</p>
                                    </div>
                                )}
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

                            {/* Deduction Rules Information */}
                            <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-primary-600/20 text-primary-400 rounded-2xl border border-primary-500/20">
                                            <Info size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Payroll Policy 2026</h3>
                                            <p className="text-lg font-black text-white">Lateness Deduction Logic</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-2">Tier 1 (Mild)</p>
                                            <p className="text-sm font-bold text-slate-100 mb-1">6 - 30 Minutes Late</p>
                                            <p className="text-[10px] text-slate-500 font-medium">0.5 Hour pay deduction</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Tier 2 (Severe)</p>
                                            <p className="text-sm font-bold text-slate-100 mb-1">Over 30 Minutes Late</p>
                                            <p className="text-[10px] text-slate-500 font-medium">1.0 Hour pay deduction</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-start gap-3 p-4 bg-primary-900/40 rounded-2xl border border-primary-800/50">
                                        <Clock size={16} className="text-primary-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-primary-200/70 leading-relaxed font-medium">
                                            Deductions are calculated automatically based on the hourly rate derived from (Basic Salary / 20 working days / 8 hours). A 5-minute grace period is applied to all shift starts.
                                        </p>
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

import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Loader2, Save, Calendar, User as UserIcon, BarChart3, AlertCircle } from 'lucide-react';

interface Employee {
    id: number;
    full_name: string;
    employee_code: string;
    department_name: string;
    job_role: number; // Job Role ID
}

interface KPIDefinition {
    id: number;
    name: string;
    default_weight: number;
}

const KPIEntryPage: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [entries, setEntries] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/v1/employees/');
                setEmployees(res.data);
            } catch (err) {
                console.error('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedEmployee) {
            handleEmployeeSelect(selectedEmployee);
        }
    }, [month]);

    const handleEmployeeSelect = async (emp: Employee) => {
        setSelectedEmployee(emp);
        setLoading(true);
        setEntries([]); // Clear current entries
        try {
            // First, fetch the template for this role
            let templateItems: any[] = [];
            if (emp.job_role) {
                const templateRes = await api.get(`/v1/kpi-templates/?job_role=${emp.job_role}`);
                const templates = templateRes.data;
                if (templates.length > 0) {
                    templateItems = templates[0].items; // Use the first active template
                }
            }

            if (templateItems.length === 0) {
                setEntries([]);
                setLoading(false);
                return;
            }

            // Now, fetch existing entries for this month
            const response = await api.get(`/v1/employee-kpis/?employee=${emp.id}&month=${month}`);
            const existingEntries = response.data;

            // Map templates to entries, filling in actual_points if it exists
            const mergedEntries = templateItems.map(item => {
                const existing = existingEntries.find((e: any) => e.template_item === item.id);
                return {
                    id: existing?.id,
                    template_item: item.id,
                    kpi_name: item.kpi_name,
                    weight_points: item.weight_points,
                    target_points: existing?.target_points || 100,
                    actual_points: existing?.actual_points || 0
                };
            });

            setEntries(mergedEntries);
        } catch (err) {
            console.error('Failed to fetch entries');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedEmployee) return;
        setSaving(true);
        try {
            await Promise.all(entries.map(entry => {
                const payload = {
                    employee: selectedEmployee.id,
                    template_item: entry.template_item,
                    month,
                    target_points: entry.target_points,
                    actual_points: entry.actual_points
                };
                if (entry.id) {
                    return api.put(`/v1/employee-kpis/${entry.id}/`, payload);
                }
                return api.post('/v1/employee-kpis/', payload);
            }));
            alert('KPIs saved successfully');
            handleEmployeeSelect(selectedEmployee); // Refresh to get IDs
        } catch (err) {
            alert('Error saving KPIs.');
        } finally {
            setSaving(false);
        }
    };

    const [empSearch, setEmpSearch] = useState('');
    const filteredEmployees = employees.filter(e =>
        e.full_name.toLowerCase().includes(empSearch.toLowerCase()) ||
        e.employee_code.toLowerCase().includes(empSearch.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-slate-900">
            {/* Left Sidebar: Employee List */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <UserIcon size={18} />
                        Select Employee
                    </h2>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={empSearch}
                            onChange={(e) => setEmpSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-500"
                        />
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[60vh]">
                        {filteredEmployees.map(emp => (
                            <button
                                key={emp.id}
                                onClick={() => handleEmployeeSelect(emp)}
                                className={`w-full text-left p-3 rounded-lg text-sm transition-all ${selectedEmployee?.id === emp.id
                                    ? 'bg-primary-50 text-primary-700 border border-primary-100 font-bold'
                                    : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                                    }`}
                            >
                                <p className="truncate">{emp.full_name}</p>
                                <p className="text-[10px] opacity-60 uppercase">{emp.employee_code}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content: KPI Entry Form */}
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Monthly KPI Entry</h1>
                            <p className="text-slate-500 text-sm">
                                {selectedEmployee
                                    ? `Recording for ${selectedEmployee.full_name}`
                                    : 'Select an employee to start'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
                                <Calendar size={18} className="text-slate-400" />
                                <input
                                    type="month"
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                                />
                            </div>
                            <button
                                disabled={!selectedEmployee || saving}
                                onClick={handleSave}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold shadow-md shadow-primary-900/20 disabled:opacity-50 transition-all"
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Entries
                            </button>
                        </div>
                    </div>

                    {!selectedEmployee ? (
                        <div className="py-20 text-center">
                            <BarChart3 className="mx-auto mb-4 text-slate-200" size={64} />
                            <p className="text-slate-400 font-medium">Please select an employee from the list to enter KPI scores.</p>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="py-20 text-center">
                            <AlertCircle className="mx-auto mb-4 text-slate-200" size={64} />
                            <p className="text-slate-400 font-medium">No KPI templates found for this employee's role.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <div className="col-span-7">KPI Name (Weight)</div>
                                <div className="col-span-2 text-center">Target</div>
                                <div className="col-span-3 text-center">Actual Value</div>
                            </div>

                            {entries.map((entry, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 items-center px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                    <div className="col-span-7">
                                        <p className="font-bold text-slate-800 capitalize-first">
                                            {entry.kpi_name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weight: {entry.weight_points} pts</p>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={entry.target_points}
                                            onChange={(e) => {
                                                const newEntries = [...entries];
                                                newEntries[idx].target_points = parseFloat(e.target.value);
                                                setEntries(newEntries);
                                            }}
                                            className="w-full text-center py-1.5 bg-white border border-slate-200 rounded text-sm focus:ring-1 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            value={entry.actual_points}
                                            onChange={(e) => {
                                                const newEntries = [...entries];
                                                newEntries[idx].actual_points = parseFloat(e.target.value);
                                                setEntries(newEntries);
                                            }}
                                            className="w-full text-center py-1.5 bg-primary-50 border border-primary-100 rounded text-sm font-bold text-primary-700 focus:ring-1 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="mt-8 p-6 bg-primary-700 rounded-xl text-white flex justify-between items-center shadow-lg shadow-primary-900/30">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary-100 opacity-80">Total Monthly Score</p>
                                    <p className="text-4xl font-bold">
                                        {entries.reduce((sum, entry) => sum + (entry.actual_points / (entry.target_points || 1)) * entry.weight_points, 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                                    <BarChart3 size={24} className="text-primary-200" />
                                    <span className="text-sm font-medium text-primary-50">Performance Overview</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KPIEntryPage;

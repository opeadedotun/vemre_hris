import * as React from 'react';
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../api/axios';

interface KPITemplateItem {
    id?: number;
    kpi_name: string;
    weight_points: number;
}

interface KPITemplate {
    id: number;
    name: string;
    job_role: number;
    job_role_name?: string;
    total_points: number;
    is_active: boolean;
    items?: KPITemplateItem[];
}

interface KPITemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    kpi?: KPITemplate;
}

const KPITemplateModal: React.FC<KPITemplateModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    kpi
}) => {
    const [jobRoles, setJobRoles] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        job_role: '',
        is_active: true
    });
    const [items, setItems] = useState<KPITemplateItem[]>([
        { kpi_name: '', weight_points: 0 }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchJobRoles = async () => {
            try {
                const res = await api.get('/v1/job-roles/');
                setJobRoles(res.data);
            } catch (err) {
                console.error('Failed to fetch roles');
            }
        };
        if (isOpen) fetchJobRoles();
    }, [isOpen]);

    useEffect(() => {
        if (kpi) {
            setFormData({
                name: kpi.name,
                job_role: kpi.job_role.toString(),
                is_active: kpi.is_active
            });
            setItems(kpi.items || [{ kpi_name: '', weight_points: 0 }]);
        } else {
            setFormData({
                name: '',
                job_role: '',
                is_active: true
            });
            setItems([{ kpi_name: '', weight_points: 0 }]);
        }
    }, [kpi, isOpen]);

    if (!isOpen) return null;

    const addItem = () => setItems([...items, { kpi_name: '', weight_points: 0 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.weight_points.toString()) || 0), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (totalWeight !== 100) {
            setError(`Total weight must be exactly 100. Current total: ${totalWeight}`);
            return;
        }
        setLoading(true);
        setError('');

        try {
            const templateData = { ...formData };
            let res;
            if (kpi) {
                res = await api.put(`/v1/kpi-templates/${kpi.id}/`, templateData);
            } else {
                res = await api.post('/v1/kpi-templates/', templateData);
            }

            const templateId = res.data.id;

            // Handle items: this is a bit complex for a simple modal. 
            // For now, we'll delete existing items and recreate them, or just alert that this needs specialized handling.
            // A better way is to have a bulk update endpoint, but let's do sequential for now if needed.

            // If editing, we should ideally handle updates/deletes. 
            // Simplified approach for this project: Delete all items for this template and recreate.
            if (kpi) {
                const existingItems = kpi.items || [];
                await Promise.all(existingItems.map(item => api.delete(`/v1/kpi-template-items/${item.id}/`)));
            }

            await Promise.all(items.map(item => api.post('/v1/kpi-template-items/', {
                template: templateId,
                kpi_name: item.kpi_name,
                weight_points: item.weight_points
            })));

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(Object.values(err.response?.data || {}).flat()[0] as string || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">
                        {kpi ? 'Edit Template' : 'Add KPI Template'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Template Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="e.g. Sales Role Q1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Job Role *</label>
                            <select
                                required
                                value={formData.job_role}
                                onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                            >
                                <option value="">Select Role</option>
                                {jobRoles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-bold text-slate-700">KPI Items</label>
                            <button type="button" onClick={addItem} className="text-primary-600 text-xs font-bold hover:underline">+ Add Item</button>
                        </div>
                        {items.map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                                <input
                                    type="text"
                                    required
                                    placeholder="KPI Name"
                                    value={item.kpi_name}
                                    onChange={(e) => updateItem(idx, 'kpi_name', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                                />
                                <input
                                    type="number"
                                    required
                                    placeholder="Weight"
                                    value={item.weight_points}
                                    onChange={(e) => updateItem(idx, 'weight_points', e.target.value)}
                                    className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                                />
                                <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                        <div className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Total Weight</span>
                            <span className={`font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
                                {totalWeight} / 100
                            </span>
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
                        <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Active Template</label>
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
                            {kpi ? 'Update Template' : 'Create Template'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KPITemplateModal;

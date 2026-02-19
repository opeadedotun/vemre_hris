import * as React from 'react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Target, Edit2, Trash2, Loader2, Info } from 'lucide-react';
import KPITemplateModal from '../components/KPITemplateModal';

interface KPITemplateItem {
    id: number;
    kpi_name: string;
    weight_points: number;
}

interface KPITemplate {
    id: number;
    name: string;
    job_role: number;
    job_role_name: string;
    total_points: number;
    is_active: boolean;
    items: KPITemplateItem[];
}

const KPIDefinitionPage: React.FC = () => {
    const [templates, setTemplates] = useState<KPITemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<KPITemplate | undefined>();

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/v1/kpi-templates/');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleAdd = () => {
        setSelectedTemplate(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (template: KPITemplate) => {
        setSelectedTemplate(template);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this KPI template? This may affect existing performance entries.')) {
            try {
                await api.delete(`/v1/kpi-templates/${id}/`);
                fetchTemplates();
            } catch (error) {
                alert('Error deleting template.');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">KPI Templates</h1>
                    <p className="text-slate-500 text-sm">Define and manage performance metrics templates by job role</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-primary-500 font-semibold"
                >
                    <Plus size={20} />
                    Add Template
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="animate-spin mb-2" size={32} />
                        <span>Loading templates...</span>
                    </div>
                ) : templates.length > 0 ? (
                    templates.map((template) => (
                        <div key={template.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                                    <Target size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h3 className="font-bold text-slate-800 text-lg uppercase">{template.name}</h3>
                                <p className="text-primary-600 text-xs font-bold uppercase tracking-wider mt-1">{template.job_role_name}</p>
                                <div className="mt-3 space-y-1">
                                    {template.items?.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-xs text-slate-500">
                                            <span className="uppercase">{item.kpi_name}</span>
                                            <span className="font-semibold">{item.weight_points} pts</span>
                                        </div>
                                    ))}
                                    {template.items && template.items.length > 3 && (
                                        <p className="text-[10px] text-slate-400">+{template.items.length - 3} more items</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Weight</span>
                                    <span className="text-xl font-bold text-primary-600">{template.total_points}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {template.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-slate-200">
                        <Info className="mx-auto mb-4 text-slate-300" size={48} />
                        <h3 className="font-semibold text-slate-800">No KPI Templates</h3>
                        <p className="text-slate-500 text-sm mt-1">Start by adding a performance metric template for a job role.</p>
                    </div>
                )}
            </div>

            <KPITemplateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTemplates}
                kpi={selectedTemplate}
            />
        </div>
    );
};

export default KPIDefinitionPage;

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    Plus,
    Layout
} from 'lucide-react';
import { knowledgeApi, KnowledgeArticle, KnowledgeCategory } from '../api/knowledge';

const KnowledgeArticleEdit: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(slug);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<KnowledgeCategory[]>([]);

    const [formData, setFormData] = useState<Partial<KnowledgeArticle>>({
        title: '',
        category: 0,
        content: '',
        is_published: false
    });

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const catsRes = await knowledgeApi.getCategories();
                setCategories(catsRes.data);

                if (isEdit && slug) {
                    const articleRes = await knowledgeApi.getArticle(slug);
                    setFormData(articleRes.data);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load article data');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [isEdit, slug]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: name === 'category' ? parseInt(value) : val
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.category || !formData.content) {
            setError('Please fill in all required fields');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            if (isEdit && slug) {
                await knowledgeApi.updateArticle(slug, formData);
                setSuccess(true);
                setTimeout(() => navigate(`/knowledge/${slug}`), 1500);
            } else {
                const res = await knowledgeApi.createArticle(formData);
                setSuccess(true);
                setTimeout(() => navigate(`/knowledge/${res.data.slug}`), 1500);
            }
        } catch (err: any) {
            console.error('Error saving article:', err);
            setError(err.response?.data?.error || 'Failed to save article. Check slug uniqueness or permissions.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p>Loading article editor...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between font-bold text-sm">
                <Link
                    to={isEdit ? `/knowledge/${slug}` : "/knowledge"}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ChevronLeft size={18} />
                    Cancel and Return
                </Link>
                <div className="flex items-center gap-3">
                    {success && (
                        <span className="flex items-center gap-1.5 text-green-600 animate-in fade-in slide-in-from-right duration-300">
                            <CheckCircle size={16} />
                            Article saved! Redirecting...
                        </span>
                    )}
                    {error && (
                        <span className="flex items-center gap-1.5 text-red-600 animate-in shake duration-300">
                            <AlertCircle size={16} />
                            {error}
                        </span>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="bg-slate-900 p-8 text-white">
                    <h1 className="text-3xl font-black mb-2">{isEdit ? 'Edit Article' : 'Create New Article'}</h1>
                    <p className="text-slate-400 text-sm">Draft or publish documentation for the whole company</p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block px-1">Article Title *</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Employee Onboarding Procedure"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-slate-800"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block px-1">Category *</label>
                            <div className="relative">
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none font-bold text-slate-800"
                                    required
                                >
                                    <option value={0}>Select a category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                                    <Plus size={16} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 block px-1">Article Content (Rich Text / Markdown) *</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows={15}
                            placeholder="Write your article content here..."
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-700 leading-relaxed resize-none"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.is_published ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                                {formData.is_published ? <CheckCircle size={24} /> : <Layout size={24} />}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-sm">Publishing Status</h3>
                                <p className="text-xs text-slate-500">{formData.is_published ? 'Visible to all employees' : 'Only visible to Management'}</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer group">
                            <input
                                type="checkbox"
                                name="is_published"
                                checked={formData.is_published}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-inner group-hover:after:scale-105 transition-all"></div>
                        </label>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-primary-900/20 transition-all disabled:opacity-50 disabled:translate-y-0 active:translate-y-1"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            {isEdit ? 'Save Changes' : 'Create Article'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/knowledge')}
                            className="px-8 border border-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default KnowledgeArticleEdit;

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Edit2,
    Clock,
    User,
    History,
    Trash2,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
    Tag,
    X
} from 'lucide-react';
import { knowledgeApi, KnowledgeArticle, KnowledgeVersion } from '../api/knowledge';
import { useAuth } from '../context/AuthContext';

const KnowledgeArticleView: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [article, setArticle] = useState<KnowledgeArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<KnowledgeVersion[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        const fetchArticle = async () => {
            if (!slug) return;
            setLoading(true);
            try {
                const response = await knowledgeApi.getArticle(slug);
                setArticle(response.data);
            } catch (error) {
                console.error('Error fetching article:', error);
                navigate('/knowledge');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [slug]);

    const fetchHistory = async () => {
        if (!slug) return;
        setLoadingHistory(true);
        try {
            const response = await knowledgeApi.getArticleHistory(slug);
            setHistory(response.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleDelete = async () => {
        if (!article || !window.confirm('Are you sure you want to delete this article?')) return;
        try {
            await knowledgeApi.deleteArticle(article.slug);
            navigate('/knowledge');
        } catch (error) {
            alert('Error deleting article');
        }
    };

    const toggleHistory = () => {
        if (!showHistory) fetchHistory();
        setShowHistory(!showHistory);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p>Loading article...</p>
            </div>
        );
    }

    if (!article) return null;

    const canEdit = user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <Link
                    to="/knowledge"
                    className="flex items-center gap-2 text-slate-500 hover:text-primary-600 font-medium transition-colors text-sm"
                >
                    <ChevronLeft size={18} />
                    Back to Knowledge Base
                </Link>
                <div className="flex gap-2">
                    <button
                        onClick={toggleHistory}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${showHistory
                                ? 'bg-slate-900 text-white'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <History size={16} />
                        Version History
                    </button>
                    {canEdit && (
                        <>
                            <Link
                                to={`/knowledge/edit/${article.slug}`}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-bold"
                            >
                                <Edit2 size={16} />
                                Edit
                            </Link>
                            <button
                                onClick={handleDelete}
                                className="bg-white text-red-600 border border-red-100 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-bold"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <main className="flex-1 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                        <header className="mb-8 pb-8 border-b border-slate-100">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {article.category_name}
                                </span>
                                {!article.is_published && (
                                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        Draft Mode
                                    </span>
                                )}
                                {article.is_published && (
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle size={14} />
                                        Published
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl font-black text-slate-800 mb-6 leading-tight">
                                {article.title}
                            </h1>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                <div className="space-y-1">
                                    <span className="block opacity-50">Author</span>
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[8px]">
                                            <User size={10} />
                                        </div>
                                        {article.created_by_name}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block opacity-50">Last Update</span>
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                        <Calendar size={12} className="text-primary-500" />
                                        {new Date(article.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block opacity-50">Version</span>
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                        <Tag size={12} className="text-primary-500" />
                                        v{article.version_number}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block opacity-50">Reading Time</span>
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                        <Clock size={12} className="text-primary-500" />
                                        {Math.ceil(article.content.split(' ').length / 200)} min read
                                    </span>
                                </div>
                            </div>
                        </header>

                        <article className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-slate-800 prose-a:text-primary-600">
                            {/* Simple rendering of content, assuming it might have HTML from a rich text editor */}
                            <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }} />
                        </article>
                    </div>
                </main>

                {/* History Sidebar */}
                {showHistory && (
                    <aside className="w-full lg:w-80 animate-in slide-in-from-right duration-300">
                        <div className="bg-slate-900 rounded-3xl p-6 text-white sticky top-6 shadow-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                                    <History size={16} className="text-primary-400" />
                                    Version History
                                </h3>
                                <button onClick={() => setShowHistory(false)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                    <Loader2 className="animate-spin mb-4" size={24} />
                                    <p className="text-xs">Loading history...</p>
                                </div>
                            ) : history.length > 0 ? (
                                <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                                    {history.map((v) => (
                                        <div key={v.id} className="relative pl-8 group">
                                            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center group-hover:bg-primary-600 group-hover:border-primary-500 transition-all">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-sm text-white">Version {v.version_number}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase font-black">{new Date(v.edited_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mb-2">Edited by {v.edited_by_name}</p>
                                                {/* In a real app, we might allow restoring versions */}
                                                <button className="text-[10px] font-black uppercase text-primary-400 hover:text-primary-300 transition-colors">View Snapshot</button>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Current Version */}
                                    <div className="relative pl-8 group">
                                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-primary-600 border-2 border-primary-500 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-sm text-white text-primary-400">Current v{article.version_number}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">Current published state</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 opacity-30">
                                    <AlertCircle className="mx-auto mb-2" size={32} />
                                    <p className="text-xs">No previous versions</p>
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default KnowledgeArticleView;

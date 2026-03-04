import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Book,
    Plus,
    ChevronRight,
    Clock,
    User,
    Tag,
    Filter,
    Loader2,
    SearchX,
    X,
    Trash2
} from 'lucide-react';
import { knowledgeApi, KnowledgeArticle, KnowledgeCategory } from '../api/knowledge';
import { useAuth } from '../context/AuthContext';

const KnowledgeDashboard: React.FC = () => {
    const { user } = useAuth();
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
    const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [creatingCategory, setCreatingCategory] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [articlesRes, categoriesRes] = await Promise.all([
                knowledgeApi.getArticles({
                    category: selectedCategory || undefined,
                    search: searchTerm || undefined
                }),
                knowledgeApi.getCategories()
            ]);
            setArticles(articlesRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error fetching knowledge base data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCategory]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName) return;
        setCreatingCategory(true);
        try {
            await knowledgeApi.createCategory({ name: newCategoryName });
            setNewCategoryName('');
            setIsCategoryModalOpen(false);
            fetchData();
        } catch (err) {
            alert('Error creating category');
        } finally {
            setCreatingCategory(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!window.confirm('Delete category? Articles in this category will be inaccessible until reassigned.')) return;
        try {
            await knowledgeApi.deleteCategory(id);
            fetchData();
        } catch (err) {
            alert('Error deleting category');
        }
    };

    const canCreate = user?.role === 'ADMIN';
    const isAdmin = user?.role === 'ADMIN';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Book className="text-primary-600" />
                        Knowledge Base & SOPs
                    </h1>
                    <p className="text-slate-500 text-sm">Internal documentation, policies, and standard operating procedures</p>
                </div>
                <div className="flex gap-3">
                    {isAdmin && (
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-semibold"
                        >
                            <Tag size={18} />
                            Manage Categories
                        </button>
                    )}
                    {canCreate && (
                        <Link
                            to="/knowledge/new"
                            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all text-sm font-semibold shadow-primary-900/20"
                        >
                            <Plus size={18} />
                            New Article
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Search and Sidebar */}
                <aside className="w-full lg:w-64 space-y-6">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    </form>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                                <Filter size={14} />
                                Categories
                            </h3>
                        </div>
                        <nav className="p-2">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${selectedCategory === null
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                All Articles
                                <ChevronRight size={14} className={`transition-transform ${selectedCategory === null ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group ${selectedCategory === cat.id
                                        ? 'bg-primary-50 text-primary-600'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="truncate">{cat.name}</span>
                                    <ChevronRight size={14} className={`transition-transform ${selectedCategory === cat.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                                </button>
                            ))}
                        </nav>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1">
                    {loading ? (
                        <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p>Loading internal knowledge...</p>
                        </div>
                    ) : articles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {articles.map((article) => (
                                <Link
                                    key={article.id}
                                    to={`/knowledge/${article.slug}`}
                                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-primary-200 transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                {article.category_name}
                                            </span>
                                            {!article.is_published && (
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                                            {article.title}
                                        </h2>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                                            {article.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <User size={12} />
                                                {article.created_by_name}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(article.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className="flex items-center gap-1">
                                            <Tag size={12} />
                                            v{article.version_number}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 p-20 flex flex-col items-center justify-center text-slate-400">
                            <SearchX className="mb-4 opacity-20" size={64} />
                            <p className="text-lg font-medium">No articles found</p>
                            <p className="text-sm">Try adjusting your search or category filter</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-black text-slate-800">Manage Categories</h2>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <form onSubmit={handleCreateCategory} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="New category name..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm font-bold"
                                />
                                <button
                                    type="submit"
                                    disabled={creatingCategory || !newCategoryName}
                                    className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 transition-all disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </form>

                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group hover:bg-slate-100 transition-colors">
                                        <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="text-slate-300 hover:text-red-600 transition-colors p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Close Manager</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeDashboard;

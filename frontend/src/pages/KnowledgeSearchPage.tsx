import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Filter,
    Book,
    Clock,
    User,
    Tag,
    ChevronRight,
    Loader2,
    SearchX,
    Building2
} from 'lucide-react';
import { knowledgeApi, KnowledgeArticle, KnowledgeCategory } from '../api/knowledge';
import api from '../api/axios'; // For departments

interface Department {
    id: number;
    name: string;
}

const KnowledgeSearchPage: React.FC = () => {
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
    const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        category: '',
        department: ''
    });

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [catsRes, deptsRes] = await Promise.all([
                    knowledgeApi.getCategories(),
                    api.get<Department[]>('/departments/')
                ]);
                setCategories(catsRes.data);
                setDepartments(deptsRes.data);
            } catch (err) {
                console.error('Error fetching search metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const res = await knowledgeApi.getArticles({
                search: filters.search || undefined,
                category: filters.category ? parseInt(filters.category) : undefined,
                department: filters.department ? parseInt(filters.department) : undefined
            });
            setArticles(res.data);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Initial search
    useEffect(() => {
        handleSearch();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4 py-8">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-3">
                    <Search className="text-primary-600" size={36} />
                    Advanced Knowledge Search
                </h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                    Find procedures, policies, and documentation across all departments and categories.
                </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <form onSubmit={handleSearch} className="p-8 bg-slate-50 border-b border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 relative">
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Search by title or content keywords..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-slate-800"
                            />
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        </div>
                        <div className="relative">
                            <select
                                name="category"
                                value={filters.category}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none font-bold text-slate-800"
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <Tag className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        </div>
                        <div className="relative">
                            <select
                                name="department"
                                value={filters.department}
                                onChange={handleFilterChange}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none font-bold text-slate-800"
                            >
                                <option value="">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                            <Building2 className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary-900/20 transition-all flex items-center gap-2"
                        >
                            <Filter size={16} />
                            Search Now
                        </button>
                    </div>
                </form>

                <div className="p-8">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="animate-spin mb-4" size={48} />
                            <p className="font-bold">Scanning database...</p>
                        </div>
                    ) : articles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article) => (
                                <Link
                                    key={article.id}
                                    to={`/knowledge/${article.slug}`}
                                    className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-2xl hover:border-primary-200 transition-all flex flex-col justify-between shadow-sm relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                {article.category_name}
                                            </span>
                                            {!article.is_published && (
                                                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                                            {article.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                                            {article.content.replace(/<[^>]*>/g, '')}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5">
                                                <User size={14} className="text-slate-300" />
                                                {article.created_by_name?.split(' ')[0]}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={14} className="text-slate-300" />
                                                {new Date(article.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-200 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50/0 group-hover:bg-primary-50/50 rounded-bl-full transition-all -mr-12 -mt-12"></div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center text-slate-400">
                            <SearchX className="mb-6 opacity-20" size={80} />
                            <h3 className="text-2xl font-black text-slate-800 mb-2">No matching documentation</h3>
                            <p className="max-w-md mx-auto">We couldn't find any articles matching your search criteria. Try using different keywords or removing filters.</p>
                            <button
                                onClick={() => setFilters({ search: '', category: '', department: '' })}
                                className="mt-8 text-primary-600 font-black uppercase tracking-widest text-xs hover:underline"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeSearchPage;

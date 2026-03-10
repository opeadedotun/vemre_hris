import api from './axios';

export interface KnowledgeCategory {
    id: number;
    name: string;
    department: number | null;
    department_name?: string;
    created_at: string;
}

export interface KnowledgeVersion {
    id: number;
    version_number: number;
    content_snapshot: string;
    edited_by_name: string;
    edited_at: string;
}

export interface KnowledgeArticle {
    id: number;
    title: string;
    slug: string;
    category: number;
    category_name?: string;
    content: string;
    version_number: number;
    created_by: number;
    created_by_name?: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    versions?: KnowledgeVersion[];
}

export interface OnboardingGuide {
    id: number;
    job_role: number;
    job_role_name: string;
    title: string;
    content: string;
    checklist_json: string[];
    created_at: string;
}

export interface OnboardingProgress {
    id: number;
    employee: number;
    employee_name: string;
    guide: number;
    guide_title: string;
    guide_content: string;
    checklist: string[];
    completed_items: string[];
    is_completed: boolean;
    started_at: string;
    completed_at: string | null;
}

export const knowledgeApi = {
    // Categories
    getCategories: () => api.get<KnowledgeCategory[]>('/knowledge-categories/'),
    createCategory: (data: Partial<KnowledgeCategory>) => api.post<KnowledgeCategory>('/knowledge-categories/', data),
    deleteCategory: (id: number) => api.delete(`/knowledge-categories/${id}/`),

    // Articles
    getArticles: (params?: { category?: number; search?: string; department?: number }) =>
        api.get<KnowledgeArticle[]>('/knowledge-articles/', { params }),
    getArticle: (slug: string) => api.get<KnowledgeArticle>(`/knowledge-articles/${slug}/`),
    createArticle: (data: Partial<KnowledgeArticle>) => api.post<KnowledgeArticle>('/knowledge-articles/', data),
    updateArticle: (slug: string, data: Partial<KnowledgeArticle>) => api.patch<KnowledgeArticle>(`/knowledge-articles/${slug}/`, data),
    deleteArticle: (slug: string) => api.delete(`/knowledge-articles/${slug}/`),
    getArticleHistory: (slug: string) => api.get<KnowledgeVersion[]>(`/knowledge-articles/${slug}/history/`),

    // Onboarding
    getOnboardingGuides: () => api.get<OnboardingGuide[]>('/onboarding-guides/'),
    createOnboardingGuide: (data: Partial<OnboardingGuide>) => api.post<OnboardingGuide>('/onboarding-guides/', data),
    getMyOnboarding: () => api.get<OnboardingProgress>('/onboarding-progress/my_guide/'),
    updateOnboardingProgress: (id: number, completed_items: string[]) =>
        api.patch<OnboardingProgress>(`/onboarding-progress/${id}/update_progress/`, { completed_items }),

    // AI FAQ
    askFAQ: (query: string) => api.post<FAQResponse>('/ai-faq/ask/', { query }),
    getSuggestedQuestions: () => api.get<{ suggestions: string[] }>('/ai-faq/suggested/'),
};

export interface FAQArticleResult {
    id: number;
    title: string;
    slug: string;
    category_name: string | null;
    snippet: string;
    relevance_score: number;
}

export interface FAQResponse {
    answer: string;
    articles: FAQArticleResult[];
    has_results: boolean;
}

export default knowledgeApi;

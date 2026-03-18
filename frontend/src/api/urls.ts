const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const getApiBaseURL = () => {
    const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const normalized = normalizeBaseUrl(rawBaseURL);
    if (/\/api$/.test(normalized)) {
        return `${normalized}/v1`;
    }
    return normalized;
};

export const getAuthBaseURL = () => {
    const apiBase = getApiBaseURL();
    return apiBase.replace(/\/v1$/, '');
};

import axios from 'axios';

class ApiClient {
    private client = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    });

    constructor() {
        this.client.interceptors.request.use((config) => {
            // In a real browser environment, localStorage would be used here
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('accessToken');
                if (token) config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    async post<T>(url: string, data: any) {
        const response = await this.client.post(url, data);
        return response.data;
    }

    async get<T>(url: string) {
        const response = await this.client.get(url);
        return response.data;
    }

    setTokens(accessToken: string, refreshToken: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        }
    }
}

export const apiClient = new ApiClient();

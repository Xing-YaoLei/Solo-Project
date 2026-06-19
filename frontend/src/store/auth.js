import { create } from 'zustand';
import { api } from '../api';
export const useAuth = create((set, get) => ({
    token: localStorage.getItem('access_token'),
    user: localStorage.getItem('current_user')
        ? JSON.parse(localStorage.getItem('current_user'))
        : null,
    isAuthenticated: !!localStorage.getItem('access_token'),
    login: async (username, password) => {
        const form = new FormData();
        form.append('username', username);
        form.append('password', password);
        const res = await api.post('/auth/login', form);
        const token = res.data.access_token;
        localStorage.setItem('access_token', token);
        set({ token, isAuthenticated: true });
        await get().fetchMe();
    },
    register: async (data) => {
        await api.post('/auth/register', data);
    },
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        set({ token: null, user: null, isAuthenticated: false });
    },
    fetchMe: async () => {
        try {
            const res = await api.get('/auth/me');
            localStorage.setItem('current_user', JSON.stringify(res.data));
            set({ user: res.data });
        }
        catch {
            get().logout();
        }
    },
    hasRole: (...roles) => {
        const user = get().user;
        if (!user)
            return false;
        if (user.role === 'admin')
            return true;
        return roles.includes(user.role);
    },
}));

import axios from 'axios';
import Constants from 'expo-constants';

import { URL } from '@/constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl || URL;

export const api = axios.create({
    baseURL: apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const auctionApi = {
    auth: {
        login: async (data: { email: string; password: string }) => {
            const response = await api.post('/auth', data);
            return response.data;
        },
        signup: async (data: { email: string; password: string; name: string; campus: string, phone: string }) => {
            const response = await api.post('/auth/register', data);
            return response.data;
        },
    },
    items: {
        create: async (data: FormData) => {
            const response = await api.post('/items', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        getAll: async () => {
            const response = await api.get('/items');
            return response.data;
        },
        getById: async (id: string) => {
            const response = await api.get(`/items/${id}`);
            return response.data;
        },
        placeBid: async (itemId: string, amount: number) => {
            const response = await api.post(`/items/${itemId}/bids`, { amount });
            return response.data;
        },
    },
};
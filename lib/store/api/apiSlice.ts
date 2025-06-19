import { URL } from '@/constants';
import type { FetchArgs } from '@reduxjs/toolkit/query';
import { BaseQueryFn, createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { RootState } from '..';
import { setCredentials } from '../slice/authSlice';

interface RefreshResponse {
    accessToken: string;
    refreshToken?: string;
}

// Setup base query with headers and token injection
const baseQuery = fetchBaseQuery({
    baseUrl: URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token;
        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
    },
});

// Enhance base query with automatic token refresh
const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result?.error?.status === 403) {
        const refreshToken = (api.getState() as RootState).auth.refreshToken;
        const refreshResult = await baseQuery(
            {
                url: '/auth/refresh',
                method: 'GET',
                headers: refreshToken ? { 'x-refresh-token': refreshToken } : {},
            },
            api,
            extraOptions
        );

        if (refreshResult?.data) {
            const user = (api.getState() as RootState).auth.user;
            const accessToken = (refreshResult.data as RefreshResponse).accessToken;
            if (user) {
                api.dispatch(setCredentials({ user, token: accessToken }));
            }
            result = await baseQuery(args, api, extraOptions);
        } else {
            if (
                refreshResult?.error?.status === 403 &&
                refreshResult.error.data &&
                typeof refreshResult.error.data === 'object' &&
                refreshResult.error.data !== null
            ) {
                (refreshResult.error.data as { message?: string }).message = 'Your login session has expired';
            }
            return refreshResult;
        }
    }

    return result;
};

// Create the API slice with tags and empty endpoints
export const apiSlice = createApi({
    reducerPath: 'apis',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Users', 'Messages', 'Conversations', 'Items', 'Bids', 'Transactions', 'Notifications'],
    endpoints: () => ({}),
});

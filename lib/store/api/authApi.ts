import { AuthResponse, ForgotPasswordRequest, LoginRequest, RefreshResponse, RegisterRequest, RegisterResponse, ResetPasswordRequest } from '../../../types/authTypes';
import { logout, setCredentials } from '../slice/authSlice';
import { apiSlice } from './apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation<AuthResponse, LoginRequest>({
            query: (data) => ({
                url: '/auth',
                method: 'POST',
                body: data,
            }),
        }),
        register: builder.mutation<RegisterResponse, RegisterRequest>({
            query: (data) => ({
                url: '/auth/register',
                method: 'POST',
                body: data,
            }),
        }),
        forgot: builder.mutation<{ message: string }, ForgotPasswordRequest>({
            query: (data) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: data,
            }),
        }),
        reset: builder.mutation<{ message: string }, ResetPasswordRequest>({
            query: (data) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body: data,
            }),
        }),
        logout: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    dispatch(logout());
                    setTimeout(() => {
                        dispatch(apiSlice.util.resetApiState());
                    }, 1000);
                } catch (err) {
                    console.error('Logout error:', err);
                }
            },
        }),
        refresh: builder.mutation<RefreshResponse, void>({
            query: () => ({
                url: '/auth/refresh',
                method: 'GET',
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
                try {
                    const { data } = await queryFulfilled;
                    const { accessToken } = data as RefreshResponse;
                    // Retrieve current user from state
                    const state = getState() as unknown as { auth: { user: any } };
                    const user = state.auth.user;
                    dispatch(setCredentials({ user: user, token: accessToken }));
                } catch (err) {
                    console.error('Refresh error:', err);
                }
            },
        }),
    }),
});

export const {
    useLoginMutation,
    useLogoutMutation,
    useRegisterMutation,
    useRefreshMutation,
    useForgotMutation,
    useResetMutation,
} = authApiSlice;

import { Conversation } from '@/types/auction';
import { Response } from '@/types/authTypes';
import { createEntityAdapter, createSelector, EntityState } from '@reduxjs/toolkit';
import { RootState } from '..';
import { apiSlice } from './apiSlice';

const conversationsAdapter = createEntityAdapter<Conversation, string>({
    selectId: (conversation) => conversation._id,
});
const initialState = conversationsAdapter.getInitialState();

export const conversationsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getConversations: builder.query<EntityState<Conversation, string>, void>({
            query: () => ({
                url: '/conversations',
                validateStatus: (response, result) => response.status === 200 && !result.isError,
            }),
            transformResponse: (responseData: { data: Conversation[] }) => {
                const sortedData = responseData?.data.slice().sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                return conversationsAdapter.setAll(initialState, sortedData);
            },
            providesTags: (result) =>
                result?.ids
                    ? [
                        { type: 'Conversations' as const, id: 'LIST' },
                        ...result.ids.map((id) => ({ type: 'Conversations' as const, id })),
                    ]
                    : [{ type: 'Conversations' as const, id: 'LIST' }],
        }),

        addNewConversation: builder.mutation<Response, Partial<Conversation>>({
            query: (body) => {
                return {
                    url: `/conversations/${body.id ?? ''}`,
                    method: 'POST',
                    body,
                };
            },
            invalidatesTags: [{ type: 'Conversations', id: 'LIST' }],
        }),

        deleteConversation: builder.mutation<void, { id: string }>({
            query: ({ id }) => ({
                url: `/conversations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Conversations', id: 'LIST' }],
        }),

        deleteConversations: builder.mutation<void, void>({
            query: () => ({
                url: '/conversations',
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Conversations', id: 'LIST' }],
        }),

        addMessage: builder.mutation<Response, { convId: string; sender: string; receiver: string; content: string }>({
            query: ({ convId, sender, receiver, content }) => ({
                url: `/conversations/${convId}/messages`,
                method: 'POST',
                body: { sender, receiver, content },
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Conversations' as const, id: arg.convId },
            ],
        }),

        deleteMessage: builder.mutation<void, { convId: string; msgId: string }>({
            query: ({ convId, msgId }) => ({
                url: `/conversations/${convId}/messages/${msgId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Conversations' as const, id: arg.convId },
            ],
        }),

        updateMessage: builder.mutation<void, { convid: string; userid: string; }>({
            query: ({ convid, userid }) => {
                return {
                    url: `/conversations/${convid}/messages/${userid}`,
                    method: 'PATCH',
                }
            },
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Conversations' as const, id: arg.convid },
            ],
        }),

        deleteAllMessages: builder.mutation<void, { convId: string }>({
            query: ({ convId }) => ({
                url: `/conversations/${convId}/messages`,
                method: 'DELETE',
            }),
            invalidatesTags: (_result, _error, arg) => [
                { type: 'Conversations' as const, id: arg.convId },
            ],
        }),
    }),
});

export const {
    useGetConversationsQuery,
    useAddNewConversationMutation,
    useDeleteConversationMutation,
    useDeleteConversationsMutation,
    useAddMessageMutation,
    useUpdateMessageMutation,
    useDeleteMessageMutation,
    useDeleteAllMessagesMutation,
} = conversationsApiSlice;

export const selectConversationResult = conversationsApiSlice.endpoints.getConversations.select();

const selectConversationData = createSelector(
    selectConversationResult,
    (conversationResult) => conversationResult.data
);

export const {
    selectAll: selectAllConversations,
    selectById: selectConversationById,
    selectIds: selectConversationIds,
} = conversationsAdapter.getSelectors(
    (state: RootState) => selectConversationData(state) ?? initialState
);

import { Bid } from '@/types/auction';
import { Response } from '@/types/authTypes';
import { createEntityAdapter, createSelector, EntityState } from '@reduxjs/toolkit';
import { RootState } from '..';
import { apiSlice } from './apiSlice';

const bidsAdapter = createEntityAdapter<Bid, string>({
    selectId: (bid) => bid.id,
});
const initialState = bidsAdapter.getInitialState();

export const bidsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getBids: builder.query<EntityState<Bid, string>, void>({
            query: () => ({
                url: '/bids',
                validateStatus: (response, result) => response.status === 200 && !result.isError,
            }),
            transformResponse: (responseData: { data: Bid[] }) => {
                const sortedData = responseData?.data.slice().sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                return bidsAdapter.setAll(initialState, sortedData);
            },
            providesTags: (result) =>
                result?.ids
                    ? [
                        { type: 'Bids' as const, id: 'LIST' },
                        ...result.ids.map((id) => ({ type: 'Bids' as const, id })),
                    ]
                    : [{ type: 'Bids' as const, id: 'LIST' }],
        }),

        addNewBid: builder.mutation<Response, Partial<Bid>>({
            query: (initialBidData) => {
                return {
                    url: '/bids',
                    method: 'POST',
                    body: initialBidData,
                };
            },
            invalidatesTags: [{ type: 'Bids', id: 'LIST' }],
        }),

        updateBid: builder.mutation<void, Partial<Bid>>({
            query: (initialBidData) => ({
                url: '/bids',
                method: 'PATCH',
                body: initialBidData,
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Bids', id: arg.id ?? '' },
            ],
        }),

        deleteBid: builder.mutation<void, { id: string }>({
            query: ({ id }) => ({
                url: `/bids/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Bids', id: 'LIST' }],
        }),

        deleteBids: builder.mutation<void, void>({
            query: () => ({
                url: '/bids',
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Bids', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetBidsQuery,
    useAddNewBidMutation,
    useUpdateBidMutation,
    useDeleteBidMutation,
    useDeleteBidsMutation,
} = bidsApiSlice;

export const selectBidResult = bidsApiSlice.endpoints.getBids.select();

const selectBidData = createSelector(
    selectBidResult,
    (bidResult) => bidResult.data
);

export const {
    selectAll: selectAllBids,
    selectById: selectBidById,
    selectIds: selectBidIds,
} = bidsAdapter.getSelectors(
    (state: RootState) => selectBidData(state) ?? initialState
);

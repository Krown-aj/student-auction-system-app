import { Item } from '@/types/auction';
import { Response } from '@/types/authTypes';
import { createEntityAdapter, createSelector, EntityState } from '@reduxjs/toolkit';
import { RootState } from '..';
import { apiSlice } from './apiSlice';

const generateUniqueFileName = (uri: string): string => {
    let extension = 'jpg';
    if (uri) {
        const uriParts = uri.split('.');
        if (uriParts.length > 1) {
            extension = uriParts[uriParts.length - 1];
        }
    }
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}.${extension}`;
};

// Use _id as the entity key to match Mongo documents
const itemsAdapter = createEntityAdapter<Item, string>({
    selectId: (item) => item._id,
});
const initialState = itemsAdapter.getInitialState();

export const itemsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getItems: builder.query<EntityState<Item, string>, void>({
            query: () => ({
                url: '/items',
                validateStatus: (response, result) => response.status === 200 && !result.isError,
            }),
            transformResponse: (responseData: { data: Item[] }) => {
                const sortedData = responseData?.data.slice().sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                return itemsAdapter.setAll(initialState, sortedData);
            },
            providesTags: (result) =>
                result?.ids
                    ? [
                        { type: 'Items' as const, id: 'LIST' },
                        ...result.ids.map((id) => ({ type: 'Items' as const, id })),
                    ]
                    : [{ type: 'Items' as const, id: 'LIST' }],
        }),

        addNewItem: builder.mutation<Response, Partial<Item> & { images: string[] }>({
            query: (initialItemData) => {
                const formData = new FormData();
                formData.append('title', initialItemData.title ?? '');
                formData.append('description', initialItemData.description ?? '');
                formData.append(
                    'startingprice',
                    initialItemData.startingprice !== undefined
                        ? String(initialItemData.startingprice)
                        : ''
                );
                formData.append(
                    'currentprice',
                    initialItemData.currentprice !== undefined
                        ? String(initialItemData.currentprice)
                        : ''
                );
                formData.append(
                    'seller',
                    typeof initialItemData.seller === 'string'
                        ? initialItemData.seller
                        : initialItemData.seller?._id ?? ''
                );
                formData.append('category', initialItemData.category ?? '');
                formData.append('condition', initialItemData.condition ?? '');
                formData.append('campus', initialItemData.campus ?? '');
                formData.append('status', initialItemData.status ?? '');
                formData.append(
                    'startdate',
                    initialItemData.startdate
                        ? typeof initialItemData.startdate === 'string'
                            ? initialItemData.startdate
                            : initialItemData.startdate.toISOString()
                        : ''
                );
                formData.append(
                    'enddate',
                    initialItemData.enddate
                        ? typeof initialItemData.enddate === 'string'
                            ? initialItemData.enddate
                            : initialItemData.enddate.toISOString()
                        : ''
                );

                initialItemData.images?.forEach((imageUri) => {
                    const fileName = generateUniqueFileName(imageUri);
                    formData.append(
                        'images',
                        {
                            uri: imageUri,
                            name: fileName,
                            type: 'image/jpeg',
                        } as unknown as Blob
                    );
                });

                return {
                    url: '/items',
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: [{ type: 'Items', id: 'LIST' }],
        }),

        updateItem: builder.mutation<void, Partial<Item>>({
            query: (initialItemData) => ({
                url: '/items',
                method: 'PATCH',
                body: initialItemData,
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Items', id: arg._id ?? '' },
            ],
        }),

        deleteItem: builder.mutation<void, { _id: string }>({
            query: ({ _id }) => ({
                url: `/items/${_id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Items', id: 'LIST' }],
        }),

        deleteItems: builder.mutation<void, void>({
            query: () => ({
                url: '/items',
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Items', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetItemsQuery,
    useAddNewItemMutation,
    useUpdateItemMutation,
    useDeleteItemMutation,
    useDeleteItemsMutation,
} = itemsApiSlice;

export const selectItemResult = itemsApiSlice.endpoints.getItems.select();

const selectItemData = createSelector(
    selectItemResult,
    (itemResult) => itemResult.data
);

export const {
    selectAll: selectAllItems,
    selectById: selectItemById,
    selectIds: selectItemIds,
} = itemsAdapter.getSelectors(
    (state: RootState) => selectItemData(state) ?? initialState
);

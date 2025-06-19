import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '..';
// Define the slice state interface
type SpinnerState = {
    visible: boolean;
};

// Define the initial state using that type
const initialState: SpinnerState = {
    visible: false,
};

const spinnerSlice = createSlice({
    name: 'spinner',
    initialState,
    reducers: {
        setSpinner: (state, action: PayloadAction<{ visibility: boolean }>) => {
            state.visible = action.payload.visibility;
        },
    },
});

// Export the action creator
export const { setSpinner } = spinnerSlice.actions;

// Export the reducer to be added to the store
export default spinnerSlice.reducer;

// Selector to get spinner visibility from root state
export const selectCurrentSpinner = (state: RootState): boolean => state.spinner.visible;

// store/roomSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RoomState, Timer, DisplayNames } from "@/types/timer";

const initialDisplayName: DisplayNames = {
  text: "",
  styles: {
    color: "#000000",
    bold: false,
  },
};

const initialState: RoomState = {
  roomId: "",
  adminId: "",
  adminOnline: false,
  clientCount: 0,
  timers: [],
  currentTimerId: null,
  displayName: initialDisplayName,
  names: [initialDisplayName],
  flickering: null,
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setRoomState: (state, action: PayloadAction<Partial<RoomState>>) => {
      return { ...state, ...action.payload };
    },
    setRoomId: (state, action: PayloadAction<string>) => {
      state.roomId = action.payload;
    },
    setAdminId: (state, action: PayloadAction<string>) => {
      state.adminId = action.payload;
    },
    setAdminOnline: (state, action: PayloadAction<boolean>) => {
      state.adminOnline = action.payload;
    },
    setClientCount: (state, action: PayloadAction<number>) => {
      state.clientCount = action.payload;
    },

    // Timer actions
    setTimers: (state, action: PayloadAction<Timer[]>) => {
      state.timers = action.payload;
    },
    addTimer: (state, action: PayloadAction<Timer>) => {
      state.timers.push(action.payload);
    },
    updateTimer: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Timer> }>
    ) => {
      const timerIndex = state.timers.findIndex(
        (timer) => timer.id === action.payload.id
      );
      if (timerIndex !== -1) {
        state.timers[timerIndex] = {
          ...state.timers[timerIndex],
          ...action.payload.updates,
        };
      }
    },
    removeTimer: (state, action: PayloadAction<string>) => {
      state.timers = state.timers.filter(
        (timer) => timer.id !== action.payload
      );
      if (state.currentTimerId === action.payload) {
        state.currentTimerId = null;
      }
    },
    setCurrentTimerId: (state, action: PayloadAction<string | null>) => {
      state.currentTimerId = action.payload;
    },

    // DisplayName actions
    setDisplayName: (state, action: PayloadAction<DisplayNames>) => {
      state.displayName = action.payload;
    },
    updateDisplayNameText: (state, action: PayloadAction<string>) => {
      state.displayName.text = action.payload;
    },
    updateDisplayNameStyles: (
      state,
      action: PayloadAction<DisplayNames["styles"]>
    ) => {
      state.displayName.styles = action.payload;
    },

    // Names array actions
    setNames: (state, action: PayloadAction<DisplayNames[]>) => {
      state.names = action.payload;
    },
    addName: (state, action: PayloadAction<DisplayNames>) => {
      state.names.push(action.payload);
    },
    updateName: (
      state,
      action: PayloadAction<{ index: number; name: DisplayNames }>
    ) => {
      if (state.names[action.payload.index]) {
        state.names[action.payload.index] = action.payload.name;
      }
    },
    removeName: (state, action: PayloadAction<number>) => {
      state.names.splice(action.payload, 1);
    },

    // Flickering action
    setFlickering: (state, action: PayloadAction<boolean | null>) => {
      state.flickering = action.payload;
    },

    // Reset action
    resetRoom: () => initialState,
  },
});

export const {
  setRoomState,
  setRoomId,
  setAdminId,
  setAdminOnline,
  setClientCount,
  setTimers,
  addTimer,
  updateTimer,
  removeTimer,
  setCurrentTimerId,
  setDisplayName,
  updateDisplayNameText,
  updateDisplayNameStyles,
  setNames,
  addName,
  updateName,
  removeName,
  setFlickering,
  resetRoom,
} = roomSlice.actions;

export default roomSlice.reducer;

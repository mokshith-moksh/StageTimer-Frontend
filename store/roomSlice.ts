// store/roomSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RoomState, Timer, Messages } from "@/types/timer";

const initialState: RoomState = {
  roomId: "",
  adminId: "",
  roomName: "",
  adminOnline: false,
  clientCount: 0,
  connectedClients: [],
  timers: [],
  messages: [],
  activeMessage: null,
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
    addTimer: (state, action: PayloadAction<Timer[]>) => {
      state.timers = action.payload;
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
    },

    setNames: (state, action: PayloadAction<Messages[]>) => {
      state.messages = action.payload;
    },
    addName: (state, action: PayloadAction<Messages>) => {
      state.messages.push(action.payload);
    },
    updateName: (
      state,
      action: PayloadAction<{ index: number; name: Messages }>
    ) => {
      if (state.messages[action.payload.index]) {
        state.messages[action.payload.index] = action.payload.name;
      }
    },
    removeName: (state, action: PayloadAction<number>) => {
      state.messages.splice(action.payload, 1);
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
  setNames,
  addName,
  updateName,
  removeName,
  setFlickering,
  resetRoom,
} = roomSlice.actions;

export default roomSlice.reducer;

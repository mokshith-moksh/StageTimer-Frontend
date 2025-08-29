// store/roomSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RoomState, Timer } from "@/types/timer";

const initialState: RoomState = {
  roomId: "",
  adminId: "",
  adminSocketId: null,
  roomName: "",
  adminOnline: false,
  clientCount: 0,
  connectedClients: [],
  timers: [],
  messages: [],
  activeMessage: null,
  flickering: null,
  loading: false,
};

const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    setRoomState: (state, action: PayloadAction<Partial<RoomState>>) => {
      return { ...state, ...action.payload };
    },

    // ✅ keep real-time incremental updates
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

    resetRoom: () => initialState,
  },
});

export const { setRoomState, updateTimer, resetRoom } = roomSlice.actions;
export default roomSlice.reducer;

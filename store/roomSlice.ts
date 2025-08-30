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

    updateMsg: (state, action: PayloadAction<{ id: string; msg: string }>) => {
      const index = state.messages.findIndex(
        (msg) => msg.id === action.payload.id
      );
      state.messages[index] = {
        ...state.messages[index],
        text: action.payload.msg,
      };
    },

    resetRoom: () => initialState,
  },
});

export const { setRoomState, updateTimer, resetRoom, updateMsg } =
  roomSlice.actions;
export default roomSlice.reducer;

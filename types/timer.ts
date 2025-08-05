export type Timer = {
  id: string;
  name: string;
  duration: number;
  isRunning: boolean;
  remaining?: number;
  markers: number[];
};

export type RoomState = {
  roomId: string;
  adminId: string;
  adminOnline: boolean;
  clientCount: number;
  timers: Timer[];
  currentTimerId: string | null;
};

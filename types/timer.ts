export type Timer = {
  id: string;
  name: string;
  duration: number;
  isRunning: boolean;
  remaining?: number;
};

type message = {
  color: string;
  backgroundColor: string;
  text: string;
};

export type RoomState = {
  roomId: string;
  adminId: string;
  adminOnline: boolean;
  clientCount: number;
  timers: Timer[];
  currentTimerId: string | null;
  message: message;
  flickering: boolean | null;
};

export type Timer = {
  id: string;
  name: string;
  duration: number;
  isRunning: boolean;
  remaining?: number;
};

export type DisplayNames = {
  text: string;
  styles: {
    color: string;
    bold: boolean;
  };
};

export type RoomState = {
  roomId: string;
  adminId: string;
  roomName: string;
  adminOnline: boolean;
  clientCount: number;
  timers: Timer[];
  displayName: DisplayNames;
  names: DisplayNames[];
  flickering: boolean | null;
};

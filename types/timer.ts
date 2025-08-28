export type Timer = {
  id: string;
  name: string;
  duration: number;
  isRunning: boolean;
  remaining?: number;
};

export type DisplayMessage = {
  id: string;
  text: string;
  styles: {
    color: string;
    bold: boolean;
  };
  isLive: boolean;
};

export type connectedClients = {
  socketId: string;
  name: string;
};

export type RoomState = {
  roomId: string;
  adminId: string;
  roomName: string;
  adminOnline: boolean;
  clientCount: number;
  connectedClients: connectedClients[];
  timers: Timer[];
  names: DisplayMessage[];
  flickering: boolean | null;
};

export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const remainingAfterHours = seconds % 3600;
  const mins = Math.floor(remainingAfterHours / 60);
  const secs = Math.floor(remainingAfterHours % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return hrs > 0
    ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
};

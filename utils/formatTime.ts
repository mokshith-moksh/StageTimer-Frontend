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

// Simple complementary color set generator
export const getComplementaryColors = (color: string): string[] => {
  const presets: Record<string, string[]> = {
    "#000000": ["#ffffff", "#f0f0f0", "#cccccc", "#fffae6"],
    "#ff0000": ["#ffffff", "#ffe6e6", "#ffcccc", "#fff0f0"],
    "#0000ff": ["#ffffff", "#e6f0ff", "#cce0ff", "#f0f8ff"],
    "#008000": ["#ffffff", "#e6ffe6", "#ccffcc", "#f0fff0"],
  };
  return presets[color] || ["#ffffff", "#f0f0f0", "#cccccc", "#fffae6"];
};

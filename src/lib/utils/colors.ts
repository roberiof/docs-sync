const COLORS = [
  "#10b981",
  "#fb9084",
  "#9299f9",
  "#fbbf24",
  "#f87171",
  "#60a5fa",
  "#34d399",
  "#f472b6",
  "#a78bfa",
  "#fca5a5",
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

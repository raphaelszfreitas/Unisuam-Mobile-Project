import AsyncStorage from "@react-native-async-storage/async-storage";

export type GameMode = "easy" | "medium" | "hard" | "multiplayer";
export type Result = "win" | "loss" | "draw";

export type ModeStats = {
  wins: number;
  losses: number;
  draws: number;
  games: number;
};

export type Stats = {
  easy: ModeStats;
  medium: ModeStats;
  hard: ModeStats;
  multiplayer: ModeStats;
  updatedAt?: number;
};

const STORAGE_KEY = "game_stats_v1";

const emptyMode = (): ModeStats => ({ wins: 0, losses: 0, draws: 0, games: 0 });

const defaultStats = (): Stats => ({
  easy: emptyMode(),
  medium: emptyMode(),
  hard: emptyMode(),
  multiplayer: emptyMode(),
  updatedAt: Date.now(),
});

async function getRaw(): Promise<Stats> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw) as Stats;
    // ensure shape
    return {
      easy: { ...emptyMode(), ...(parsed.easy || {}) },
      medium: { ...emptyMode(), ...(parsed.medium || {}) },
      hard: { ...emptyMode(), ...(parsed.hard || {}) },
      multiplayer: { ...emptyMode(), ...(parsed.multiplayer || {}) },
      updatedAt: parsed.updatedAt || Date.now(),
    };
  } catch (e) {
    console.warn("Failed to read stats:", e);
    return defaultStats();
  }
}

async function save(stats: Stats): Promise<void> {
  try {
    stats.updatedAt = Date.now();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn("Failed to save stats:", e);
  }
}

export async function getStats(): Promise<Stats> {
  return getRaw();
}

export async function resetStats(): Promise<void> {
  await save(defaultStats());
}

export async function recordResult(
  mode: GameMode,
  result: Result,
): Promise<Stats> {
  const stats = await getRaw();
  const bucket = stats[mode];
  bucket.games = (bucket.games || 0) + 1;
  if (result === "win") bucket.wins = (bucket.wins || 0) + 1;
  if (result === "loss") bucket.losses = (bucket.losses || 0) + 1;
  if (result === "draw") bucket.draws = (bucket.draws || 0) + 1;
  await save(stats);
  return stats;
}

/**
 * Record a match result. For single-player modes (easy/medium/hard) pass humanIs to indicate which color is the human
 * (e.g. 'red' in PlayerVsBot). For multiplayer, omit humanIs to record both a win and a loss (one match -> +1 games, +1 win, +1 loss).
 */
export async function recordMatch(
  mode: GameMode,
  outcome: "white" | "red" | "draw",
  opts?: { humanIs?: "white" | "red" },
): Promise<Stats> {
  const stats = await getRaw();
  const bucket = stats[mode];
  // Always count one game per match
  bucket.games = (bucket.games || 0) + 1;
  if (outcome === "draw") {
    bucket.draws = (bucket.draws || 0) + 1;
    await save(stats);
    return stats;
  }

  if (opts && opts.humanIs) {
    // Human perspective: increment win or loss according to human color
    if (outcome === opts.humanIs) {
      bucket.wins = (bucket.wins || 0) + 1;
    } else {
      bucket.losses = (bucket.losses || 0) + 1;
    }
  } else {
    // No human perspective: count both a win and a loss (match between two humans)
    bucket.wins = (bucket.wins || 0) + 1;
    bucket.losses = (bucket.losses || 0) + 1;
  }

  await save(stats);
  return stats;
}

export async function mergeStats(
  remote: Partial<Stats> | null,
): Promise<Stats> {
  // Merge local with remote by summing counts. Remote can be null.
  const local = await getRaw();
  if (!remote) return local;
  const merged: Stats = {
    easy: { ...emptyMode() },
    medium: { ...emptyMode() },
    hard: { ...emptyMode() },
    multiplayer: { ...emptyMode() },
    updatedAt: Date.now(),
  };

  (["easy", "medium", "hard", "multiplayer"] as GameMode[]).forEach((m) => {
    const r = (remote as any)[m] || {};
    const l = (local as any)[m] || emptyMode();
    merged[m] = {
      wins: (l.wins || 0) + (r.wins || 0),
      losses: (l.losses || 0) + (r.losses || 0),
      draws: (l.draws || 0) + (r.draws || 0),
      games: (l.games || 0) + (r.games || 0),
    };
  });

  await save(merged);
  return merged;
}

// Optional: a small stub to sync with remote API if configured.
export type RemoteConfig = { url: string; apiKey?: string };

export async function syncToRemote(
  config: RemoteConfig,
  stats?: Stats,
): Promise<boolean> {
  try {
    const payload = stats || (await getRaw());
    // This is a simple POST; backend contract should accept this shape.
    await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({ stats: payload }),
    });
    return true;
  } catch (e) {
    console.warn("Failed to sync stats to remote:", e);
    return false;
  }
}

export default {
  getStats,
  resetStats,
  recordResult,
  recordMatch,
  mergeStats,
  syncToRemote,
};

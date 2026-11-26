import { ComponentId } from './componentsData';

export type GameModeId = 'match_board' | 'quiz_3d';
export type DifficultyLevel = 'pemula' | 'menengah' | 'mahir';

export interface ScoreRecord {
  id: string;
  playerName: string;
  mode: GameModeId;
  difficulty: DifficultyLevel;
  score: number;
  accuracy: number;
  maxStreak: number;
  durationSec: number;
  grade: 'S' | 'A' | 'B' | 'C';
  createdAt: string;
}

const SCORES_KEY = 'elektrolab3d_scores_v1';
const MASTERY_KEY = 'elektrolab3d_mastery_v1';

export function computeGrade(accuracy: number, score: number): 'S' | 'A' | 'B' | 'C' {
  if (accuracy >= 92 && score >= 600) return 'S';
  if (accuracy >= 80) return 'A';
  if (accuracy >= 60) return 'B';
  return 'C';
}

export function loadScoreRecords(): ScoreRecord[] {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScoreRecord(record: Omit<ScoreRecord, 'id' | 'createdAt'>): ScoreRecord[] {
  const current = loadScoreRecords();
  const nextItem: ScoreRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const merged = [nextItem, ...current]
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(merged));
  } catch {
    // ignore quota errors
  }
  return merged;
}

export function clearScoreRecords(): ScoreRecord[] {
  try {
    localStorage.removeItem(SCORES_KEY);
  } catch {
    // ignore
  }
  return [];
}

export function loadMasteredComponents(): Record<ComponentId, number> {
  try {
    const raw = localStorage.getItem(MASTERY_KEY);
    if (!raw) return {} as Record<ComponentId, number>;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : ({} as Record<ComponentId, number>);
  } catch {
    return {} as Record<ComponentId, number>;
  }
}

export function recordMasteredComponent(id: ComponentId): Record<ComponentId, number> {
  const current = loadMasteredComponents();
  const updated = {
    ...current,
    [id]: (current[id] || 0) + 1,
  };
  try {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

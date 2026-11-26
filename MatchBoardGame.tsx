import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  Eye,
  Flame,
  RotateCcw,
  Save,
  Timer,
  XCircle,
} from 'lucide-react';
import { COMPONENT_MAP, ComponentId, ELECTRONIC_COMPONENTS } from './componentsData';
import { soundEngine } from './soundEngine';
import { FeedbackPulse, Viewport3D } from './Viewport3D';
import { SchematicSymbol } from './SchematicSymbol';
import { computeGrade, DifficultyLevel } from './scoreStorage';

interface MatchBoardGameProps {
  onComponentMastered: (id: ComponentId) => void;
  onSaveScore: (payload: {
    playerName: string;
    mode: 'match_board';
    difficulty: DifficultyLevel;
    score: number;
    accuracy: number;
    maxStreak: number;
    durationSec: number;
    grade: 'S' | 'A' | 'B' | 'C';
  }) => void;
  onGoLeaderboard: () => void;
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const PAIR_COUNT_BY_DIFFICULTY: Record<DifficultyLevel, number> = {
  pemula: 4,
  menengah: 6,
  mahir: 8,
};

export const MatchBoardGame: React.FC<MatchBoardGameProps> = ({
  onComponentMastered,
  onSaveScore,
  onGoLeaderboard,
}) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('pemula');
  const [leftOrder, setLeftOrder] = useState<ComponentId[]>([]);
  const [rightOrder, setRightOrder] = useState<ComponentId[]>([]);
  const [inspectedId, setInspectedId] = useState<ComponentId>('resistor');

  const [selectedLeft, setSelectedLeft] = useState<ComponentId | null>(null);
  const [selectedRight, setSelectedRight] = useState<ComponentId | null>(null);
  const [matchedIds, setMatchedIds] = useState<ComponentId[]>([]);
  const [wrongPair, setWrongPair] = useState<{ left: ComponentId; right: ComponentId } | null>(null);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [feedbackPulse, setFeedbackPulse] = useState<FeedbackPulse>(null);
  const [lastBanner, setLastBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const [playerName, setPlayerName] = useState('Siswa Elektronika');
  const [scoreSaved, setScoreSaved] = useState(false);

  const isCompleted = leftOrder.length > 0 && matchedIds.length === leftOrder.length;

  const startRound = useCallback((diff: DifficultyLevel) => {
    const count = PAIR_COUNT_BY_DIFFICULTY[diff];
    const pool = shuffleArray(ELECTRONIC_COMPONENTS)
      .slice(0, count)
      .map((c) => c.id);

    setDifficulty(diff);
    setLeftOrder(pool);
    setRightOrder(shuffleArray(pool));
    setInspectedId(pool[0]);
    setSelectedLeft(pool[0]);
    setSelectedRight(null);
    setMatchedIds([]);
    setWrongPair(null);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setAttempts(0);
    setCorrectCount(0);
    setElapsedSec(0);
    setFeedbackPulse(null);
    setLastBanner(null);
    setScoreSaved(false);
  }, []);

  useEffect(() => {
    startRound('pemula');
  }, [startRound]);

  // Game timer
  useEffect(() => {
    if (isCompleted || leftOrder.length === 0) return;
    const timer = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCompleted, leftOrder.length]);

  const evaluatePair = useCallback(
    (left: ComponentId, right: ComponentId) => {
      setAttempts((a) => a + 1);
      if (left === right) {
        const nextStreak = streak + 1;
        const multiplier = Math.min(nextStreak, 5);
        const gained = 100 * multiplier;
        const info = COMPONENT_MAP[left];

        soundEngine.playSuccess(nextStreak);
        onComponentMastered(left);

        const nextMatched = [...matchedIds, left];
        setMatchedIds(nextMatched);
        setScore((s) => s + gained);
        setStreak(nextStreak);
        setMaxStreak((m) => Math.max(m, nextStreak));
        setCorrectCount((c) => c + 1);
        setSelectedLeft(null);
        setSelectedRight(null);
        setFeedbackPulse((prev) => ({ type: 'success', seq: (prev?.seq ?? 0) + 1 }));
        setLastBanner({
          type: 'success',
          text: `Cocok! ${info.name} (+${gained} poin · Kombo ×${multiplier})`,
        });

        // Auto-select next unmatched sample for 3D preview
        const remaining = leftOrder.find((id) => !nextMatched.includes(id));
        if (remaining) {
          setInspectedId(remaining);
        }

        if (nextMatched.length === leftOrder.length) {
          const timeBonus = Math.max(0, 180 - elapsedSec) * 2;
          setScore((s) => s + timeBonus);
          soundEngine.playLevelComplete();
        }
      } else {
        soundEngine.playError();
        setStreak(0);
        setScore((s) => Math.max(0, s - 15));
        setWrongPair({ left, right });
        setFeedbackPulse((prev) => ({ type: 'error', seq: (prev?.seq ?? 0) + 1 }));
        setLastBanner({
          type: 'error',
          text: 'Belum cocok! Putar model 3D untuk mengamati bentuk fisik dan kakinya (-15 poin).',
        });

        window.setTimeout(() => {
          setWrongPair(null);
          setSelectedLeft(null);
          setSelectedRight(null);
        }, 550);
      }
    },
    [elapsedSec, leftOrder, matchedIds, onComponentMastered, streak],
  );

  const handleSelectLeft = (id: ComponentId) => {
    if (matchedIds.includes(id) || wrongPair) return;
    soundEngine.playClick();
    setInspectedId(id);
    setSelectedLeft(id);
    if (selectedRight) {
      evaluatePair(id, selectedRight);
    }
  };

  const handleSelectRight = (id: ComponentId) => {
    if (matchedIds.includes(id) || wrongPair) return;
    soundEngine.playClick();
    setSelectedRight(id);
    if (selectedLeft) {
      evaluatePair(selectedLeft, id);
    }
  };

  const accuracy = useMemo(() => {
    if (attempts === 0) return 100;
    return Math.round((correctCount / attempts) * 100);
  }, [attempts, correctCount]);

  const grade = computeGrade(accuracy, score);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const inspectedMatched = matchedIds.includes(inspectedId);

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6">
      {/* Top Game Control & Score Strip */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Tingkat:</span>
          {(['pemula', 'menengah', 'mahir'] as DifficultyLevel[]).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                startRound(lvl);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                difficulty === lvl
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lvl} ({PAIR_COUNT_BY_DIFFICULTY[lvl]})
            </button>
          ))}
        </div>

        {/* Tabular Score & Telemetry */}
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-slate-400">Skor</span>
            <span className="font-mono-tech font-bold text-slate-100">{score}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-slate-400">Kombo</span>
            <span className="font-mono-tech font-bold text-orange-300">
              ×{Math.min(streak + 1, 5)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-sky-400" />
            <span className="font-mono-tech font-semibold text-slate-200">
              {formatTime(elapsedSec)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              startRound(difficulty);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Ulangi</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {lastBanner && !isCompleted && (
        <motion.div
          key={lastBanner.text + attempts}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium ${
            lastBanner.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          }`}
        >
          {lastBanner.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{lastBanner.text}</span>
        </motion.div>
      )}

      {/* Main Split Arena */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Live 3D Specimen Turntable (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="h-[420px] sm:h-[500px] lg:h-[560px] w-full">
            <Viewport3D
              componentId={inspectedId}
              hideLabel={!inspectedMatched}
              customBadge={
                inspectedMatched
                  ? undefined
                  : `Sampel 3D #${leftOrder.indexOf(inspectedId) + 1}`
              }
              feedbackPulse={feedbackPulse}
            />
          </div>
        </div>

        {/* Right: Matching Board OR Completion Summary (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          {isCompleted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-1 flex-col justify-between rounded-xl border border-emerald-500/30 bg-slate-900/90 p-6"
            >
              <div>
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <p className="text-xs font-semibold text-emerald-400">
                      Permainan Cocokkan Selesai
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-100">
                      Semua {leftOrder.length} Pasangan Komponen Berhasil Dicocokkan
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Tingkat {difficulty} · Akurasi {accuracy}% · Waktu {formatTime(elapsedSec)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-center">
                    <p className="text-xs text-amber-300">Peringkat</p>
                    <p className="font-mono-tech text-3xl font-bold text-amber-400">{grade}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-xs text-slate-400">Total Skor</p>
                    <p className="font-mono-tech mt-1 text-2xl font-bold text-slate-100">{score}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-xs text-slate-400">Akurasi</p>
                    <p className="font-mono-tech mt-1 text-2xl font-bold text-emerald-400">
                      {accuracy}%
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-xs text-slate-400">Kombo Tertinggi</p>
                    <p className="font-mono-tech mt-1 text-2xl font-bold text-orange-400">
                      {maxStreak}×
                    </p>
                  </div>
                </div>

                {/* Save to Leaderboard Form */}
                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <label className="block text-xs font-semibold text-slate-300">
                    Simpan Skor ke Papan Peringkat
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="text"
                      maxLength={24}
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      disabled={scoreSaved}
                      placeholder="Masukkan nama Anda"
                      className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={scoreSaved}
                      onClick={() => {
                        soundEngine.playSuccess(2);
                        onSaveScore({
                          playerName: playerName.trim() || 'Anonim',
                          mode: 'match_board',
                          difficulty,
                          score,
                          accuracy,
                          maxStreak,
                          durationSec: elapsedSec,
                          grade,
                        });
                        setScoreSaved(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 whitespace-nowrap shrink-0"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{scoreSaved ? 'Tersimpan' : 'Simpan Skor'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onGoLeaderboard();
                  }}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Lihat Papan Skor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    startRound(difficulty);
                  }}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
                >
                  Main Lagi
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Column 1: 3D Specimen Cards */}
              <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-semibold text-slate-200">
                    1. Pilih Objek Sampel 3D
                  </h3>
                  <span className="font-mono-tech text-xs text-slate-400">
                    {matchedIds.length}/{leftOrder.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {leftOrder.map((id, idx) => {
                    const info = COMPONENT_MAP[id];
                    const isMatched = matchedIds.includes(id);
                    const isSelected = selectedLeft === id;
                    const isInspected = inspectedId === id;
                    const isWrong = wrongPair?.left === id;

                    return (
                      <motion.button
                        key={id}
                        type="button"
                        onClick={() => handleSelectLeft(id)}
                        disabled={isMatched}
                        animate={isWrong ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                          isMatched
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 opacity-85'
                            : isWrong
                              ? 'border-rose-500 bg-rose-500/15 text-rose-200'
                              : isSelected
                                ? 'border-sky-500 bg-sky-500/15 text-white'
                                : 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-tech text-xs font-bold text-sky-400">
                              #{idx + 1}
                            </span>
                            <span className="truncate text-sm font-semibold">
                              {isMatched ? info.name : `Sampel Komponen 3D`}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {isMatched
                              ? `${info.category} · ${info.symbolCode}`
                              : `${info.category} · Klik untuk putar di layar 3D`}
                          </p>
                        </div>

                        {isMatched ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <Eye
                            className={`h-4 w-4 shrink-0 ${
                              isInspected ? 'text-sky-400' : 'text-slate-500'
                            }`}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Schematic Symbol + Function Cards */}
              <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="text-xs font-semibold text-slate-200">
                    2. Cocokkan Simbol & Fungsi
                  </h3>
                  <span className="text-xs text-slate-400">Pasangan</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {rightOrder.map((id) => {
                    const info = COMPONENT_MAP[id];
                    const isMatched = matchedIds.includes(id);
                    const isSelected = selectedRight === id;
                    const isWrong = wrongPair?.right === id;

                    return (
                      <motion.button
                        key={id}
                        type="button"
                        onClick={() => handleSelectRight(id)}
                        disabled={isMatched}
                        animate={isWrong ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                          isMatched
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200 opacity-85'
                            : isWrong
                              ? 'border-rose-500 bg-rose-500/15 text-rose-200'
                              : isSelected
                                ? 'border-sky-500 bg-sky-500/15 text-white'
                                : 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="shrink-0 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-sky-400">
                          <SchematicSymbol id={id} className="h-8 w-14" />
                        </div>

                        <div className="min-w-0 flex-1">
                          {difficulty === 'pemula' || isMatched ? (
                            <p className="truncate text-xs font-semibold text-slate-100">
                              {info.name}
                            </p>
                          ) : (
                            <p className="font-mono-tech text-xs font-semibold text-sky-400">
                              Simbol {info.symbolCode} · {info.unit}
                            </p>
                          )}
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                            {info.shortFunction}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

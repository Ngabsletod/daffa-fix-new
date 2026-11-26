import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Flame,
  Lightbulb,
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

interface Quiz3DGameProps {
  onComponentMastered: (id: ComponentId) => void;
  onSaveScore: (payload: {
    playerName: string;
    mode: 'quiz_3d';
    difficulty: DifficultyLevel;
    score: number;
    accuracy: number;
    maxStreak: number;
    durationSec: number;
    grade: 'S' | 'A' | 'B' | 'C';
  }) => void;
  onGoLeaderboard: () => void;
}

interface QuizQuestion {
  targetId: ComponentId;
  promptType: 'identify_symbol' | 'identify_function';
  options: ComponentId[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const TOTAL_ROUNDS = 8;

function generateQuestions(): QuizQuestion[] {
  const targets = shuffle(ELECTRONIC_COMPONENTS)
    .slice(0, TOTAL_ROUNDS)
    .map((c) => c.id);

  return targets.map((targetId, idx) => {
    const distractors = shuffle(
      ELECTRONIC_COMPONENTS.filter((c) => c.id !== targetId).map((c) => c.id),
    ).slice(0, 3);
    return {
      targetId,
      promptType: idx % 2 === 0 ? 'identify_symbol' : 'identify_function',
      options: shuffle([targetId, ...distractors]),
    };
  });
}

export const Quiz3DGame: React.FC<Quiz3DGameProps> = ({
  onComponentMastered,
  onSaveScore,
  onGoLeaderboard,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<ComponentId | null>(null);
  const [hintUsed, setHintUsed] = useState(false);

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [totalSec, setTotalSec] = useState(0);
  const [feedbackPulse, setFeedbackPulse] = useState<FeedbackPulse>(null);

  const [playerName, setPlayerName] = useState('Siswa Elektronika');
  const [scoreSaved, setScoreSaved] = useState(false);

  const startQuiz = useCallback(() => {
    setQuestions(generateQuestions());
    setRoundIdx(0);
    setSelectedAnswer(null);
    setHintUsed(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrectCount(0);
    setRoundStartTime(Date.now());
    setTotalSec(0);
    setFeedbackPulse(null);
    setScoreSaved(false);
  }, []);

  useEffect(() => {
    startQuiz();
  }, [startQuiz]);

  const isFinished = questions.length > 0 && roundIdx >= questions.length;

  useEffect(() => {
    if (isFinished || questions.length === 0) return;
    const timer = window.setInterval(() => {
      setTotalSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isFinished, questions.length]);

  const currentQ = questions[roundIdx];
  const targetInfo = currentQ ? COMPONENT_MAP[currentQ.targetId] : null;
  const answered = selectedAnswer !== null;

  const handleChooseOption = (chosenId: ComponentId) => {
    if (!currentQ || answered) return;
    setSelectedAnswer(chosenId);

    const isCorrect = chosenId === currentQ.targetId;
    if (isCorrect) {
      const nextStreak = streak + 1;
      const multiplier = Math.min(nextStreak, 5);
      const secTaken = (Date.now() - roundStartTime) / 1000;
      const speedBonus = Math.max(0, Math.round((15 - secTaken) * 4));
      const gained = 100 * multiplier + speedBonus;

      soundEngine.playSuccess(nextStreak);
      onComponentMastered(currentQ.targetId);

      setScore((s) => s + gained);
      setStreak(nextStreak);
      setMaxStreak((m) => Math.max(m, nextStreak));
      setCorrectCount((c) => c + 1);
      setFeedbackPulse((prev) => ({ type: 'success', seq: (prev?.seq ?? 0) + 1 }));
    } else {
      soundEngine.playError();
      setStreak(0);
      setFeedbackPulse((prev) => ({ type: 'error', seq: (prev?.seq ?? 0) + 1 }));
    }
  };

  const handleNextRound = () => {
    soundEngine.playClick();
    const nextIdx = roundIdx + 1;
    setRoundIdx(nextIdx);
    setSelectedAnswer(null);
    setHintUsed(false);
    setRoundStartTime(Date.now());
    if (nextIdx >= questions.length) {
      soundEngine.playLevelComplete();
    }
  };

  const accuracy =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const grade = computeGrade(accuracy, score);

  if (!currentQ && !isFinished) return null;

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6">
      {/* Telemetry & Progress Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-200">
            Tantangan Inspeksi 3D
          </span>
          <span className="font-mono-tech text-xs text-sky-400">
            Ronde {Math.min(roundIdx + 1, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
          </span>
          <div className="hidden sm:flex items-center gap-1">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-5 rounded-full transition-colors ${
                  i < roundIdx
                    ? 'bg-emerald-500'
                    : i === roundIdx
                      ? 'bg-sky-400'
                      : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

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
            <span className="font-mono-tech font-semibold text-slate-200">{totalSec}d</span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              startQuiz();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Mulai Ulang</span>
          </button>
        </div>
      </div>

      {isFinished ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl rounded-xl border border-slate-800 bg-slate-900/90 p-6"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold text-emerald-400">Tantangan Selesai</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-100">
                Hasil Identifikasi Komponen 3D
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {correctCount} dari {TOTAL_ROUNDS} komponen berhasil diidentifikasi dengan tepat
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-center">
              <p className="text-xs text-amber-300">Peringkat</p>
              <p className="font-mono-tech text-3xl font-bold text-amber-400">{grade}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Skor Akhir</p>
              <p className="font-mono-tech mt-1 text-2xl font-bold text-slate-100">{score}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Akurasi</p>
              <p className="font-mono-tech mt-1 text-2xl font-bold text-emerald-400">
                {accuracy}%
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs text-slate-400">Kombo Terbaik</p>
              <p className="font-mono-tech mt-1 text-2xl font-bold text-orange-400">
                {maxStreak}×
              </p>
            </div>
          </div>

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
                className="min-w-[200px] flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none disabled:opacity-60"
              />
              <button
                type="button"
                disabled={scoreSaved}
                onClick={() => {
                  soundEngine.playSuccess(2);
                  onSaveScore({
                    playerName: playerName.trim() || 'Anonim',
                    mode: 'quiz_3d',
                    difficulty: 'menengah',
                    score,
                    accuracy,
                    maxStreak,
                    durationSec: totalSec,
                    grade,
                  });
                  setScoreSaved(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 whitespace-nowrap shrink-0"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{scoreSaved ? 'Tersimpan' : 'Simpan Skor'}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
                startQuiz();
              }}
              className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
            >
              Tantangan Baru
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          {/* Left: Mystery 3D Object Viewport (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="h-[440px] sm:h-[520px] lg:h-[580px] w-full">
              <Viewport3D
                componentId={currentQ.targetId}
                hideLabel={!answered}
                customBadge={answered ? undefined : `Komponen Misteri #${roundIdx + 1}`}
                feedbackPulse={feedbackPulse}
              />
            </div>
          </div>

          {/* Right: Question & 4 Matching Cards (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/85 p-5">
            <div>
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <p className="text-xs font-medium text-sky-400">
                    {currentQ.promptType === 'identify_symbol'
                      ? 'Cocokkan Objek 3D dengan Nama & Simbol Skematik'
                      : 'Cocokkan Objek 3D dengan Fungsi Utamanya'}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-slate-100">
                    {currentQ.promptType === 'identify_symbol'
                      ? 'Manakah pasangan nama dan simbol yang sesuai?'
                      : 'Apa fungsi utama komponen 3D di samping?'}
                  </h2>
                </div>

                {!answered && (
                  <button
                    type="button"
                    disabled={hintUsed}
                    onClick={() => {
                      soundEngine.playHint();
                      setHintUsed(true);
                      setScore((s) => Math.max(0, s - 25));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>{hintUsed ? 'Petunjuk Aktif' : 'Petunjuk (-25)'}</span>
                  </button>
                )}
              </div>

              {/* Optional Clue Box */}
              {hintUsed && targetInfo && !answered && (
                <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <span className="font-semibold">Petunjuk:</span> Kategori{' '}
                  <span className="font-semibold">{targetInfo.category}</span> · Satuan{' '}
                  <span className="font-mono-tech">{targetInfo.unit}</span> · {targetInfo.polarityInfo}
                </div>
              )}

              {/* 4 Answer Cards */}
              <div className="mt-4 grid grid-cols-1 gap-3">
                {currentQ.options.map((optId) => {
                  const optInfo = COMPONENT_MAP[optId];
                  const isTarget = optId === currentQ.targetId;
                  const isChosen = optId === selectedAnswer;

                  let styleClass =
                    'border-slate-800 bg-slate-950/75 text-slate-200 hover:border-slate-700 hover:bg-slate-900';
                  if (answered) {
                    if (isTarget) {
                      styleClass = 'border-emerald-500 bg-emerald-500/15 text-emerald-100';
                    } else if (isChosen && !isTarget) {
                      styleClass = 'border-rose-500 bg-rose-500/15 text-rose-100';
                    } else {
                      styleClass = 'border-slate-800/60 bg-slate-950/40 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={optId}
                      type="button"
                      disabled={answered}
                      onClick={() => handleChooseOption(optId)}
                      className={`flex items-center justify-between gap-4 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${styleClass}`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-sky-400">
                          <SchematicSymbol id={optId} className="h-9 w-16" />
                        </div>

                        <div className="min-w-0">
                          {currentQ.promptType === 'identify_symbol' || answered ? (
                            <>
                              <p className="text-sm font-bold">{optInfo.name}</p>
                              <p className="font-mono-tech mt-0.5 text-xs text-slate-400">
                                Kode {optInfo.symbolCode} · {optInfo.unit}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium leading-snug">
                                {optInfo.shortFunction}
                              </p>
                              <p className="font-mono-tech mt-1 text-xs text-slate-400">
                                {optInfo.category} · Satuan {optInfo.unit}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {answered && isTarget && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                      )}
                      {answered && isChosen && !isTarget && (
                        <XCircle className="h-5 w-5 shrink-0 text-rose-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Post-Answer Educational Insight + Next Button */}
            {answered && targetInfo && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-xl border border-slate-800 bg-slate-950/85 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p
                      className={`text-xs font-bold ${
                        selectedAnswer === currentQ.targetId
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {selectedAnswer === currentQ.targetId
                        ? 'Jawaban Tepat!'
                        : `Kurang tepat — Komponen ini adalah ${targetInfo.name}`}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {targetInfo.detailedExplanation}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextRound}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400 whitespace-nowrap shrink-0"
                  >
                    <span>
                      {roundIdx + 1 >= TOTAL_ROUNDS ? 'Lihat Hasil' : 'Ronde Berikutnya'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

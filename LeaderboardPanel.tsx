import React from 'react';
import { Award, CheckCircle2, Trash2, Trophy } from 'lucide-react';
import { ComponentId, ELECTRONIC_COMPONENTS } from './componentsData';
import { ScoreRecord } from './scoreStorage';
import { soundEngine } from './soundEngine';
import { SchematicSymbol } from './SchematicSymbol';

interface LeaderboardPanelProps {
  records: ScoreRecord[];
  masteredCounts: Record<ComponentId, number>;
  onClearScores: () => void;
  onPlayMatch: () => void;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  records,
  masteredCounts,
  onClearScores,
  onPlayMatch,
}) => {
  const totalMastered = ELECTRONIC_COMPONENTS.filter(
    (c) => (masteredCounts[c.id] || 0) > 0,
  ).length;

  const bestScore = records.length > 0 ? Math.max(...records.map((r) => r.score)) : 0;

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 space-y-6">
      {/* Top KPI Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-5">
          <p className="text-xs font-medium text-slate-400">Skor Tertinggi</p>
          <p className="font-mono-tech mt-1 text-3xl font-bold text-amber-400">{bestScore}</p>
          <p className="mt-1 text-xs text-slate-500">Rekor terbaik tersimpan lokal</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-5">
          <p className="text-xs font-medium text-slate-400">Komponen Dikuasai</p>
          <p className="font-mono-tech mt-1 text-3xl font-bold text-emerald-400">
            {totalMastered} / {ELECTRONIC_COMPONENTS.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Berdasarkan jawaban benar di mode permainan
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/85 p-5">
          <p className="text-xs font-medium text-slate-400">Total Sesi Tersimpan</p>
          <p className="font-mono-tech mt-1 text-3xl font-bold text-sky-400">{records.length}</p>
          <p className="mt-1 text-xs text-slate-500">Riwayat Cocokkan & Kuis 3D</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: High Score Table (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/85 p-5">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <h2 className="text-base font-bold text-slate-100">Papan Peringkat Skor</h2>
            </div>

            {records.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onClearScores();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-rose-300 whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus Riwayat</span>
              </button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-300">
                Belum ada skor yang tersimpan
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Selesaikan satu ronde Cocokkan Komponen atau Kuis 3D untuk mencatat peringkat Anda.
              </p>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onPlayMatch();
                }}
                className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-400"
              >
                Mulai Bermain
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 pr-3 font-semibold">#</th>
                    <th className="py-2.5 pr-3 font-semibold">Pemain</th>
                    <th className="py-2.5 pr-3 font-semibold">Mode</th>
                    <th className="py-2.5 pr-3 font-semibold text-right">Akurasi</th>
                    <th className="py-2.5 pr-3 font-semibold text-right">Kombo</th>
                    <th className="py-2.5 pr-3 font-semibold text-center">Grade</th>
                    <th className="py-2.5 font-semibold text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {records.map((rec, index) => (
                    <tr key={rec.id} className="text-slate-200">
                      <td className="font-mono-tech py-3 pr-3 text-slate-400">{index + 1}</td>
                      <td className="py-3 pr-3 font-semibold">{rec.playerName}</td>
                      <td className="py-3 pr-3 text-slate-400">
                        {rec.mode === 'match_board'
                          ? `Cocokkan (${rec.difficulty})`
                          : 'Kuis Inspeksi 3D'}
                      </td>
                      <td className="font-mono-tech py-3 pr-3 text-right text-emerald-400">
                        {rec.accuracy}%
                      </td>
                      <td className="font-mono-tech py-3 pr-3 text-right text-orange-300">
                        {rec.maxStreak}×
                      </td>
                      <td className="font-mono-tech py-3 pr-3 text-center font-bold text-amber-400">
                        {rec.grade}
                      </td>
                      <td className="font-mono-tech py-3 text-right font-bold text-slate-100">
                        {rec.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: 10-Component Mastery Grid (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/85 p-5">
          <div className="mb-4 border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-100">Penguasaan 10 Komponen</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Komponen ditandai terkuasai setelah berhasil dicocokkan dengan benar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {ELECTRONIC_COMPONENTS.map((comp) => {
              const count = masteredCounts[comp.id] || 0;
              const unlocked = count > 0;

              return (
                <div
                  key={comp.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                    unlocked
                      ? 'border-emerald-500/35 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`shrink-0 rounded border px-1.5 py-1 ${
                        unlocked
                          ? 'border-emerald-500/30 bg-slate-900 text-emerald-400'
                          : 'border-slate-800 bg-slate-900 text-slate-500'
                      }`}
                    >
                      <SchematicSymbol id={comp.id} className="h-6 w-10" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-200">{comp.name}</p>
                      <p className="font-mono-tech text-[11px] text-slate-400">
                        {unlocked ? `${count}× benar` : 'Belum dicocokkan'}
                      </p>
                    </div>
                  </div>
                  {unlocked && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

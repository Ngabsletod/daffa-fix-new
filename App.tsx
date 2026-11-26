import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ComponentId } from './componentsData';
import { soundEngine } from './soundEngine';
import { ExplorerLab } from './ExplorerLab';
import { MatchBoardGame } from './MatchBoardGame';
import { Quiz3DGame } from './Quiz3DGame';
import { LeaderboardPanel } from './LeaderboardPanel';
import {
  clearScoreRecords,
  loadMasteredComponents,
  loadScoreRecords,
  recordMasteredComponent,
  saveScoreRecord,
  ScoreRecord,
} from './scoreStorage';

type AppTab = 'match' | 'quiz' | 'explorer' | 'leaderboard';

const NAV_ITEMS: Array<{ id: AppTab; label: string }> = [
  { id: 'match', label: 'Cocokkan' },
  { id: 'quiz', label: 'Kuis 3D' },
  { id: 'explorer', label: 'Lab 3D' },
  { id: 'leaderboard', label: 'Papan Skor' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('match');
  const [muted, setMuted] = useState(false);
  const [records, setRecords] = useState<ScoreRecord[]>(() => loadScoreRecords());
  const [masteredCounts, setMasteredCounts] = useState<Record<ComponentId, number>>(() =>
    loadMasteredComponents(),
  );

  const handleToggleSound = () => {
    const nextMuted = !muted;
    soundEngine.setMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playClick();
    }
  };

  const handleSelectTab = (tab: AppTab) => {
    soundEngine.playClick();
    setActiveTab(tab);
  };

  const handleMastered = (id: ComponentId) => {
    setMasteredCounts(recordMasteredComponent(id));
  };

  const handleSaveScore = (
    payload: Omit<ScoreRecord, 'id' | 'createdAt'>,
  ) => {
    setRecords(saveScoreRecord(payload));
  };

  const handleClearScores = () => {
    setRecords(clearScoreRecords());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B1120] text-slate-100">
      {/* Three-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0B1120]/95">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleSelectTab('match')}
            className="text-left text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            ElektroLab 3D
          </button>

          {/* Zone 2: Clean Single-Line Text Navigation Links */}
          <nav className="flex items-center gap-5 overflow-x-auto sm:gap-7" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                    isActive
                      ? 'border-sky-400 text-sky-400 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action (Audio Toggle) */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={muted ? 'Aktifkan efek suara' : 'Bisukan efek suara'}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                muted
                  ? 'border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-sky-400" />}
              <span className="hidden sm:inline">{muted ? 'Suara Bisu' : 'Efek Suara'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1">
        {activeTab === 'match' && (
          <MatchBoardGame
            onComponentMastered={handleMastered}
            onSaveScore={handleSaveScore}
            onGoLeaderboard={() => setActiveTab('leaderboard')}
          />
        )}

        {activeTab === 'quiz' && (
          <Quiz3DGame
            onComponentMastered={handleMastered}
            onSaveScore={handleSaveScore}
            onGoLeaderboard={() => setActiveTab('leaderboard')}
          />
        )}

        {activeTab === 'explorer' && (
          <ExplorerLab
            masteredCounts={masteredCounts}
            onStartGame={() => setActiveTab('match')}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPanel
            records={records}
            masteredCounts={masteredCounts}
            onClearScores={handleClearScores}
            onPlayMatch={() => setActiveTab('match')}
          />
        )}
      </main>

      {/* Clean Uncluttered Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B1120] py-4">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:px-6">
          <span>ElektroLab 3D · Media Edukasi Pengenalan Komponen Elektronika</span>
          <span>10 Komponen 3D Interaktif · Simbol Skematik IEC · Sistem Skor & Kombo</span>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Play, Sparkles } from 'lucide-react';
import {
  COMPONENT_MAP,
  ComponentCategory,
  ComponentId,
  ELECTRONIC_COMPONENTS,
} from './componentsData';
import { soundEngine } from './soundEngine';
import { Viewport3D } from './Viewport3D';
import { SchematicSymbol } from './SchematicSymbol';

interface ExplorerLabProps {
  masteredCounts: Record<ComponentId, number>;
  onStartGame: () => void;
}

const CATEGORIES: Array<'Semua' | ComponentCategory> = [
  'Semua',
  'Komponen Pasif',
  'Semikonduktor',
  'Sirkuit Terpadu',
  'Elektromekanik',
];

export const ExplorerLab: React.FC<ExplorerLabProps> = ({ masteredCounts, onStartGame }) => {
  const [selectedId, setSelectedId] = useState<ComponentId>('resistor');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | ComponentCategory>('Semua');
  const [testActive, setTestActive] = useState(false);

  const filteredComponents =
    categoryFilter === 'Semua'
      ? ELECTRONIC_COMPONENTS
      : ELECTRONIC_COMPONENTS.filter((c) => c.category === categoryFilter);

  const activeInfo = COMPONENT_MAP[selectedId];

  const handleSelectComponent = (id: ComponentId) => {
    soundEngine.playClick();
    setSelectedId(id);
    setTestActive(false);
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6">
      {/* Category Filter Toolbar + Quick Action */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
          {CATEGORIES.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setCategoryFilter(cat);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  active
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onStartGame();
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <span>Uji Pemahaman di Game</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main Two-Zone Educational Workbench */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Left Zone: Large 3D Inspection Stage (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="h-[460px] sm:h-[540px] lg:h-[600px] w-full">
            <Viewport3D
              componentId={selectedId}
              externalTestActive={testActive}
              onToggleTest={(next) => setTestActive(next)}
            />
          </div>
        </div>

        {/* Right Zone: Component Selector + Detailed Datasheet Deck (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Component Picker List */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Daftar Komponen (10 Modul)</span>
              <span className="font-mono-tech tabular-nums">
                {filteredComponents.length} komponen
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[210px] overflow-y-auto pr-1">
              {filteredComponents.map((comp) => {
                const isSelected = comp.id === selectedId;
                const mastered = (masteredCounts[comp.id] || 0) > 0;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => handleSelectComponent(comp.id)}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-sky-400 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/12 text-slate-100'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{comp.name}</p>
                      <p className="font-mono-tech mt-0.5 truncate text-[11px] text-slate-400">
                        {comp.symbolCode} · {comp.unit}
                      </p>
                    </div>
                    {mastered && (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-emerald-400"
                        aria-label="Sudah dikuasai"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Component Educational Card */}
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{activeInfo.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">Level {activeInfo.difficulty}</span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-slate-100">{activeInfo.name}</h2>
                  <p className="font-mono-tech mt-0.5 text-xs text-sky-400">
                    {activeInfo.englishName} · {activeInfo.typicalSpec}
                  </p>
                </div>

                {/* Schematic Symbol Preview */}
                <div className="shrink-0 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-center">
                  <SchematicSymbol id={selectedId} className="h-11 w-20 text-sky-400" />
                  <p className="mt-1 text-[11px] text-slate-400">Simbol Skematik</p>
                </div>
              </div>

              {/* Function & Technical Explanation */}
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400">Fungsi Utama</h3>
                  <p className="mt-1 text-slate-100 font-medium">{activeInfo.shortFunction}</p>
                </div>

                <p className="text-xs leading-relaxed text-slate-400">
                  {activeInfo.detailedExplanation}
                </p>

                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs font-semibold text-slate-400">Polaritas & Orientasi</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-200">
                      {activeInfo.polarityInfo}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-xs font-semibold text-slate-400">Contoh Penggunaan</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-200">
                      {activeInfo.realWorldExample}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-xs font-semibold text-slate-400">Susunan Kaki (Pinout)</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono-tech text-xs text-slate-300">
                    {activeInfo.pinout.map((pin) => (
                      <span key={pin}>{pin}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Simulation Trigger */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                {testActive ? activeInfo.testActiveDescription : 'Coba aktifkan simulasi pada model 3D.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  const next = !testActive;
                  soundEngine.playPowerTest(next);
                  setTestActive(next);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  testActive
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                    : 'border border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25'
                }`}
              >
                {testActive ? <Sparkles className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{testActive ? 'Simulasi Aktif' : activeInfo.testActionLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

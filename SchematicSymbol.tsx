import React from 'react';
import { ComponentId } from './componentsData';

interface SchematicSymbolProps {
  id: ComponentId;
  className?: string;
}

export const SchematicSymbol: React.FC<SchematicSymbolProps> = ({ id, className = 'w-16 h-12' }) => {
  switch (id) {
    case 'resistor':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol Resistor">
          <path
            d="M8 30H28L34 16L44 44L54 16L64 44L74 16L84 44L90 30H112"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="30" r="3" fill="currentColor" />
          <circle cx="112" cy="30" r="3" fill="currentColor" />
        </svg>
      );

    case 'electrolytic_cap':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol Kapasitor Elektrolit">
          <line x1="10" y1="30" x2="50" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="50" y1="12" x2="50" y2="48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M68 12C61 20 61 40 68 48" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="63" y1="30" x2="110" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M35 14V22M31 18H39" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'ceramic_cap':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol Kapasitor Keramik">
          <line x1="10" y1="30" x2="51" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="51" y1="12" x2="51" y2="48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <line x1="69" y1="12" x2="69" y2="48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <line x1="69" y1="30" x2="110" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'led':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol LED">
          <line x1="10" y1="34" x2="44" y2="34" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="44,18 44,50 74,34" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
          <line x1="74" y1="18" x2="74" y2="50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="74" y1="34" x2="110" y2="34" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M62 15L72 5M72 5H65M72 5V12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M77 18L87 8M87 8H80M87 8V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'diode':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol Dioda">
          <line x1="10" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="44,14 44,46 76,30" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
          <line x1="76" y1="14" x2="76" y2="46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <line x1="76" y1="30" x2="110" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'transistor':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol Transistor NPN">
          <circle cx="62" cy="30" r="22" stroke="currentColor" strokeWidth="2.5" opacity="0.65" />
          <line x1="18" y1="30" x2="53" y2="30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="53" y1="17" x2="53" y2="43" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <line x1="53" y1="23" x2="78" y2="10" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="53" y1="37" x2="78" y2="50" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
          <polygon points="75,49 65,48 70,40" fill="currentColor" />
        </svg>
      );

    case 'ic_555':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol IC 555">
          <rect x="34" y="10" width="52" height="40" rx="4" stroke="currentColor" strokeWidth="3.2" />
          <path d="M53 10C53 15 67 15 67 10" stroke="currentColor" strokeWidth="2.5" />
          <line x1="16" y1="18" x2="34" y2="18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="16" y1="26" x2="34" y2="26" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="16" y1="34" x2="34" y2="34" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="16" y1="42" x2="34" y2="42" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="86" y1="18" x2="104" y2="18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="86" y1="26" x2="104" y2="26" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="86" y1="34" x2="104" y2="34" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="86" y1="42" x2="104" y2="42" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
          <text x="60" y="34" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700" fontFamily="monospace">
            555
          </text>
        </svg>
      );

    case 'inductor':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol Induktor">
          <path
            d="M10 34H26C26 21 43 21 43 34C43 21 60 21 60 34C60 21 77 21 77 34C77 21 94 21 94 34H110"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="28" y1="14" x2="92" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'potentiometer':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol Potensiometer">
          <path
            d="M10 36H28L34 22L44 48L54 22L64 48L74 22L84 48L90 36H110"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="60" y1="6" x2="60" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <polygon points="60,24 54,14 66,14" fill="currentColor" />
        </svg>
      );

    case 'tactile_switch':
      return (
        <svg viewBox="0 0 120 60" fill="none" className={className} aria-label="Simbol Saklar Taktil">
          <line x1="12" y1="38" x2="40" y2="38" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="80" y1="38" x2="108" y2="38" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="40" cy="38" r="4" fill="currentColor" />
          <circle cx="80" cy="38" r="4" fill="currentColor" />
          <line x1="36" y1="24" x2="84" y2="24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="60" y1="10" x2="60" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="10" x2="70" y2="10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );
  }
};

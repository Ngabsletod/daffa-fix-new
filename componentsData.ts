export type ComponentId =
  | 'resistor'
  | 'electrolytic_cap'
  | 'ceramic_cap'
  | 'led'
  | 'diode'
  | 'transistor'
  | 'ic_555'
  | 'inductor'
  | 'potentiometer'
  | 'tactile_switch';

export type ComponentCategory =
  | 'Komponen Pasif'
  | 'Semikonduktor'
  | 'Sirkuit Terpadu'
  | 'Elektromekanik';

export interface ElectronicComponentInfo {
  id: ComponentId;
  name: string;
  englishName: string;
  category: ComponentCategory;
  symbolCode: string;
  unit: string;
  typicalSpec: string;
  shortFunction: string;
  detailedExplanation: string;
  polarityInfo: string;
  pinout: string[];
  realWorldExample: string;
  testActionLabel: string;
  testActiveDescription: string;
  accentHex: string;
  difficulty: 'pemula' | 'menengah' | 'mahir';
}

export const ELECTRONIC_COMPONENTS: ElectronicComponentInfo[] = [
  {
    id: 'resistor',
    name: 'Resistor Karbon',
    englishName: 'Carbon Film Resistor',
    category: 'Komponen Pasif',
    symbolCode: 'R',
    unit: 'Ohm (Ω)',
    typicalSpec: '270 Ω ±5% (Merah-Ungu-Cokelat-Emas)',
    shortFunction: 'Menghambat dan membatasi besarnya arus listrik dalam rangkaian.',
    detailedExplanation:
      'Resistor bekerja berdasarkan Hukum Ohm (V = I × R) untuk menurunkan tegangan dan membagi arus agar komponen sensitif seperti LED tidak kelebihan arus.',
    polarityInfo: 'Non-polar (dapat dipasang bolak-balik tanpa membedakan kutub).',
    pinout: ['Terminal A (Aksial)', 'Terminal B (Aksial)'],
    realWorldExample: 'Pembatas arus pada lampu LED dan pembagi tegangan sensor.',
    testActionLabel: 'Simulasi Aliran Arus',
    testActiveDescription: 'Arus listrik mengalir melewati hambatan 270 Ω dengan disipasi daya stabil.',
    accentHex: '#F59E0B',
    difficulty: 'pemula',
  },
  {
    id: 'led',
    name: 'LED (Light Emitting Diode)',
    englishName: 'Light Emitting Diode 5mm',
    category: 'Semikonduktor',
    symbolCode: 'D / LED',
    unit: 'Volt (Vf) & mA',
    typicalSpec: 'Merah 5mm · Vf 2.0V · If 20mA',
    shortFunction: 'Memancarkan cahaya ketika dialiri arus listrik searah (bias maju).',
    detailedExplanation:
      'LED adalah dioda semikonduktor yang melepaskan energi foton berupa cahaya tampak saat elektron melewati sambungan P-N.',
    polarityInfo: 'Polar: Kaki panjang = Anoda (+), kaki pendek & sisi datar = Katoda (-).',
    pinout: ['Anoda (+) · Kaki Panjang', 'Katoda (-) · Kaki Pendek / Sisi Datar'],
    realWorldExample: 'Lampu indikator daya, layar panel, dan lampu lalu lintas.',
    testActionLabel: 'Nyalakan LED 3D',
    testActiveDescription: 'Bias maju aktif (2.0V / 20mA): Semikonduktor memancarkan cahaya merah.',
    accentHex: '#EF4444',
    difficulty: 'pemula',
  },
  {
    id: 'electrolytic_cap',
    name: 'Kapasitor Elektrolit (Elko)',
    englishName: 'Electrolytic Capacitor',
    category: 'Komponen Pasif',
    symbolCode: 'C',
    unit: 'Farad (F / µF)',
    typicalSpec: '470 µF · 25V DC',
    shortFunction: 'Menyimpan muatan listrik berkapasitas besar dan meratakan riak tegangan.',
    detailedExplanation:
      'Kapasitor elektrolit menggunakan lapisan oksida tipis sebagai dielektrik sehingga mampu menyimpan energi listrik dalam jumlah besar untuk penstabil catu daya.',
    polarityInfo: 'Polar: Kaki panjang = Positif (+), garis putih bertanda "-" = Negatif (-).',
    pinout: ['Anoda (+) · Kaki Panjang', 'Katoda (-) · Garis Strip Putih'],
    realWorldExample: 'Penyaring riak (ripple filter) pada adaptor DC dan penguat audio.',
    testActionLabel: 'Uji Pengisian Muatan',
    testActiveDescription: 'Medan listrik terakumulasi di antara pelat aluminium dan elektrolit.',
    accentHex: '#38BDF8',
    difficulty: 'pemula',
  },
  {
    id: 'tactile_switch',
    name: 'Saklar Taktil (Push Button)',
    englishName: 'Tactile Push-Button Switch',
    category: 'Elektromekanik',
    symbolCode: 'SW',
    unit: 'Kontak SPST-NO',
    typicalSpec: '6×6 mm · 4-Pin Momentary',
    shortFunction: 'Menghubungkan atau memutus aliran arus secara sesaat saat tombol ditekan.',
    detailedExplanation:
      'Saklar taktil bertipe Normally Open (NO). Saat tuas ditekan, pegas logam di dalamnya menutup kontak sehingga arus mengalir dari sisi kiri ke kanan.',
    polarityInfo: 'Non-polar (perhatikan pasangan pin yang terhubung internal).',
    pinout: ['Pin 1 & 2 (Terhubung Internal)', 'Pin 3 & 4 (Terhubung saat ditekan)'],
    realWorldExample: 'Tombol reset mikrokontroler, tombol kalkulator, dan kontrol panel.',
    testActionLabel: 'Tekan Tombol 3D',
    testActiveDescription: 'Plunger tertekan ke bawah: Kontak internal tertutup dan arus mengalir.',
    accentHex: '#10B981',
    difficulty: 'pemula',
  },
  {
    id: 'diode',
    name: 'Dioda Penyearah',
    englishName: 'Rectifier Diode 1N4007',
    category: 'Semikonduktor',
    symbolCode: 'D',
    unit: 'Ampere (A) & Volt (PIV)',
    typicalSpec: '1N4007 · 1A · 1000V',
    shortFunction: 'Mengalirkan arus listrik hanya ke satu arah dan menyearahkan arus AC ke DC.',
    detailedExplanation:
      'Dioda silikon memungkinkan arus mengalir dari Anoda ke Katoda, serta memblokir arus balik sehingga sangat penting dalam rangkaian penyearah dan proteksi polaritas.',
    polarityInfo: 'Polar: Cincin perak/putih pada badan silinder menandai sisi Katoda (-).',
    pinout: ['Anoda (+) · Sisi Hitam', 'Katoda (-) · Sisi Cincin Perak'],
    realWorldExample: 'Penyearah jembatan (bridge rectifier) adaptor dan proteksi tegangan balik.',
    testActionLabel: 'Uji Penyearah Satu Arah',
    testActiveDescription: 'Arus mengalir searah dari Anoda menuju Katoda (tegangan jatuh ~0.7V).',
    accentHex: '#94A3B8',
    difficulty: 'menengah',
  },
  {
    id: 'ceramic_cap',
    name: 'Kapasitor Keramik',
    englishName: 'Ceramic Disc Capacitor',
    category: 'Komponen Pasif',
    symbolCode: 'C',
    unit: 'Pikofarad (pF / nF)',
    typicalSpec: 'Kode 104 · 100 nF (0.1 µF) 50V',
    shortFunction: 'Menyaring gangguan frekuensi tinggi (noise) dan kopling sinyal AC.',
    detailedExplanation:
      'Menggunakan bahan keramik sebagai isolator dielektrik. Kode "104" berarti 10 × 10⁴ pF = 100.000 pF atau 100 nF, ideal untuk decoupling dekat pin IC.',
    polarityInfo: 'Non-polar (bebas dipasang tanpa khawatir terbalik).',
    pinout: ['Terminal Radial 1', 'Terminal Radial 2'],
    realWorldExample: 'Kapasitor decoupling di dekat pin VCC mikrokontroler dan filter RF.',
    testActionLabel: 'Uji Filter Frekuensi',
    testActiveDescription: 'Menyalurkan noise frekuensi tinggi ke ground sambil menahan arus DC.',
    accentHex: '#D97706',
    difficulty: 'menengah',
  },
  {
    id: 'transistor',
    name: 'Transistor BJT (NPN)',
    englishName: 'Bipolar Junction Transistor TO-92',
    category: 'Semikonduktor',
    symbolCode: 'Q',
    unit: 'Penguatan Arus (hFE)',
    typicalSpec: 'BC547 / 2N2222 · NPN · 45V 100mA',
    shortFunction: 'Berfungsi sebagai penguat sinyal listrik sekaligus saklar elektronik otomatis.',
    detailedExplanation:
      'Arus kecil yang masuk ke kaki Basis (B) mengendalikan arus jauh lebih besar yang mengalir dari Kolektor (C) menuju Emitor (E).',
    polarityInfo: 'Memiliki 3 kaki spesifik (C, B, E) — perhatikan sisi datar kemasan TO-92.',
    pinout: ['Pin 1: Collector (C)', 'Pin 2: Base (B)', 'Pin 3: Emitter (E)'],
    realWorldExample: 'Driver relay otomatis, penguat suara miniatur, dan gerbang logika.',
    testActionLabel: 'Aktifkan Saklar Basis',
    testActiveDescription: 'Sinyal kecil pada Basis membuka jalur arus besar Kolektor → Emitor.',
    accentHex: '#A855F7',
    difficulty: 'menengah',
  },
  {
    id: 'potentiometer',
    name: 'Potensiometer Putar',
    englishName: 'Rotary Potentiometer',
    category: 'Elektromekanik',
    symbolCode: 'RV / POT',
    unit: 'Ohm (Ω) Variabel',
    typicalSpec: 'B10K (10 kΩ Linear) · 3 Pin',
    shortFunction: 'Resistor variabel yang nilai hambatannya dapat diatur dengan memutar tuas.',
    detailedExplanation:
      'Di dalam potensiometer terdapat jalur karbon melingkar dan penyapu (wiper) logam yang bergerak saat poros diputar, menghasilkan pembagi tegangan yang dapat disetel.',
    polarityInfo: 'Non-polar; kaki tengah adalah Wiper (keluaran tegangan variabel).',
    pinout: ['Pin 1: Terminal Ujung A', 'Pin 2: Wiper (Tengah)', 'Pin 3: Terminal Ujung B'],
    realWorldExample: 'Pengatur volume amplifier, pengatur kecerahan layar, dan joystick.',
    testActionLabel: 'Putar Poros Wiper',
    testActiveDescription: 'Poros berputar mengubah rasio resistansi antara Pin 1–2 dan Pin 2–3.',
    accentHex: '#14B8A6',
    difficulty: 'menengah',
  },
  {
    id: 'ic_555',
    name: 'IC Timer NE555 (DIP-8)',
    englishName: '555 Timer Integrated Circuit',
    category: 'Sirkuit Terpadu',
    symbolCode: 'U / IC',
    unit: '8-Pin DIP · Frekuensi (Hz)',
    typicalSpec: 'NE555P · 4.5V–16V · 8 Pin',
    shortFunction: 'Sirkuit terpadu pembangkit pulsa waktu (timer), osilator, dan sinyal PWM.',
    detailedExplanation:
      'IC 555 mengintegrasikan puluhan transistor, resistor, dan komparator dalam satu chip kecil untuk menghasilkan sinyal pewaktu presisi atau kedipan ritmis.',
    polarityInfo: 'Berorientasi Pin: Takik setengah lingkaran (notch) menandai sisi Pin 1 & 8.',
    pinout: [
      'Pin 1: GND | Pin 2: TRIG | Pin 3: OUT | Pin 4: RESET',
      'Pin 5: CTRL | Pin 6: THRES | Pin 7: DISCH | Pin 8: VCC',
    ],
    realWorldExample: 'Lampu kedip otomatis, pembangkit nada buzzer, dan pewaktu tunda.',
    testActionLabel: 'Kirim Pulsa Osilasi',
    testActiveDescription: 'Pin 3 (Output) menghasilkan gelombang kotak (PWM) secara periodik.',
    accentHex: '#6366F1',
    difficulty: 'mahir',
  },
  {
    id: 'inductor',
    name: 'Induktor Toroida',
    englishName: 'Toroidal Coil Inductor',
    category: 'Komponen Pasif',
    symbolCode: 'L',
    unit: 'Henry (H / µH / mH)',
    typicalSpec: '100 µH · Inti Ferit Lilitan Tembaga',
    shortFunction: 'Menyimpan energi dalam bentuk medan magnet dan menahan perubahan arus cepat.',
    detailedExplanation:
      'Lilitan kawat tembaga berisolasi pada inti ferit cincin menciptakan medan magnet terpusat yang efektif menyaring gangguan dan menaikkan/menurunkan tegangan DC.',
    polarityInfo: 'Non-polar (arah arus menentukan polaritas medan magnet, bukan pemasangan).',
    pinout: ['Terminal Lilitan 1', 'Terminal Lilitan 2'],
    realWorldExample: 'Konverter DC-DC (Buck/Boost), crossover speaker, dan filter EMI.',
    testActionLabel: 'Aktifkan Medan Magnet',
    testActiveDescription: 'Arus yang melilit inti ferit membangkitkan fluks magnetik di dalam cincin.',
    accentHex: '#EA580C',
    difficulty: 'mahir',
  },
];

export const COMPONENT_MAP: Record<ComponentId, ElectronicComponentInfo> = Object.fromEntries(
  ELECTRONIC_COMPONENTS.map((c) => [c.id, c]),
) as Record<ComponentId, ElectronicComponentInfo>;

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Search, Sparkles, FileSpreadsheet, RefreshCw,
  AlertCircle, Activity, Users, Calendar, Clock,
  MessageSquare, Filter, Image as ImageIcon, Camera,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateDataSummary } from './services/geminiService';
import { cn } from './lib/utils';
import _ from 'lodash';
import { fetchSheetData, fetchTargetData, SheetData, TargetEntry } from './services/sheetService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDriveThumbnailUrl = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  if (match?.[1]) {
    const directUrl = `https://drive.google.com/uc?export=view&id=${match[1]}`;
    return `https://wsrv.nl/?url=${encodeURIComponent(directUrl)}&w=400&h=400&fit=cover`;
  }
  return url;
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e2e8f0' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='13' font-family='sans-serif'%3EGagal Dimuat%3C/text%3E%3C/svg%3E";

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1E40AF', '#1D4ED8', '#BFDBFE'];

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1wZC9uKJWJopluktxUJF5xOenieUIUNpAOQMKrGv9U4k/edit?gid=1772938421#gid=1772938421';

const TARGET_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1wZC9uKJWJopluktxUJF5xOenieUIUNpAOQMKrGv9U4k/edit?gid=1866673689#gid=1866673689';

const BULAN_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
const HARI_ID  = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailySummary {
  personnel: string[];
  shifts: string[];
  entries: { activityList: string[]; action: string; time: string; }[];
  notes: string[];
  disturbances: string[];
  obstacles: string[];
  photos: string[];
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [sheetUrl]          = useState(DEFAULT_SHEET_URL);
  const [data, setData]     = useState<SheetData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [activeTab, setActiveTab]       = useState<'overview' | 'data'>('overview');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [targetData, setTargetData]     = useState<TargetEntry[]>([]);
  const [datesInCurrentWeek, setDatesInCurrentWeek] = useState<string[]>([]);

  // Carousel swipe
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const touchStartX   = useRef<number | null>(null);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  // ─── Week key (Sel–Sen) ───────────────────────────────────────────────────
  const getWeekKey = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day  = date.getDay();
    const selisih = day === 2 ? 0 : day > 2 ? day - 2 : day + 5;
    const awal  = new Date(date); awal.setDate(date.getDate() - selisih);
    const akhir = new Date(awal); akhir.setDate(awal.getDate() + 6);
    const fmt = (d: Date) =>
      `${d.getDate()} ${BULAN_ID[d.getMonth()]}`;
    return `Sel ${fmt(awal)} – Sen ${fmt(akhir)} ${akhir.getFullYear()}`;
  };

  // ─── Target helpers ───────────────────────────────────────────────────────
  const getTargetsForWeek = (datesInWeek: string[]): string[] => {
    if (!targetData.length || !datesInWeek.length) return [];
    const sample = datesInWeek[datesInWeek.length - 1];
    return targetData
      .filter(t => sample >= t.periodeMulai && sample <= t.periodeSelesai)
      .map(t => t.namaTarget);
  };

  const getWeeklyTargetStatus = (datesInWeek: string[]) => {
    if (!data) return null;
    const targets = getTargetsForWeek(datesInWeek);
    if (!targets.length) return null;

    const dateCol = data.headers.find(h => h.toLowerCase().includes('tanggal')) || '';
    const allKegiatan = datesInWeek.flatMap(date =>
      data.rows
        .filter(r => r[dateCol] === date)
        .flatMap(r => {
          const raw  = String(rowValue(r, 'pekerjaan') || rowValue(r, 'aktivitas') || '');
          const nama = String(rowValue(r, 'nama') || '');
          return raw.split(',').map(k => ({
            kegiatan: k.trim().replace(/\s*\|.*$/i, '').trim(),
            nama,
            tanggal: date,
          }));
        })
    );

    const tambahan = _.uniq(
      allKegiatan
        .filter(k =>
          k.kegiatan !== '-' && k.kegiatan !== '' &&
          (k.kegiatan.toLowerCase().startsWith('lainnya') ||
            !targets.some(t => t.toLowerCase() === k.kegiatan.toLowerCase()))
        )
        .map(k => k.kegiatan)
    ).filter(Boolean);

    return {
      targets: targets.map(target => {
        const found = allKegiatan.find(
          k =>
            k.kegiatan.toLowerCase().includes(target.toLowerCase()) ||
            target.toLowerCase().includes(k.kegiatan.toLowerCase())
        );
        return { target, tercapai: !!found, oleh: found?.nama ?? null, tanggal: found?.tanggal ?? null };
      }),
      tambahan: tambahan.length,
    };
  };

  // ─── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    handleLoadData(DEFAULT_SHEET_URL);
    const id = setInterval(() => handleLoadData(DEFAULT_SHEET_URL), 300_000);
    return () => clearInterval(id);
  }, []);

  // Update datesInCurrentWeek when week/data changes
  useEffect(() => {
    if (!data || !selectedWeek) return;
    const dateCol  = data.headers.find(h => h.toLowerCase().includes('tanggal')) || '';
    const allDates = _.uniq(data.rows.map(r => r[dateCol]).filter(Boolean)).sort() as string[];
    const groups   = _.groupBy(allDates, getWeekKey);
    const dates    = [...(groups[selectedWeek] ?? [])].sort();
    setDatesInCurrentWeek(dates);
  }, [data, selectedWeek]);

  const handleLoadData = async (url?: string) => {
    const targetUrl = url || sheetUrl;
    if (!targetUrl) return;
    setLoading(true); setError(null);
    try {
      const [result, targetResult] = await Promise.all([
        fetchSheetData(targetUrl),
        fetchTargetData(TARGET_SHEET_URL),
      ]);
      setData(result);
      setTargetData(targetResult);
      setAiSummary(null);

      const dateCol = result.headers.find(h => h.toLowerCase().includes('tanggal')) || '';
      const dates   = result.rows.map(r => r[dateCol]).filter(Boolean) as string[];
      if (dates.length > 0) {
        setSelectedDate(dates[dates.length - 1]);
        const weeks = _.uniq(dates.map(getWeekKey));
        if (weeks.length > 0) setSelectedWeek(weeks[weeks.length - 1]);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Row value helper ─────────────────────────────────────────────────────
  const rowValue = (row: Record<string, any>, key: string) => {
    const found = Object.keys(row).find(k => k.toLowerCase().includes(key));
    return found ? row[found] : null;
  };

  // ─── Daily summary ────────────────────────────────────────────────────────
  const getDailySummary = (date: string): DailySummary | null => {
    if (!data) return null;
    const dateCol = data.headers.find(h => h.toLowerCase().includes('tanggal')) || '';
    const dayRows = data.rows.filter(r => r[dateCol] === date);
    if (dayRows.length === 0) return null;

    const personnel = _.uniq(
      dayRows.map(r => String(rowValue(r, 'nama') || rowValue(r, 'teknisi') || '')).filter(Boolean)
    );
    const shifts = _.uniq(
      dayRows.map(r => String(rowValue(r, 'shift') || '')).filter(Boolean)
    ).sort();

    const allPekerjaan: string[] = [];
    dayRows.forEach(r => {
      const raw = String(rowValue(r, 'pekerjaan') || rowValue(r, 'aktivitas') || '');
      raw.split(',').forEach(item => {
        const trimmed = item.trim().replace(/\s*\|.*$/i, '').trim();
        if (trimmed && trimmed !== '-' &&
            !trimmed.toLowerCase().startsWith('sama dengan') &&
            !trimmed.match(/\(Shift\s*\d\)/i)) {
          if (!allPekerjaan.some(p => p.toLowerCase() === trimmed.toLowerCase()))
            allPekerjaan.push(trimmed);
        }
      });
    });

    const entries = allPekerjaan.length > 0 ? [{
      activityList: allPekerjaan,
      action: _.uniq(dayRows.map(r => rowValue(r, 'tindakan')).filter(v => v && v !== '-' && v !== '')).join('; ') || '-',
      time:   _.uniq(dayRows.map(r => rowValue(r, 'jam') || rowValue(r, 'mulai')).filter(Boolean)).join(', ') || '-',
    }] : [];

    const notes = _.uniq(
      dayRows.flatMap(r => {
        const val = rowValue(r, 'catatan') || rowValue(r, 'keterangan');
        return val && val !== '-' ? [String(val)] : [];
      })
    );
    const disturbances = dayRows.map(r => rowValue(r, 'gangguan')).filter((v): v is string => !!v && v !== 'N/A' && v !== '-' && v !== '');
    const obstacles    = dayRows.map(r => rowValue(r, 'kendala')).filter((v): v is string => !!v && v !== 'N/A' && v !== '-' && v !== '');

    const PHOTO_KEYWORDS = ['url foto', 'url_foto', 'bukti', 'gambar'];
    const photos = _.uniq(
      dayRows.flatMap(r => {
        const photoKeys = Object.keys(r).filter(k => PHOTO_KEYWORDS.some(kw => k.toLowerCase().includes(kw)));
        return photoKeys.flatMap(k => {
          const val = r[k];
          if (!val || val === '-' || val === 'N/A') return [];
          return String(val).split(',').map(s => s.trim()).filter(s => s.startsWith('http'));
        });
      })
    );

    return { personnel, shifts, entries, notes, disturbances, obstacles, photos };
  };

  // ─── Navigate carousel ────────────────────────────────────────────────────
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedDate || datesInCurrentWeek.length === 0) return;
    const idx = datesInCurrentWeek.indexOf(selectedDate);
    if (direction === 'prev' && idx > 0) {
      setSlideDirection('right');
      setSelectedDate(datesInCurrentWeek[idx - 1]);
      scrollChipIntoView(idx - 1);
    } else if (direction === 'next' && idx < datesInCurrentWeek.length - 1) {
      setSlideDirection('left');
      setSelectedDate(datesInCurrentWeek[idx + 1]);
      scrollChipIntoView(idx + 1);
    }
  }, [selectedDate, datesInCurrentWeek]);

  const scrollChipIntoView = (index: number) => {
    if (!dateScrollRef.current) return;
    const chips = dateScrollRef.current.querySelectorAll<HTMLButtonElement>('button');
    chips[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigateDate(diff > 0 ? 'next' : 'prev');
    touchStartX.current = null;
  };

  // ─── AI ───────────────────────────────────────────────────────────────────
  const getAiSummary = async () => {
    if (!data || data.rows.length === 0) return;
    setLoadingAi(true);
    try {
      const summary = await generateDataSummary(data.rows, data.headers);
      setAiSummary((summary ?? '').replace(/[#*]/g, ''));
    } catch (err) { console.error(err); }
    finally { setLoadingAi(false); }
  };

  // ─── Table ────────────────────────────────────────────────────────────────
  const HIDDEN_KEYWORDS = ['timestamp', 'foto', 'dokumentasi', 'link', 'url', 'bukti', 'gambar', 'image'];
  const displayHeaders  = data?.headers.filter(h => !HIDDEN_KEYWORDS.some(kw => h.toLowerCase().includes(kw))) || [];
  const filteredRows    = data?.rows.filter(row =>
    Object.values(row).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // ─── Stats ────────────────────────────────────────────────────────────────
  const getStats = () => {
    if (!data) return null;
    const col = (keys: string[]) => data.headers.find(h => keys.some(k => h.toLowerCase().includes(k)));
    const nameCol  = col(['nama', 'person', 'petugas', 'teknisi']);
    const shiftCol = col(['shift', 'waktu', 'periode']);
    const typeCol  = col(['jenis', 'tipe', 'status', 'kategori']);
    const toEntries = (obj: Record<string, number> | null) =>
      obj ? Object.entries(obj).map(([name, count]) => ({ name, count })) : [];
    return {
      total:  data.rows.length,
      names:  toEntries(nameCol  ? _.countBy(data.rows, nameCol)  : null),
      shifts: toEntries(shiftCol ? _.countBy(data.rows, shiftCol) : null),
      types:  toEntries(typeCol  ? _.countBy(data.rows, typeCol)  : null),
    };
  };
  const stats = getStats();

  // ─── Week groups (computed) ───────────────────────────────────────────────
  const getWeekGroups = () => {
    if (!data) return { weekGroups: {}, sortedWeeks: [] };
    const dateCol  = data.headers.find(h => h.toLowerCase().includes('tanggal')) || '';
    const allDates = _.uniq(data.rows.map(r => r[dateCol]).filter(Boolean)).sort() as string[];
    const weekGroups  = _.groupBy(allDates, getWeekKey);
    const sortedWeeks = Object.keys(weekGroups).sort((a, b) => {
      const lastA = [...weekGroups[a]].sort().at(-1)!;
      const lastB = [...weekGroups[b]].sort().at(-1)!;
      return new Date(lastB).getTime() - new Date(lastA).getTime();
    });
    return { weekGroups, sortedWeeks };
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#141414] font-sans selection:bg-[#2563EB] selection:text-white">

      {/* ── Header ── */}
      <header className="border-b border-blue-100 bg-white sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-black text-2xl tracking-tighter text-blue-900 leading-none">TVRI Lampung</h1>
            <p className="text-xs text-blue-600 font-bold mt-1 tracking-wide">Transmisi Simpang Pematang</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="https://hanifferra.github.io/laporan-shift/"
              target="_blank" rel="noopener noreferrer"
              className="bg-white text-blue-700 border border-blue-200 px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm active:scale-95 whitespace-nowrap"
            >
              <FileSpreadsheet size={16} /> Input Data
            </a>
            <button
              onClick={() => handleLoadData()}
              disabled={loading}
              className="bg-[#1D4ED8] text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Sinkron...' : 'Update Data'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading / empty */}
        {!data ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full" />
              <div className="relative bg-white p-8 rounded-3xl border border-blue-100 shadow-2xl">
                {loading
                  ? <RefreshCw size={64} className="text-blue-600 animate-spin" />
                  : <FileSpreadsheet size={64} className="text-blue-600" />}
              </div>
            </div>
            <div className="max-w-md">
              <h2 className="text-2xl font-bold tracking-tight mb-2">{loading ? 'Memuat Data...' : 'Siap Terhubung'}</h2>
              <p className="text-slate-500">{loading ? 'Mengkoneksikan dasbor dengan Google Sheets.' : 'Mengambil data dari spreadsheet...'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Laporan"   value={stats?.total || 0}           icon={<Activity size={20} />} />
              <StatCard label="Kontributor"     value={stats?.names.length || 0}    icon={<Users size={20} />} />
              <StatCard label="Variasi Shift"   value={stats?.shifts.length || 0}   icon={<Clock size={20} />} />
              <StatCard label="Entri Tersaring" value={filteredRows.length}          icon={<Calendar size={20} />} />
            </div>

            {/* ── AI Insights ── */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                <div className="space-y-2 max-w-sm shrink-0">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Sparkles size={20} />
                    <span className="text-xs font-mono uppercase tracking-[0.2em] font-semibold">Gemini AI Engine</span>
                  </div>
                  <h3 className="text-2xl font-bold font-serif italic text-blue-100">Analisis Laporan</h3>
                  <p className="text-blue-200/60 text-sm">Gemini AI mengolah narasi laporan untuk menemukan poin-poin krusial.</p>
                  <button onClick={getAiSummary} disabled={loadingAi}
                    className="mt-4 bg-white text-blue-900 px-8 py-3 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-blue-50 hover:scale-105 transition-all disabled:opacity-50 shadow-xl shadow-black/20">
                    <RefreshCw size={18} className={loadingAi ? 'animate-spin' : 'hidden'} />
                    <Sparkles size={18} className={loadingAi ? 'hidden' : ''} />
                    {loadingAi ? 'Menganalisis...' : 'Refresh Analisis'}
                  </button>
                </div>
                <div className="flex-grow w-full bg-black/20 border border-white/10 p-8 rounded-[2rem] min-h-[160px] backdrop-blur-md">
                  {loadingAi ? (
                    <div className="flex flex-col items-center justify-center min-h-[150px] space-y-4">
                      <div className="flex gap-2">
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <motion.div key={i} animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1, delay }}
                            className="w-3 h-3 bg-blue-400 rounded-full" />
                        ))}
                      </div>
                      <p className="text-xs font-mono text-blue-200/40 uppercase tracking-widest">Memproses Data Transmisi...</p>
                    </div>
                  ) : aiSummary ? (
                    <div className="text-blue-50/90 text-[15px] leading-loose">
                      <ReactMarkdown components={{
                        p: ({ children }) => <p className="mb-8 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="mb-8 space-y-4 list-disc pl-5">{children}</ul>,
                        li: ({ children }) => <li className="text-blue-100/80">{children}</li>,
                      }}>{aiSummary}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-blue-200/30 italic text-sm py-12">
                      <MessageSquare size={32} className="mb-2 opacity-20" />
                      Belum ada analisis. Klik tombol di samping untuk memulai.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Main Tabs ── */}
            <div className="space-y-6">
              <div className="flex gap-1 bg-slate-200 p-1 rounded-xl w-fit">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Dashboard Visual" />
                <TabButton active={activeTab === 'data'}     onClick={() => setActiveTab('data')}     label="Tabel Data" />
              </div>

              {activeTab === 'overview' ? (
                <div className="space-y-10">
                  {data.rows.length > 0 && (() => {
                    const { weekGroups, sortedWeeks } = getWeekGroups();
                    const weeklyStatus  = getWeeklyTargetStatus(datesInCurrentWeek);
                    const currentIndex  = selectedDate ? datesInCurrentWeek.indexOf(selectedDate) : -1;
                    const WEEKLY_TARGET = weeklyStatus?.targets.length ?? 7;
                    const achievedCount = weeklyStatus?.targets.filter(t => t.tercapai).length ?? datesInCurrentWeek.length;
                    const progressPct   = Math.min((achievedCount / WEEKLY_TARGET) * 100, 100);
                    const targetStatus  = achievedCount > WEEKLY_TARGET ? 'bonus' : achievedCount === WEEKLY_TARGET ? 'achieved' : 'incomplete';

                    const bannerThemes = {
                      incomplete: { bg: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-500', icon: <AlertCircle size={20} />, title: 'Target Laporan Belum Lengkap', titleColor: 'text-amber-800', descColor: 'text-amber-600', barColor: 'bg-amber-500', shadow: '' },
                      achieved:   { bg: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-500', icon: <Sparkles size={20} />, title: 'Target Laporan Mingguan Tercapai! 🎉', titleColor: 'text-emerald-800', descColor: 'text-emerald-600', barColor: 'bg-emerald-500', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' },
                      bonus:      { bg: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-500', icon: <Zap size={20} className="fill-indigo-100" />, title: 'Target Terlampaui! Pencapaian Ekstra 🔥', titleColor: 'text-indigo-800', descColor: 'text-indigo-600', barColor: 'bg-indigo-500', shadow: 'shadow-[0_0_15px_rgba(99,102,241,0.4)]' },
                    } as const;
                    const theme = bannerThemes[targetStatus];

                    return (
                      <section className="space-y-4">

                        {/* ── LOGBOOK CARD ── */}
                        <div className="bg-white rounded-[2rem] border border-blue-50 shadow-xl shadow-blue-900/5 overflow-hidden">

                          {/* Card header */}
                          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar size={18} className="text-blue-600" />
                              <h4 className="font-bold text-slate-800">Logbook Harian</h4>
                            </div>
                            <p className="text-xs text-slate-400">Pilih minggu lalu tap hari untuk melihat aktivitas</p>
                          </div>

                          {/* ── WEEK SELECTOR (pill tabs horizontal scroll) ── */}
                          <div className="px-6 py-4 border-b border-slate-100 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                            <div className="flex gap-2 w-max">
                              {sortedWeeks.map(week => (
                                <button
                                  key={week}
                                  onClick={() => {
                                    setSelectedWeek(week);
                                    const dates = [...(weekGroups[week] ?? [])].sort();
                                    setSelectedDate(dates.at(-1) ?? null);
                                  }}
                                  className={cn(
                                    'px-4 py-2 rounded-full shrink-0 transition-all font-semibold text-xs whitespace-nowrap border',
                                    selectedWeek === week
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                  )}
                                >
                                  📅 {week}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* ── DATE CARD CAROUSEL ── */}
                          {selectedWeek && datesInCurrentWeek.length > 0 && (
                            <div className="px-4 py-5 border-b border-slate-100">
                              <div
                                ref={dateScrollRef}
                                className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory"
                                style={{ scrollbarWidth: 'none' }}
                              >
                                {datesInCurrentWeek.map((date, idx) => {
                                  const d      = new Date(date);
                                  const isActive = date === selectedDate;
                                  return (
                                    <button
                                      key={date}
                                      onClick={() => {
                                        const curIdx = selectedDate ? datesInCurrentWeek.indexOf(selectedDate) : 0;
                                        setSlideDirection(idx > curIdx ? 'left' : 'right');
                                        setSelectedDate(date);
                                      }}
                                      className={cn(
                                        'snap-center shrink-0 flex flex-col items-center justify-center rounded-2xl transition-all duration-200 border select-none',
                                        'w-[72px] h-[90px] gap-0.5',
                                        isActive
                                          ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 scale-105'
                                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:scale-105'
                                      )}
                                    >
                                      {/* Bulan kecil */}
                                      <span className={cn(
                                        'text-[10px] font-bold uppercase tracking-widest leading-none',
                                        isActive ? 'text-blue-100' : 'text-slate-400'
                                      )}>
                                        {BULAN_ID[d.getMonth()]}
                                      </span>
                                      {/* Hari singkat */}
                                      <span className={cn(
                                        'text-[9px] font-semibold uppercase tracking-wider leading-none mb-0.5',
                                        isActive ? 'text-blue-200' : 'text-slate-300'
                                      )}>
                                        {HARI_ID[d.getDay()]}
                                      </span>
                                      {/* Tanggal BESAR */}
                                      <span className={cn(
                                        'text-3xl font-black leading-none tracking-tighter',
                                        isActive ? 'text-white' : 'text-slate-700'
                                      )}>
                                        {d.getDate()}
                                      </span>
                                      {/* Tahun kecil */}
                                      <span className={cn(
                                        'text-[9px] font-semibold leading-none mt-0.5',
                                        isActive ? 'text-blue-200' : 'text-slate-300'
                                      )}>
                                        {d.getFullYear()}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Dot indicator */}
                              {datesInCurrentWeek.length > 1 && (
                                <div className="flex items-center justify-center gap-1.5 mt-3">
                                  {datesInCurrentWeek.map(date => (
                                    <button
                                      key={date}
                                      onClick={() => {
                                        const idx    = datesInCurrentWeek.indexOf(date);
                                        const curIdx = selectedDate ? datesInCurrentWeek.indexOf(selectedDate) : 0;
                                        setSlideDirection(idx > curIdx ? 'left' : 'right');
                                        setSelectedDate(date);
                                      }}
                                      className={cn(
                                        'rounded-full transition-all duration-300',
                                        date === selectedDate ? 'w-5 h-2 bg-blue-600' : 'w-2 h-2 bg-slate-200 hover:bg-slate-400'
                                      )}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── TARGET MINGGUAN ── */}
                          {selectedWeek && weeklyStatus && (
                            <div className="border-b border-slate-100">
                              <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                  <Activity size={14} className="text-slate-400" />
                                  <span className="text-sm font-semibold text-slate-700">Target minggu ini</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-semibold">
                                  <span className="text-emerald-600">{weeklyStatus.targets.filter(t => t.tercapai).length} tercapai</span>
                                  <span className="text-slate-400">{weeklyStatus.targets.filter(t => !t.tercapai).length} belum</span>
                                  {weeklyStatus.tambahan > 0 && <span className="text-blue-500">{weeklyStatus.tambahan} tambahan</span>}
                                </div>
                              </div>
                              <div className="divide-y divide-slate-100">
                                {weeklyStatus.targets.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between px-6 py-3">
                                    <div className="flex items-center gap-3">
                                      {item.tercapai
                                        ? <div className="w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center shrink-0"><div className="w-2 h-2 rounded-full bg-emerald-500" /></div>
                                        : <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 shrink-0" />}
                                      <span className={`text-sm ${item.tercapai ? 'text-slate-800' : 'text-slate-400'}`}>{item.target}</span>
                                    </div>
                                    {item.tercapai ? (
                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs text-slate-400 hidden sm:block">{item.oleh} · {new Date(item.tanggal!).toLocaleDateString('id-ID', { weekday: 'long' })}</span>
                                        <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">Tercapai</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-400 border border-slate-200 px-3 py-1 rounded-full shrink-0">Belum</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ── BANNER STATUS TARGET ── */}
                          {selectedWeek && (
                            <div className={cn('mx-4 my-4 p-4 rounded-2xl border flex items-center justify-between transition-all duration-500', theme.bg, theme.shadow)}>
                              <div className="flex items-center gap-3">
                                <div className={cn('p-2.5 rounded-xl text-white shadow-sm', theme.iconBg)}>{theme.icon}</div>
                                <div>
                                  <h5 className={cn('font-bold text-sm tracking-tight', theme.titleColor)}>{theme.title}</h5>
                                  <p className={cn('text-xs mt-0.5', theme.descColor)}>
                                    Logbook terisi <span className="font-bold text-sm">{datesInCurrentWeek.length}</span> dari target {WEEKLY_TARGET} hari.
                                  </p>
                                </div>
                              </div>
                              <div className="hidden sm:flex flex-col gap-1 w-32 text-right shrink-0">
                                <span className={cn('text-[10px] font-bold font-mono', theme.descColor)}>
                                  {targetStatus === 'bonus' ? `+${datesInCurrentWeek.length - WEEKLY_TARGET} Hari Ekstra` : `${progressPct.toFixed(0)}%`}
                                </span>
                                <div className="h-2 bg-black/5 rounded-full overflow-hidden border border-black/5">
                                  <div className={cn('h-full rounded-full transition-all duration-1000', theme.barColor)} style={{ width: `${progressPct}%` }} />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── DAY DETAIL (swipeable) ── */}
                          <div
                            className="touch-pan-y"
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                          >
                            <AnimatePresence mode="wait" custom={slideDirection}>
                              {selectedDate && (() => {
                                const summary = getDailySummary(selectedDate);
                                if (!summary) return (
                                  <motion.div
                                    key={`empty-${selectedDate}`}
                                    custom={slideDirection}
                                    variants={slideVariants}
                                    initial="enter" animate="center" exit="exit"
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="px-6 py-12 text-center text-slate-300 italic text-sm"
                                  >
                                    Tidak ada data untuk tanggal ini.
                                  </motion.div>
                                );

                                return (
                                  <motion.div
                                    key={selectedDate}
                                    custom={slideDirection}
                                    variants={slideVariants}
                                    initial="enter" animate="center" exit="exit"
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    className="p-6 space-y-6"
                                  >
                                    {/* Activities + Side panel */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                      {/* Activities */}
                                      <div className="lg:col-span-8 bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                          <div>
                                            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-600 mb-1">Aktivitas Hari Ini</p>
                                            <h5 className="text-xl font-black text-slate-800 tracking-tight">{selectedDate}</h5>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100">
                                            <Clock size={12} className="text-blue-500" />
                                            {summary.shifts.join(', ') || 'N/A'}
                                          </div>
                                        </div>
                                        <div className="space-y-4">
                                          {summary.entries.length > 0 ? summary.entries.map((entry, i) => (
                                            <div key={i} className="group relative pl-8 pb-6 border-l-2 border-blue-100 last:pb-0">
                                              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-400 shadow-sm" />
                                              <ol className="space-y-1.5 list-none">
                                                {entry.activityList.map((item, idx) => (
                                                  <li key={idx} className="text-sm text-slate-800 font-semibold leading-relaxed flex gap-2">
                                                    <span className="text-blue-400 font-mono text-xs mt-0.5 shrink-0 w-5">{idx + 1}.</span>
                                                    {item}
                                                  </li>
                                                ))}
                                              </ol>
                                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                                                <p className="text-xs text-slate-500 font-medium">
                                                  <span className="text-emerald-600 font-bold text-[10px] uppercase mr-2 tracking-tighter">Hasil:</span>
                                                  {entry.action}
                                                </p>
                                                <span className="text-[10px] text-slate-300 font-mono">[{entry.time}]</span>
                                              </div>
                                            </div>
                                          )) : (
                                            <div className="py-10 text-center text-slate-300 italic text-sm">Data pekerjaan tidak tersedia</div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Side Panel */}
                                      <div className="lg:col-span-4 space-y-4">
                                        {/* Petugas */}
                                        <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-3">Petugas Piket</p>
                                          <div className="flex flex-wrap gap-2">
                                            {summary.personnel.map((p, i) => (
                                              <span key={i} className="px-3 py-1.5 bg-white text-blue-700 rounded-xl text-xs font-bold border border-blue-100 shadow-sm">{p}</span>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Status */}
                                        {summary.disturbances.length > 0 || summary.obstacles.length > 0 ? (
                                          <div className="bg-red-50 p-5 rounded-[1.5rem] border border-red-100">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-red-500 mb-3 flex items-center gap-2">
                                              <AlertCircle size={13} /> Status & Kendala
                                            </p>
                                            <div className="space-y-2">
                                              {summary.disturbances.map((d, i) => (
                                                <div key={i} className="bg-white p-3 rounded-xl border border-red-100">
                                                  <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Gangguan</p>
                                                  <p className="text-xs text-slate-700">{d}</p>
                                                </div>
                                              ))}
                                              {summary.obstacles.map((o, i) => (
                                                <div key={i} className="bg-white p-3 rounded-xl border border-orange-100">
                                                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Kendala Lapangan</p>
                                                  <p className="text-xs text-slate-700">{o}</p>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-center border border-emerald-100 flex items-center justify-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            Kondisi Normal
                                          </div>
                                        )}

                                        {/* Catatan */}
                                        {summary.notes.length > 0 && (
                                          <div className="bg-amber-50 p-5 rounded-[1.5rem] border border-amber-100">
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600 mb-3 flex items-center gap-2">
                                              <MessageSquare size={13} /> Catatan Khusus
                                            </p>
                                            <ul className="space-y-2">
                                              {summary.notes.map((note, i) => (
                                                <li key={i} className="text-xs text-slate-600 italic leading-relaxed bg-white p-3 rounded-xl border border-amber-50">{note}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Foto galeri */}
                                    {summary.photos.length > 0 && (
                                      <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                                          <div>
                                            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-600 mb-1">Preview Geotag</p>
                                            <h5 className="text-lg font-black text-slate-800 tracking-tight">Galeri Dokumentasi Lapangan</h5>
                                          </div>
                                          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                            <Camera size={18} className="text-blue-300" />
                                            <span>{summary.photos.length} foto</span>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                          {summary.photos.map((url, i) => {
                                            const imgSrc = getDriveThumbnailUrl(url);
                                            return (
                                              <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                className="group relative block aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                                                <img src={imgSrc || url} alt={`Dokumentasi ${i + 1}`}
                                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                  loading="lazy"
                                                  onError={e => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG; }} />
                                                <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                                                  <ImageIcon className="text-white mb-2" size={24} />
                                                  <span className="text-white text-xs font-bold bg-blue-900/50 px-2 py-1 rounded-full">Buka</span>
                                                </div>
                                              </a>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })()}
                            </AnimatePresence>
                          </div>
                        </div>
                        {/* end LOGBOOK CARD */}

                      </section>
                    );
                  })()}

                  {/* ── Charts ── */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(stats?.names.length ?? 0) > 0 && (
                      <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm col-span-1 lg:col-span-2">
                        <div className="mb-8">
                          <h4 className="font-bold text-xl flex items-center gap-2 text-slate-800 tracking-tight">
                            <Activity size={20} className="text-blue-600" /> Kinerja Kontributor Transmisi
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 font-medium">Berdasarkan frekuensi laporan harian</p>
                        </div>
                        <div className="h-[350px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...(stats!.names)].sort((a, b) => b.count - a.count)}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: '500' }} />
                              <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8' }} />
                              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }} />
                              <Bar dataKey="count" fill="#1D4ED8" radius={[14, 14, 4, 4]} barSize={40}
                                label={{ position: 'top', fill: '#1e3a8a', fontSize: 10, fontWeight: 'bold' }} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    {(stats?.shifts.length ?? 0) > 0 && (
                      <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-slate-800 mb-8">
                          <Clock size={20} className="text-blue-600" /> Alokasi Waktu (Shift)
                        </h4>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={stats!.shifts} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="count" stroke="none">
                                {stats!.shifts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                              <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    {(stats?.types.length ?? 0) > 0 && (
                      <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-slate-800 mb-8">
                          <Filter size={20} className="text-blue-600" /> Klasifikasi Aktivitas
                        </h4>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={stats!.types} cx="50%" cy="50%" innerRadius={0} outerRadius={85} dataKey="count"
                                label={(props) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                                stroke="white" strokeWidth={2}>
                                {stats!.types.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              ) : (
                /* ── Data Table ── */
                <div className="bg-white rounded-3xl border border-blue-50 shadow-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-grow max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                      <input type="text" placeholder="Cari data pekerjaan..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm outline-none border border-transparent focus:border-blue-200 focus:bg-white transition-all"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="text-xs font-mono text-slate-400">Menampilkan {filteredRows.length} baris data</div>
                  </div>
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr>
                          {displayHeaders.map((header, i) => (
                            <th key={i} className="p-4 text-xs font-mono uppercase tracking-wider sticky top-0 bg-[#1D4ED8] text-white z-20">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50 transition-colors group">
                            {displayHeaders.map((header, hIdx) => (
                              <td key={hIdx} className="p-4 text-xs text-slate-700">
                                <div className="max-w-[300px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                  {String(row[header] || '-')}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredRows.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic">Tidak ada data yang ditemukan.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto p-12 border-t border-slate-200 text-center space-y-2">
        <p className="text-sm font-bold tracking-tight text-blue-900 underline decoration-blue-200 decoration-4 underline-offset-4 font-serif italic">
          TVRI Transmisi Simpang Pematang
        </p>
        <p className="text-xs text-slate-400 font-mono uppercase tracking-widest">Digital Logbook & Analysis System • 2026</p>
      </footer>
    </div>
  );
}

// ─── Slide animation variants ─────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: 'left' | 'right') => ({ x: dir === 'left' ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: 'left' | 'right') => ({ x: dir === 'left' ? -60 : 60, opacity: 0 }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -4, borderColor: '#BFDBFE' }}
      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-50 shadow-sm bg-white relative overflow-hidden transition-all">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
      </div>
      <p className="text-[9px] sm:text-xs font-mono uppercase tracking-[0.1em] text-slate-400 mb-1 truncate">{label}</p>
      <p className="text-xl sm:text-3xl font-bold leading-none tracking-tighter text-blue-950">{value}</p>
    </motion.div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={cn(
        'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300',
        active ? 'bg-white text-blue-700 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-blue-600 hover:bg-white/50'
      )}>
      {label}
    </button>
  );
}
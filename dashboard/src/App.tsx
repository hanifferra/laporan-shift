import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Search, Sparkles, FileSpreadsheet, RefreshCw,
  AlertCircle, LayoutDashboard,
  Users, Calendar, Clock, Activity, MessageSquare, Filter, Image as ImageIcon,
  ChevronLeft, ChevronRight, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchSheetData, SheetData } from './services/sheetService';
import { generateDataSummary } from './services/geminiService';
import { cn } from './lib/utils';
import _ from 'lodash';

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1E40AF', '#1D4ED8', '#BFDBFE'];

const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1wZC9uKJWJopluktxUJF5xOenieUIUNpAOQMKrGv9U4k/edit?gid=625931813#gid=625931813';

export default function App() {
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET_URL);
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'data'>('overview');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  React.useEffect(() => {
    if (DEFAULT_SHEET_URL) {
      handleLoadData(DEFAULT_SHEET_URL);
      const intervalId = setInterval(() => {
        handleLoadData(DEFAULT_SHEET_URL);
      }, 300000);
      return () => clearInterval(intervalId);
    }
  }, []);

  const handleLoadData = async (url?: string) => {
    const targetUrl = url || sheetUrl;
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSheetData(targetUrl);
      setData(result);
      setAiSummary(null);
      const dates = result.rows
        .map(r => r[result.headers.find(h => h.toLowerCase().includes('tanggal')) || ''])
        .filter(Boolean);
      if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to find column by loosely matching name
  const rowValue = (row: any, key: string) => {
    const foundKey = Object.keys(row).find(k => k.toLowerCase().includes(key));
    return foundKey ? row[foundKey] : null;
  };

  const getDailySummary = (date: string) => {
    if (!data) return null;
    const dayRows = data.rows.filter(
      r => r[data.headers.find(h => h.toLowerCase().includes('tanggal')) || ''] === date
    );
    if (dayRows.length === 0) return null;

    const personnel = _.uniq(
      dayRows.map(r => String(rowValue(r, 'nama') || rowValue(r, 'teknisi') || ''))
    ).filter(Boolean);

    const shifts = _.uniq(
      dayRows.map(r => String(rowValue(r, 'shift') || ''))
    ).filter(Boolean).sort();

    // Kumpulkan semua pekerjaan unik dari seluruh baris di hari ini
    // Gabungkan semua item pekerjaan, buang yang "sama dengan..." dan kosong
    const allPekerjaan: string[] = [];
    dayRows.forEach(r => {
      const raw = String(rowValue(r, 'pekerjaan') || rowValue(r, 'aktivitas') || '');
      raw.split(',').forEach(item => {
        // SESUDAH — buang suffix "| Sama dengan..." 
        const trimmed = item.trim().replace(/\s*\|.*$/i, '').trim();
        if (
          trimmed !== '' &&
          trimmed !== '-' &&
          !trimmed.toLowerCase().startsWith('sama dengan') &&
          !trimmed.match(/\(Shift\s*\d\)/i)   // ← tambah ini
        ) {
          // Tambahkan hanya jika belum ada (case-insensitive)
          const alreadyExists = allPekerjaan.some(
            p => p.toLowerCase() === trimmed.toLowerCase()
          );
          if (!alreadyExists) allPekerjaan.push(trimmed);
        }
      });
    });

    // Buat satu entry tunggal berisi semua pekerjaan unik hari ini
    const entries = allPekerjaan.length > 0
      ? [{
        activityList: allPekerjaan,
        action: _.uniq(
          dayRows
            .map(r => rowValue(r, 'tindakan'))
            .filter(v => v && v !== '-' && v !== '')
        ).join('; ') || '-',
        time: _.uniq(
          dayRows
            .map(r => rowValue(r, 'jam') || rowValue(r, 'mulai'))
            .filter(Boolean)
        ).join(', ') || '-',
      }]
      : [];

    const notes = _.uniq(
      dayRows.flatMap(r => {
        const val = rowValue(r, 'catatan') || rowValue(r, 'keterangan');
        return val && val !== '-' ? [String(val)] : [];
      })
    ).filter(Boolean);

    const disturbances = dayRows
      .map(r => rowValue(r, 'gangguan'))
      .filter(v => v && v !== 'N/A' && v !== '-' && v !== '');

    const obstacles = dayRows
      .map(r => rowValue(r, 'kendala'))
      .filter(v => v && v !== 'N/A' && v !== '-' && v !== '');

    return { personnel, shifts, entries, notes, disturbances, obstacles };
  };

  const getAiSummary = async () => {
    if (!data || data.rows.length === 0) return;
    setLoadingAi(true);
    try {
      const summary = await generateDataSummary(data.rows, data.headers);
      const cleanedSummary = summary.replace(/[#*]/g, '');
      setAiSummary(cleanedSummary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const displayHeaders = data?.headers.filter(header => {
    const h = header.toLowerCase();
    return !['timestamp', 'foto', 'dokumentasi', 'link', 'url', 'bukti', 'gambar', 'image'].some(
      k => h.includes(k)
    );
  }) || [];

  const filteredRows = data?.rows.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const getStats = () => {
    if (!data) return null;

    const nameCol = data.headers.find(h =>
      ['nama', 'person', 'petugas', 'teknisi'].some(k => h.toLowerCase().includes(k))
    );
    const shiftCol = data.headers.find(h =>
      ['shift', 'waktu', 'periode'].some(k => h.toLowerCase().includes(k))
    );
    const activityCol = data.headers.find(h =>
      ['pekerjaan', 'aktivitas', 'kegiatan'].some(k => h.toLowerCase().includes(k))
    );
    const typeCol = data.headers.find(h =>
      ['jenis', 'tipe', 'status', 'kategori'].some(k => h.toLowerCase().includes(k))
    );
    const dateCol = data.headers.find(h =>
      ['tanggal', 'date', 'hari'].some(k => h.toLowerCase().includes(k))
    );

    const nameStats = nameCol ? _.countBy(data.rows, nameCol) : null;
    const shiftStats = shiftCol ? _.countBy(data.rows, shiftCol) : null;
    const activityStats = activityCol ? _.countBy(data.rows, activityCol) : null;
    const typeStats = typeCol ? _.countBy(data.rows, typeCol) : null;

    let timelineData: any[] = [];
    if (dateCol) {
      const groups = _.groupBy(data.rows, dateCol);
      timelineData = Object.entries(groups)
        .map(([date, items]) => ({ date, count: items.length }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      timelineData = data.rows.map((_, i) => ({ date: `Data ${i + 1}`, count: 1 }));
    }

    return {
      total: data.rows.length,
      names: nameStats ? Object.entries(nameStats).map(([name, count]) => ({ name, count })) : [],
      shifts: shiftStats ? Object.entries(shiftStats).map(([name, count]) => ({ name, count })) : [],
      activities: activityStats ? Object.entries(activityStats).map(([name, count]) => ({ name, count })) : [],
      types: typeStats ? Object.entries(typeStats).map(([name, count]) => ({ name, count })) : [],
      timeline: timelineData,
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#141414] font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="font-black text-2xl tracking-tighter text-blue-900 leading-none">TVRI Lampung</h1>
            <p className="text-xs text-blue-600 font-bold mt-1 tracking-wide">Transmisi Simpang Pematang</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="https://hanifferra.github.io/laporan-shift/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-700 border border-blue-200 px-8 py-3 rounded-2xl text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/10 active:scale-95 whitespace-nowrap h-fit"
            >
              <FileSpreadsheet size={16} />
              <span>Input Data</span>
            </a>
            <button
              onClick={() => handleLoadData()}
              disabled={loading || !sheetUrl}
              className="bg-[#1D4ED8] text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-blue-800 disabled:opacity-50 disabled:bg-gray-400 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95 whitespace-nowrap h-fit"
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              <span>{loading ? 'Sinkron...' : 'Update Data'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3 shadow-sm"
            >
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!data ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full" />
              <div className="relative bg-white p-8 rounded-3xl border border-blue-100 shadow-2xl">
                {loading ? (
                  <RefreshCw size={64} className="text-blue-600 animate-spin" />
                ) : (
                  <FileSpreadsheet size={64} className="text-blue-600" />
                )}
              </div>
            </div>
            <div className="max-w-md">
              <h2 className="text-2xl font-bold tracking-tight font-sans mb-2">
                {loading ? 'Memuat Data...' : 'Siap Terhubung'}
              </h2>
              <p className="text-slate-500">
                {loading
                  ? 'Mengkoneksikan dasbor dengan Google Sheets secara otomatis.'
                  : error
                    ? 'Gagal memuat data. Mohon muat ulang halaman.'
                    : 'Mengambil data dari spreadsheet...'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Laporan" value={stats?.total || 0} icon={<Activity size={20} />} color="bg-white" />
              <StatCard label="Kontributor" value={stats?.names.length || 0} icon={<Users size={20} />} color="bg-white" />
              <StatCard label="Variasi Shift" value={stats?.shifts.length || 0} icon={<Clock size={20} />} color="bg-white" />
              <StatCard label="Entri Baru" value={filteredRows.length} icon={<Calendar size={20} />} color="bg-white" />
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                <div className="space-y-2 max-w-sm">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Sparkles size={20} />
                    <span className="text-xs font-mono uppercase tracking-[0.2em] font-semibold">Gemini AI Engine</span>
                  </div>
                  <h3 className="text-2xl font-bold font-serif italic text-blue-100">Analisis Laporan</h3>
                  <p className="text-blue-200/60 text-sm">Gemini AI mengolah narasi laporan untuk menemukan poin-poin krusial dalam operasional harian.</p>
                  <button
                    onClick={getAiSummary}
                    disabled={loadingAi}
                    className="mt-4 bg-white text-blue-900 px-8 py-3 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-blue-50 hover:scale-105 transition-all disabled:opacity-50 shadow-xl shadow-black/20"
                  >
                    {loadingAi ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    <span>{loadingAi ? 'Menganalisis...' : 'Refresh Analisis'}</span>
                  </button>
                </div>
                <div className="flex-grow w-full bg-black/20 border border-white/10 p-8 rounded-[2rem] min-h-[160px] backdrop-blur-md">
                  {loadingAi ? (
                    <div className="flex flex-col items-center justify-center min-h-[150px] space-y-4">
                      <div className="flex gap-2">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 bg-blue-400 rounded-full" />
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-3 h-3 bg-blue-400 rounded-full" />
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-3 h-3 bg-blue-400 rounded-full" />
                      </div>
                      <p className="text-xs font-mono text-blue-200/40 uppercase tracking-widest">Memproses Data Transmisi...</p>
                    </div>
                  ) : aiSummary ? (
                    <div className="markdown-body text-blue-50/90 text-[15px] leading-loose max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-8 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="mb-8 space-y-4 list-disc pl-5">{children}</ul>,
                          li: ({ children }) => <li className="text-blue-100/80">{children}</li>,
                        }}
                      >
                        {aiSummary}
                      </ReactMarkdown>
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

            {/* Main Tabs */}
            <div className="space-y-6">
              <div className="flex gap-1 bg-slate-200 p-1 rounded-xl w-fit">
                <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Dashboard Visual" />
                <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')} label="Tabel Data" />
              </div>

              {activeTab === 'overview' ? (
                <div className="space-y-10">
                  {/* Daily Review */}
                  {data && data.rows.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                          <Calendar size={20} className="text-blue-600" />
                          Logbook Harian
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">Klik tanggal untuk review detail</p>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-blue-100">
                        {_.uniq(
                          data.rows
                            .map(r => r[data.headers.find(h => h.toLowerCase().includes('tanggal')) || ''])
                            .filter(Boolean)
                        )
                          .sort()
                          .reverse()
                          .map(date => (
                            <button
                              key={date}
                              onClick={() => setSelectedDate(date)}
                              className={cn(
                                'px-5 py-3 rounded-2xl shrink-0 transition-all font-bold text-sm',
                                selectedDate === date
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                  : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                              )}
                            >
                              {date}
                            </button>
                          ))}
                      </div>

                      <AnimatePresence mode="wait">
                        {selectedDate && (
                          <motion.div
                            key={selectedDate}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                          >
                            {/* Left: Activities */}
                            <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-xl shadow-blue-900/5">
                              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                <div>
                                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-blue-600 mb-1">Aktivitas Hari Ini</p>
                                  <h5 className="text-2xl font-black text-slate-800 tracking-tight">{selectedDate}</h5>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
                                  <Clock size={12} className="text-blue-500" />
                                  <span>{getDailySummary(selectedDate)?.shifts.join(', ') || 'N/A'}</span>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {getDailySummary(selectedDate)?.entries.map((entry, i) => (
                                  <div key={i} className="group relative pl-8 pb-6 border-l-2 border-blue-50 last:pb-0">
                                    <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-400 group-hover:border-blue-600 transition-colors shadow-sm" />
                                    <div className="space-y-2">
                                      {/* Numbered list pekerjaan */}
                                      <ol className="space-y-1 list-none">
                                        {entry.activityList.map((item, idx) => (
                                          <li key={idx} className="text-sm text-slate-800 font-bold leading-relaxed flex gap-2">
                                            <span className="text-blue-400 font-mono text-xs mt-0.5 shrink-0 w-5">{idx + 1}.</span>
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ol>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                        <p className="text-xs text-slate-500 font-medium">
                                          <span className="text-emerald-600 font-bold text-[10px] uppercase mr-2 tracking-tighter">Hasil:</span>
                                          {entry.action}
                                        </p>
                                        <span className="text-[10px] text-slate-300 font-mono">[{entry.time}]</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {!getDailySummary(selectedDate)?.entries.length && (
                                  <div className="py-12 text-center text-slate-300 italic text-sm">
                                    Data pekerjaan tidak tersedia
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Side Panel */}
                            <div className="lg:col-span-4 space-y-6">
                              {/* Personnel */}
                              <div className="bg-slate-50 p-6 rounded-[2rem] border border-blue-50/50">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-4">Petugas Piket</p>
                                <div className="flex flex-wrap gap-2">
                                  {getDailySummary(selectedDate)?.personnel.map((p, i) => (
                                    <span key={i} className="px-3 py-1 bg-white text-blue-700/80 rounded-xl text-[10px] font-black border border-blue-100 shadow-sm">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Disturbances */}
                              {(getDailySummary(selectedDate)?.disturbances.length || 0) > 0 ||
                                (getDailySummary(selectedDate)?.obstacles.length || 0) > 0 ? (
                                <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100/50">
                                  <p className="text-[10px] uppercase font-bold tracking-widest text-red-500 mb-4 flex items-center gap-2">
                                    <AlertCircle size={14} /> Status & Kendala
                                  </p>
                                  <div className="space-y-3">
                                    {getDailySummary(selectedDate)?.disturbances.map((d, i) => (
                                      <div key={i} className="bg-white/80 p-3 rounded-2xl border border-red-100">
                                        <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Gangguan</p>
                                        <p className="text-xs text-slate-700 font-medium">{d}</p>
                                      </div>
                                    ))}
                                    {getDailySummary(selectedDate)?.obstacles.map((o, i) => (
                                      <div key={i} className="bg-white/80 p-3 rounded-2xl border border-orange-100">
                                        <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Kendala Lapangan</p>
                                        <p className="text-xs text-slate-700 font-medium">{o}</p>
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

                              {/* Notes */}
                              {getDailySummary(selectedDate)?.notes.length ? (
                                <div className="bg-amber-50/30 p-6 rounded-[2rem] border border-amber-100/50">
                                  <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600 mb-4 flex items-center gap-2">
                                    <MessageSquare size={14} /> Catatan Khusus
                                  </p>
                                  <ul className="space-y-3">
                                    {getDailySummary(selectedDate)?.notes.map((note, i) => (
                                      <li key={i} className="text-xs text-slate-600 italic leading-relaxed bg-white/60 p-4 rounded-3xl border border-amber-50">
                                        {note}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {/* Chart 1: Kontributor */}
                    {stats?.names.length ? (
                      <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm col-span-1 lg:col-span-2">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h4 className="font-bold text-xl flex items-center gap-2 text-slate-800 tracking-tight">
                              <Activity size={20} className="text-blue-600" />
                              Kinerja Kontributor Transmisi
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 font-medium">Berdasarkan frekuensi laporan harian di sistem</p>
                          </div>
                        </div>
                        <div className="h-[350px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.names.sort((a, b) => b.count - a.count)}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: '500' }} />
                              <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{ fill: '#94a3b8' }} />
                              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '16px' }} />
                              <Bar dataKey="count" fill="#1D4ED8" radius={[14, 14, 4, 4]} barSize={40} label={{ position: 'top', fill: '#1e3a8a', fontSize: 10, fontWeight: 'bold' }} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : null}

                    {/* Chart 2: Shift */}
                    {stats?.shifts.length ? (
                      <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <h4 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                            <Clock size={20} className="text-blue-600" />
                            Alokasi Waktu (Shift)
                          </h4>
                        </div>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={stats.shifts} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="count" stroke="none">
                                {stats.shifts.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                              <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : null}

                    {/* Chart 3: Types */}
                    {stats?.types.length ? (
                      <div className="bg-white p-8 rounded-[2.5rem] border border-blue-50 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <h4 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                            <Filter size={20} className="text-blue-600" />
                            Klasifikasi Aktivitas
                          </h4>
                        </div>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.types}
                                cx="50%" cy="50%"
                                innerRadius={0} outerRadius={85}
                                dataKey="count"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                stroke="white" strokeWidth={2}
                              >
                                {stats.types.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-blue-50 shadow-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-grow max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                      <input
                        type="text"
                        placeholder="Cari data pekerjaan..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-transparent focus:bg-white rounded-xl text-sm outline-none border border-transparent focus:border-blue-200 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Menampilkan {filteredRows.length} baris data (Penyaringan Aktif)
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-blue-100">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-[#1D4ED8] text-white">
                        <tr>
                          {displayHeaders.map((header, idx) => (
                            <th key={idx} className="p-4 text-xs font-mono uppercase tracking-wider sticky top-0 bg-[#1D4ED8] z-20">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50 transition-colors group">
                            {displayHeaders.map((header, hIdx) => (
                              <td key={hIdx} className="p-4 text-xs text-slate-700">
                                <div className="max-w-[300px] truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:relative z-10 transition-all">
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

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div
      whileHover={{ y: -5, borderColor: '#BFDBFE' }}
      className={cn('p-6 rounded-3xl border border-blue-50 shadow-sm relative overflow-hidden transition-all', color)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{icon}</div>
      </div>
      <div>
        <p className="text-xs font-mono uppercase tracking-[0.1em] text-slate-400 mb-1">{label}</p>
        <p className="text-3xl font-bold font-sans leading-none tracking-tighter text-blue-950">{value}</p>
      </div>
    </motion.div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300',
        active ? 'bg-white text-blue-700 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-blue-600 hover:bg-white/50'
      )}
    >
      {label}
    </button>
  );
}
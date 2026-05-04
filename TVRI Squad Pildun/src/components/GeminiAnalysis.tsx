import React from 'react';
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { AccentColor, accents } from '../types';

export default function GeminiAnalysis({ accentColor }: { accentColor: AccentColor }) {
  const theme = accents[accentColor];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 ${theme.primary} opacity-5 blur-3xl rounded-full`}></div>
      
      <div className="flex items-center gap-2 mb-6">
        <div className={`p-2 rounded-xl ${theme.lightBg} border ${theme.border}`}>
          <Sparkles className={`w-5 h-5 ${theme.text}`} />
        </div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Analisis Gemini AI</h3>
      </div>

      <div className="space-y-4 flex-1">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-inner">
          <p>
            Berdasarkan data minggu ini, kampanye konten di <strong>TikTok</strong> menghasilkan engagement teringgi, dengan peningkatan <span className="font-bold text-emerald-600 dark:text-emerald-400">18.5%</span> dalam total shares. 
            Disarankan untuk memperbanyak konten video vertikal.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-bold">Rekomendasi</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Fokus pada tutorial singkat di TikTok.</p>
          </div>
          <div className="flex-1 p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-bold">Waspada</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Engagement LinkedIn turun 5% minggu lalu.</p>
          </div>
        </div>
        
        <div className="p-4 mt-auto rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">
           <h4 className="font-semibold text-sm mb-1">AI Insight Generated</h4>
           <p className="text-xs text-slate-400">Analisis berdasarkan 1,420 data upload terbaru.</p>
        </div>
      </div>
    </div>
  );
}

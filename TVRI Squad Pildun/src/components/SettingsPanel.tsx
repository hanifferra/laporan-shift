import React from 'react';
import { Moon, Sun, Monitor, CheckCircle2 } from 'lucide-react';
import { AccentColor, ThemeMode, accents } from '../types';

interface SettingsPanelProps {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (a: AccentColor) => void;
}

export default function SettingsPanel({ theme, setTheme, accentColor, setAccentColor }: SettingsPanelProps) {
  const defaultTheme = accents[accentColor];

  return (
    <div className="max-w-2xl mx-auto w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pengaturan Aplikasi</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kustomisasi tampilan dan preferensi sistem Anda.</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Theme Toggle */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Mode Tema</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Terang', icon: Sun },
              { id: 'dark', label: 'Gelap', icon: Moon },
              { id: 'system', label: 'Sistem', icon: Monitor },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as ThemeMode)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    isActive 
                      ? `${defaultTheme.border} ${defaultTheme.lightBg} ${defaultTheme.text}` 
                      : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color Selection */}
        <div>
           <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Warna Aksesn (Accent Color)</h3>
           <div className="flex gap-4">
             {[
               { id: 'blue', colorClass: 'bg-indigo-600' },
               { id: 'purple', colorClass: 'bg-purple-600' },
               { id: 'green', colorClass: 'bg-emerald-600' },
               { id: 'red', colorClass: 'bg-rose-600' },
             ].map((c) => {
               const isActive = accentColor === c.id;
               return (
                  <button
                    key={c.id}
                    onClick={() => setAccentColor(c.id as AccentColor)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${c.colorClass} ${
                      isActive ? 'ring-4 ring-offset-2 ring-slate-200 dark:ring-slate-700 scale-110' : 'hover:scale-105'
                    }`}
                  >
                    {isActive && <CheckCircle2 className="w-6 h-6 text-white" />}
                  </button>
               )
             })}
           </div>
        </div>

      </div>
    </div>
  );
}

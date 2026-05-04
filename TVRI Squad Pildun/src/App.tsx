import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Upload,
  Image as ImageIcon, 
  Settings, 
  Menu,
  X
} from 'lucide-react';

import { stats, mockGallery } from './data';
import { ThemeMode, AccentColor, accents } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Components
import StatsCards from './components/StatsCards';
import UploadForm from './components/UploadForm';
import GeminiAnalysis from './components/GeminiAnalysis';
import GalleryGrid from './components/GalleryGrid';
import SwipeGallery from './components/SwipeGallery';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Upload Bukti', icon: Upload },
    { name: 'Gallery', icon: ImageIcon },
    { name: 'Settings', icon: Settings },
  ];

  // Theme observer
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const activeAccent = accents[accentColor];

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('Laporan Performa Media Sosial', 14, 22);

    // Date
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const currentDate = new Date().toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Tanggal Cetak: ${currentDate}`, 14, 30);

    // Table Data
    const tableRows = mockGallery.map(item => [
      item.date,
      item.platform,
      item.likes,
      item.comments,
      '-', // Shares
      '-', // Saves
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Tanggal", "Platform", "Likes", "Comments", "Shares", "Saves"]],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [79, 70, 229] } // Indigo 600
    });

    doc.save('Laporan_Buzzer_Tracker.pdf');
  };

  // Main content rendering
  const renderContent = () => {
    if (activeMenu === 'Settings') {
      return (
        <div className="flex-1 flex items-center justify-center py-10">
          <SettingsPanel 
            theme={theme} 
            setTheme={setTheme} 
            accentColor={accentColor} 
            setAccentColor={setAccentColor} 
          />
        </div>
      );
    }

    if (activeMenu === 'Gallery') {
      return (
        <div className="flex-1 min-h-0 flex flex-col pt-4">
           {/* Hide StatsCards in Gallery view */}
           <SwipeGallery items={mockGallery} />
        </div>
      );
    }

    return (
      <>
        <StatsCards 
          stats={stats} 
          className={activeMenu === 'Upload Bukti' ? 'hidden md:grid' : ''} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0 pb-8 lg:pb-0">
          {/* Left Column (1/3) */}
          <div className="lg:col-span-1 w-full">
            {activeMenu === 'Dashboard' ? (
              <GeminiAnalysis accentColor={accentColor} />
            ) : (
              <UploadForm accentColor={accentColor} />
            )}
          </div>

          {/* Right Column (2/3) */}
          <div className={`lg:col-span-2 ${activeMenu === 'Upload Bukti' ? 'hidden md:block' : ''}`}>
            <GalleryGrid items={mockGallery} />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 flex font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className={`w-8 h-8 ${activeAccent.primary} rounded-lg flex items-center justify-center transition-colors`}>
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SocialDash</span>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveMenu(item.name);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive 
                      ? `${activeAccent.lightBg} ${activeAccent.text}` 
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? activeAccent.text : 'text-slate-400 dark:text-slate-500'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <div className={`w-10 h-10 rounded-full ${activeAccent.primary} border-2 border-white dark:border-slate-800 shadow-sm shrink-0 flex items-center justify-center text-white font-bold text-sm tracking-wide`}>
              RF
            </div>
            <div className="flex flex-col text-left overflow-hidden min-w-0 flex-1">
              <span className="text-sm font-semibold truncate text-slate-900 dark:text-white">Rizkyana Ferrari</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate w-full">ferrarizkyana@gmail.com</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-auto p-4 sm:p-8 gap-8 transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-row justify-between items-center shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-white">
                TVRI Squad Piala Dunia 2026
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Dashboard
              </p>
            </div>
          </div>
          {activeMenu !== 'Gallery' && activeMenu !== 'Settings' && (
            <button 
              onClick={handleExportPDF}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm font-medium text-xs md:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white shrink-0 whitespace-nowrap"
            >
              Export Data
            </button>
          )}
        </div>

        {renderContent()}
      </main>
    </div>
  );
}

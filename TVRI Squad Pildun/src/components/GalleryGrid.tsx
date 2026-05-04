import React from 'react';
import { ThumbsUp, MessageCircle } from 'lucide-react';
import { GalleryItem } from '../types';

interface GalleryGridProps {
  items: GalleryItem[];
}

export default function GalleryGrid({ items }: GalleryGridProps) {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Riwayat Upload</h3>
        <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">Lihat Semua</button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => {
          let pColor = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
          if (item.platform === 'Instagram') pColor = 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
          if (item.platform === 'TikTok') pColor = 'bg-black text-white dark:bg-slate-700 dark:text-white';
          if (item.platform === 'Twitter' || item.platform === 'Twitter / X') pColor = 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400';
          if (item.platform === 'Facebook') pColor = 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
          if (item.platform === 'YouTube') pColor = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';

          return (
            <div key={item.id} className="group relative border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-800">
              <div className="aspect-video w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${pColor}`}>
                    {item.platform}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{item.date}</span>
                </div>
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                  {item.title}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1"><ThumbsUp className="w-3 h-3"/> {item.likes}</div>
                  <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3"/> {item.comments}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

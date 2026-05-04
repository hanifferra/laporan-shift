import React from 'react';
import { ThumbsUp, MessageCircle, Share2, Bookmark } from 'lucide-react';

interface StatsCardsProps {
  stats: any[];
  className?: string;
}

export default function StatsCards({ stats, className = '' }: StatsCardsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 shrink-0 ${className}`}>
      {stats.map((stat, i) => {
        const isPositive = stat.trend.startsWith('+');
        return (
          <div key={i} className="bg-white dark:bg-slate-800 p-3 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
            <div className="flex flex-col xl:flex-row xl:items-end justify-between mt-2 gap-1 md:gap-0">
              <h2 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h2>
              <span className={`w-max text-[10px] md:text-xs font-bold px-2 py-0.5 md:py-1 rounded-full ${
                isPositive 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
              }`}>
                {stat.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

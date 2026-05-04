import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ThumbsUp, MessageCircle, X, Heart } from 'lucide-react';
import { GalleryItem } from '../types';

interface SwipeGalleryProps {
  items: GalleryItem[];
}

export default function SwipeGallery({ items }: SwipeGalleryProps) {
  const [cards, setCards] = useState(items);
  const [leaveX, setLeaveX] = useState(0);

  const removeCard = (id: number, action: 'like' | 'nope') => {
    setLeaveX(action === 'like' ? 1000 : -1000);
    setTimeout(() => {
      setCards(prev => prev.filter(c => c.id !== id));
      setLeaveX(0); // reset
    }, 200);
  };

  const handleDragEnd = (event: any, info: PanInfo, id: number) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > 100 || velocity > 500) {
      removeCard(id, 'like');
    } else if (offset < -100 || velocity < -500) {
      removeCard(id, 'nope');
    }
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tidak Ada Kartu Lagi</h2>
        <button 
          onClick={() => setCards(items)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Mulai Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      <div className="relative w-80 h-[420px] perspectiv-1000">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const isFront = index === cards.length - 1;
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ 
                  scale: index === cards.length - 1 ? 1 : index === cards.length - 2 ? 0.95 : 0.9, 
                  opacity: index >= cards.length - 3 ? 1 : 0,
                  y: index === cards.length - 1 ? 0 : index === cards.length - 2 ? -20 : -40,
                  zIndex: index
                }}
                exit={{ 
                  x: leaveX, 
                  opacity: 0, 
                  scale: 0.5, 
                  transition: { duration: 0.2 } 
                }}
                drag={isFront ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, info) => handleDragEnd(e, info, card.id)}
                className="absolute top-0 left-0 w-full h-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-grab active:cursor-grabbing flex flex-col"
              >
                <div className="h-3/5 w-full bg-slate-200 dark:bg-slate-700 relative pointer-events-none">
                  <img src={card.image} alt={card.title} className="w-full h-full object-cover select-none" draggable={false} />
                  <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
                    {card.platform}
                  </div>
                </div>
                <div className="p-5 flex flex-col justify-between flex-1 pointer-events-none">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{card.title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{card.date}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4"/> <span className="font-medium">{card.likes}</span></div>
                    <div className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4"/> <span className="font-medium">{card.comments}</span></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-6 mt-10">
        <button 
          onClick={() => removeCard(cards[cards.length - 1].id, 'nope')}
          className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm text-ros-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all active:scale-95 text-rose-500"
        >
          <X className="w-8 h-8" strokeWidth={3} />
        </button>
        <button 
          onClick={() => removeCard(cards[cards.length - 1].id, 'like')}
          className="w-16 h-16 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all active:scale-95 text-emerald-500"
        >
          <Heart className="w-8 h-8 fill-emerald-500 text-emerald-500" strokeWidth={0} />
        </button>
      </div>
    </div>
  );
}

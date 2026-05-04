export type AccentColor = 'blue' | 'purple' | 'green' | 'red';
export type ThemeMode = 'light' | 'dark' | 'system';

export type GalleryItem = {
  id: number;
  title: string;
  platform: string;
  image: string;
  likes: string | number;
  comments: string | number;
  date: string;
};

export const accents = {
  blue: { 
    primary: 'bg-indigo-600', 
    primaryHover: 'hover:bg-indigo-700', 
    text: 'text-indigo-600', 
    lightBg: 'bg-indigo-50 dark:bg-indigo-900/30',
    border: 'border-indigo-200 dark:border-indigo-800'
  },
  purple: { 
    primary: 'bg-purple-600', 
    primaryHover: 'hover:bg-purple-700', 
    text: 'text-purple-600', 
    lightBg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800'
  },
  green: { 
    primary: 'bg-emerald-600', 
    primaryHover: 'hover:bg-emerald-700', 
    text: 'text-emerald-600', 
    lightBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  red: { 
    primary: 'bg-rose-600', 
    primaryHover: 'hover:bg-rose-700', 
    text: 'text-rose-600', 
    lightBg: 'bg-rose-50 dark:bg-rose-900/30',
    border: 'border-rose-200 dark:border-rose-800'
  },
};

import { ThumbsUp, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { GalleryItem } from './types';

export const stats = [
  { label: 'Total Likes', value: '124,563', trend: '+12.5%', icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/40 dark:text-blue-400' },
  { label: 'Total Comments', value: '12,284', trend: '+5.2%', icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { label: 'Total Shares', value: '5,832', trend: '+18.1%', icon: Share2, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-400' },
  { label: 'Total Saves', value: '24,105', trend: '-2.4%', icon: Bookmark, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/40 dark:text-rose-400' },
];

export const mockGallery: GalleryItem[] = [
  { id: 1, title: 'Summer Campaign', platform: 'Instagram', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=400&h=300', likes: '1.2k', comments: '45', date: '2 hours ago' },
  { id: 2, title: 'Product Launch', platform: 'TikTok', image: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&q=80&w=400&h=300', likes: '3.5k', comments: '200', date: '5 hours ago' },
  { id: 3, title: 'Updates Announcement', platform: 'Twitter / X', image: 'https://images.unsplash.com/photo-1611605698323-b1e96faaecbfa?auto=format&fit=crop&q=80&w=400&h=300', likes: '800', comments: '12', date: '1 day ago' },
  { id: 4, title: 'Hiring Post', platform: 'Facebook', image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=400&h=300', likes: '450', comments: '80', date: '2 days ago' },
  { id: 5, title: 'Behind the Scenes', platform: 'Instagram', image: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&q=80&w=400&h=300', likes: '2.1k', comments: '120', date: '3 days ago' },
  { id: 6, title: 'Feature Spotlight', platform: 'YouTube', image: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?auto=format&fit=crop&q=80&w=400&h=300', likes: '5.6k', comments: '430', date: '4 days ago' },
];

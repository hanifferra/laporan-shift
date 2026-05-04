import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { accents, AccentColor } from '../types';

export default function UploadForm({ accentColor }: { accentColor: AccentColor }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form State
  const [platform, setPlatform] = useState('Instagram');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [saves, setSaves] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Tolong unggah gambar bukti terlebih dahulu!');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('platform', platform);
      formData.append('likes', likes);
      formData.append('comments', comments);
      formData.append('shares', shares);
      formData.append('saves', saves);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload');
      }

      setIsSuccess(true);
      // Reset form
      setLikes('');
      setComments('');
      setShares('');
      setSaves('');
      setFile(null);
      
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat mengunggah: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const themeColors = accents[accentColor];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-5">Upload Bukti</h3>
      
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Platform</label>
            <select 
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
            >
              <option>Instagram</option>
              <option>TikTok</option>
              <option>Twitter / X</option>
              <option>Facebook</option>
              <option>YouTube</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bukti Gambar</label>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden" 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors bg-white dark:bg-slate-800 group`}
            >
              {file ? (
                <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  File terpilih: {file.name}
                </div>
              ) : (
                <>
                  <Upload className={`mx-auto h-10 w-10 text-slate-300 dark:text-slate-500 group-hover:${themeColors.text} transition-colors`} />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Click to upload or drag & drop</p>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Likes</label>
              <input type="number" value={likes} onChange={e => setLikes(e.target.value)} placeholder="0" className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Comments</label>
              <input type="number" value={comments} onChange={e => setComments(e.target.value)} placeholder="0" className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shares</label>
              <input type="number" value={shares} onChange={e => setShares(e.target.value)} placeholder="0" className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Saves</label>
              <input type="number" value={saves} onChange={e => setSaves(e.target.value)} placeholder="0" className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isUploading || isSuccess}
          className={`mt-auto w-full py-3 ${themeColors.primary} text-white rounded-xl font-bold shadow-lg shadow-indigo-200/50 dark:shadow-none hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70`}
        >
          {isUploading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Mengunggah...</>
          ) : isSuccess ? (
            <><CheckCircle2 className="w-5 h-5" /> Berhasil Disimpan</>
          ) : (
            'Simpan Data'
          )}
        </button>
      </form>
    </div>
  );
}

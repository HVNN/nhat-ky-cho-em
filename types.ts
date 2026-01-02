export interface User {
  username: string;
  isAdmin: boolean;
  avatarColor: string;
}

// Cập nhật key của mood sang theme thời tiết
export type MoodType = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'starry' | 'flower' | 'leaf' | 'rainbow';

export interface DiaryEntry {
  id: string;
  username: string;
  title?: string; // Thêm tiêu đề cho bài viết
  content: string;
  mood: MoodType;
  createdAt: string; // ISO String
}

export type Page = 'home' | 'login' | 'register' | 'write' | 'admin';

// Bộ icon Thời tiết & Thiên nhiên
export const MOODS: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⚡',
  starry: '✨',
  flower: '🌻',
  leaf: '🍂',
  rainbow: '🌈',
};

// Nhãn hiển thị tâm trạng ngắn gọn
export const MOOD_LABELS: Record<string, string> = {
  sunny: 'Vui Vẻ',
  cloudy: 'Bình Yên',
  rainy: 'Buồn',
  stormy: 'Giận Dữ',
  starry: 'Hy Vọng',
  flower: 'Hạnh Phúc',
  leaf: 'Mệt Mỏi',
  rainbow: 'Tuyệt Vời',
};

export const PASTEL_COLORS = [
  'bg-red-100',
  'bg-orange-100',
  'bg-amber-100',
  'bg-yellow-100',
  'bg-lime-100',
  'bg-green-100',
  'bg-emerald-100',
  'bg-teal-100',
  'bg-cyan-100',
  'bg-sky-100',
  'bg-blue-100',
  'bg-indigo-100',
  'bg-violet-100',
  'bg-purple-100',
  'bg-fuchsia-100',
  'bg-pink-100',
  'bg-rose-100',
];
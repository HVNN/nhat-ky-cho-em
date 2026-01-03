export interface User {
  username: string;
  isAdmin: boolean;
  avatarColor: string;
}

// Cập nhật key của mood sang theme thời tiết và cảm xúc
export type MoodType = 'rainbow' | 'starry' | 'sunny' | 'flower' | 'thinking' | 'cloudy' | 'leaf' | 'rainy' | 'stormy';

export interface DiaryEntry {
  id: string;
  username: string;
  title?: string;
  content: string;
  mood: MoodType;
  createdAt: string; // ISO String
}

export type Page = 'home' | 'login' | 'register' | 'write' | 'admin';

// Bộ icon Thời tiết & Thiên nhiên - Sắp xếp theo phổ cảm xúc từ tích cực đến tiêu cực
export const MOODS: Record<string, string> = {
  rainbow: '🌈', // Tuyệt vời/Hạnh phúc nhất
  sunny: '☀️',   // Vui vẻ
  flower: '🌻',   // Yêu đời
  starry: '✨',   // Hy vọng/Lung linh
  thinking: '💭', // Suy ngẫm (Đã đổi từ 🤔 sang 💭)
  cloudy: '☁️',   // Bình thường/Trầm tư
  leaf: '🍂',     // Mệt mỏi/Rơi rụng
  rainy: '🌧️',   // Buồn/Mưa rơi
  stormy: '⛈️',   // Giông bão/Căng thẳng
};

export const MOOD_LABELS: Record<string, string> = {
  rainbow: 'Tuyệt Vời',
  sunny: 'Vui Vẻ',
  flower: 'Hạnh Phúc',
  starry: 'Hy Vọng',
  thinking: 'Suy Ngẫm',
  cloudy: 'Bình Yên',
  leaf: 'Mệt Mỏi',
  rainy: 'Buồn',
  stormy: 'Giông Bão',
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
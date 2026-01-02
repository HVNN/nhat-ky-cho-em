import { DiaryEntry, User, PASTEL_COLORS, MoodType, MOODS } from '../types';
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const SUPABASE_URL = 
  env.VITE_SUPABASE_SUPABASE_URL || 
  env.VITE_SUPABASE_VITE_PUBLIC_SUPABASE_URL ||
  env.VITE_SUPABASE_URL || 
  env.VITE_PUBLIC_SUPABASE_URL;

const SUPABASE_KEY = 
  env.VITE_SUPABASE_VITE_PUBLIC_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY || 
  env.VITE_SUPABASE_KEY || 
  env.VITE_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (error) {
      console.error('❌ Lỗi khởi tạo Supabase:', error);
  }
}

const USERS_KEY = 'diary_users';
const ENTRIES_KEY = 'diary_entries';
const CURRENT_USER_KEY = 'diary_current_user';

export const getConnectionType = (): 'SUPABASE' | 'LOCAL_STORAGE' => {
    return supabase ? 'SUPABASE' : 'LOCAL_STORAGE';
};

export const initStorage = async () => {
  if (supabase) return;
  const storedUsers = localStorage.getItem(USERS_KEY);
  if (!storedUsers) {
    const dummyUsers: User[] = [{ username: 'Saitama', isAdmin: true, avatarColor: 'bg-rose-200' }];
    localStorage.setItem(USERS_KEY, JSON.stringify(dummyUsers));
  }
};

export const getUsers = async (): Promise<User[]> => {
  if (supabase) {
    const { data } = await supabase.from('users').select('*');
    return data || [];
  }
  const usersStr = localStorage.getItem(USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
};

export const registerUser = async (username: string): Promise<{ success: boolean; message: string }> => {
  const randomColor = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
  if (supabase) {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const shouldBeAdmin = count === 0;
    const { data: existing } = await supabase.from('users').select('*').eq('username', username).single();
    if (existing) return { success: false, message: 'Tên này đã có người dùng rồi!' };
    const newUser: User = { username, isAdmin: shouldBeAdmin, avatarColor: randomColor };
    const { error } = await supabase.from('users').insert([newUser]);
    if (error) return { success: false, message: 'Lỗi Server: ' + error.message };
    return { success: true, message: shouldBeAdmin ? 'Đăng ký thành công! Bạn là Admin.' : 'Đăng ký thành công!' };
  }
  const users = await getUsers();
  const shouldBeAdmin = users.length === 0;
  users.push({ username, isAdmin: shouldBeAdmin, avatarColor: randomColor });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true, message: 'Đăng ký thành công!' };
};

export const loginUser = async (username: string): Promise<User | null> => {
  if (supabase) {
    const { data } = await supabase.from('users').select('*').eq('username', username).single();
    if (data) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
    return data;
  }
  const users = await getUsers();
  const user = users.find(u => u.username === username);
  if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user || null;
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const logoutUser = () => localStorage.removeItem(CURRENT_USER_KEY);

export const getEntries = async (): Promise<DiaryEntry[]> => {
  if (supabase) {
    const { data } = await supabase.from('entries').select('*').order('createdAt', { ascending: false });
    return data || [];
  }
  const entriesStr = localStorage.getItem(ENTRIES_KEY);
  return entriesStr ? JSON.parse(entriesStr) : [];
};

export const addEntry = async (entry: DiaryEntry) => {
  if (supabase) {
    await supabase.from('entries').insert([entry]);
    return;
  }
  const entries = await getEntries();
  entries.unshift(entry);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
};

export const deleteEntry = async (id: string) => {
  if (supabase) {
    await supabase.from('entries').delete().eq('id', id);
    return;
  }
  const entries = await getEntries();
  const newEntries = entries.filter(e => e.id !== id);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(newEntries));
};

export const clearAllData = async (excludeUsername?: string) => {
    if (supabase) {
        await supabase.from('entries').delete().not('id', 'is', null);
        await supabase.from('users').delete().eq('isAdmin', false);
        return;
    }
    localStorage.removeItem(ENTRIES_KEY);
    const users = await getUsers();
    const adminUsers = users.filter(u => u.isAdmin);
    localStorage.setItem(USERS_KEY, JSON.stringify(adminUsers));
};

/**
 * Hàm tạo dữ liệu mẫu để test giao diện
 */
export const seedData = async () => {
    const sampleUsers = [
        { username: 'Mây Lang Thang', avatarColor: 'bg-sky-100' },
        { username: 'Nắng Mùa Hạ', avatarColor: 'bg-amber-100' },
        { username: 'Mưa Tháng Sáu', avatarColor: 'bg-indigo-100' },
        { username: 'Gió Heo May', avatarColor: 'bg-teal-100' }
    ];

    const sampleContents = [
        { title: "Một buổi chiều trà", content: "Hôm nay mình ngồi ở quán cà phê quen thuộc, ngắm nhìn dòng người qua lại. Cảm giác thật bình yên...", mood: "cloudy" },
        { title: "Gặp lại người bạn cũ", content: "Sau 5 năm, chúng mình vẫn như ngày đầu. Cười nói vang cả một góc phố.", mood: "sunny" },
        { title: "Ngày mưa rơi tầm tã", content: "Tiếng mưa gõ trên mái hiên làm mình nhớ về những kỷ niệm ngày xưa. Có chút buồn nhưng cũng thật nhẹ lòng.", mood: "rainy" },
        { title: "Thành công nhỏ", content: "Cuối cùng dự án cũng hoàn thành! Mình tự hào về bản thân quá đi thôi ✨", mood: "starry" },
        { title: "Hành trình mới", content: "Bắt đầu một công việc mới, có chút lo lắng nhưng cũng đầy hy vọng.", mood: "leaf" },
        { title: "Cơn giông bất chợt", content: "Mọi thứ diễn ra không như ý muốn. Đôi khi cuộc sống thật mệt mỏi...", mood: "stormy" },
        { title: "Cầu vồng sau mưa", content: "Mọi chuyện rồi sẽ ổn thôi. Luôn có ánh sáng ở phía cuối con đường.", mood: "rainbow" },
        { title: "Vườn hoa nhỏ", content: "Sáng nay mình vừa trồng thêm vài khóm hoa trước cửa. Mong chúng sẽ sớm nở rộ.", mood: "flower" }
    ];

    const moodKeys = Object.keys(MOODS) as MoodType[];

    // 1. Đăng ký các user mẫu
    for (const u of sampleUsers) {
        if (supabase) {
            const { data: existing } = await supabase.from('users').select('*').eq('username', u.username).single();
            if (!existing) await supabase.from('users').insert([{ ...u, isAdmin: false }]);
        } else {
            const users = await getUsers();
            if (!users.find(exist => exist.username === u.username)) {
                users.push({ ...u, isAdmin: false });
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
            }
        }
    }

    // 2. Tạo 15 bài viết rải rác trong 10 ngày qua
    const allUsers = [...sampleUsers.map(u => u.username), 'Saitama'];
    for (let i = 0; i < 15; i++) {
        const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
        const randomContent = sampleContents[Math.floor(Math.random() * sampleContents.length)];
        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 10)); // Lùi về 0-10 ngày trước
        
        const entry: DiaryEntry = {
            id: crypto.randomUUID(),
            username: randomUser,
            title: randomContent.title + " (Mẫu)",
            content: randomContent.content + "\n(Đây là dữ liệu mẫu được tạo tự động để bạn kiểm tra giao diện nhật ký)",
            mood: randomContent.mood as MoodType,
            createdAt: randomDate.toISOString()
        };
        await addEntry(entry);
    }
};

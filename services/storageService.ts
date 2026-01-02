import { DiaryEntry, User, PASTEL_COLORS, MoodType } from '../types';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// ⚠️ QUAN TRỌNG: BẠN CẦN CHẠY CODE SQL SAU TRONG SUPABASE SQL EDITOR ⚠️
// ============================================================================
/*
-- 1. Tạo bảng Users
CREATE TABLE IF NOT EXISTS public.users (
  username text PRIMARY KEY,
  "isAdmin" boolean DEFAULT false,
  "avatarColor" text
);

-- 2. Tạo bảng Entries
CREATE TABLE IF NOT EXISTS public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text REFERENCES public.users(username) ON DELETE CASCADE,
  title text,
  content text,
  mood text,
  "createdAt" timestamptz DEFAULT now()
);

-- 3. Bật bảo mật (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- 4. Tạo Policy (Mở quyền truy cập cho App)
CREATE POLICY "Public Access Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Entries" ON public.entries FOR ALL USING (true) WITH CHECK (true);

-- 💡 MẸO: ĐỂ BIẾN MỘT USER THÀNH ADMIN THỦ CÔNG:
-- UPDATE public.users SET "isAdmin" = true WHERE username = 'Tên_Của_Bạn';
*/
// ============================================================================

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
      console.log('✅ Đã kết nối Supabase Client');
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
  const usersCount = storedUsers ? JSON.parse(storedUsers).length : 0;

  if (usersCount < 1) {
    const dummyUsers: User[] = [
      { username: 'Saitama', isAdmin: true, avatarColor: 'bg-rose-200' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(dummyUsers));
  }
};

export const getUsers = async (): Promise<User[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*');
    if (error) return [];
    return data || [];
  }
  const usersStr = localStorage.getItem(USERS_KEY);
  return usersStr ? JSON.parse(usersStr) : [];
};

export const registerUser = async (username: string): Promise<{ success: boolean; message: string }> => {
  const randomColor = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
  
  if (supabase) {
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (countError && countError.code === '42P01') {
        return { success: false, message: 'Lỗi: Chưa tạo bảng Users!' };
    }

    const shouldBeAdmin = count === 0;

    const { data: existing } = await supabase.from('users').select('*').eq('username', username).single();
    if (existing) return { success: false, message: 'Tên này đã có người dùng rồi!' };
    
    const newUser: User = { username, isAdmin: shouldBeAdmin, avatarColor: randomColor };
    const { error } = await supabase.from('users').insert([newUser]);
    
    if (error) return { success: false, message: 'Lỗi Server: ' + error.message };
    
    return { 
        success: true, 
        message: shouldBeAdmin ? 'Đăng ký thành công! Bạn là Admin đầu tiên.' : 'Đăng ký thành công!' 
    };
  }

  const users = await getUsers();
  if (users.find(u => u.username === username)) {
    return { success: false, message: 'Username đã tồn tại rồi nè!' };
  }
  const shouldBeAdmin = users.length === 0;
  users.push({ username, isAdmin: shouldBeAdmin, avatarColor: randomColor });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true, message: 'Đăng ký thành công!' };
};

export const loginUser = async (username: string): Promise<User | null> => {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error) return null;
    if (data) {
       localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
       return data;
    }
    return null;
  }

  const users = await getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getEntries = async (): Promise<DiaryEntry[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('entries').select('*').order('createdAt', { ascending: false });
    if (error) return [];
    return data || [];
  }
  const entriesStr = localStorage.getItem(ENTRIES_KEY);
  return entriesStr ? JSON.parse(entriesStr) : [];
};

export const addEntry = async (entry: DiaryEntry) => {
  if (supabase) {
    const { error } = await supabase.from('entries').insert([entry]);
    if (error) alert("Lỗi: " + error.message);
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

/**
 * Xoá sạch dữ liệu:
 * 1. Xoá tất cả bài viết (Entries).
 * 2. Xoá tất cả người dùng THƯỜNG (isAdmin = false).
 * 3. Giữ lại tất cả Admin.
 */
export const clearAllData = async (excludeUsername?: string) => {
    if (supabase) {
        // 1. Xoá toàn bộ nhật ký
        const { error: err1 } = await supabase.from('entries').delete().not('id', 'is', null);
        if (err1) console.error("Lỗi xoá entries:", err1);

        // 2. Xoá toàn bộ user thường (isAdmin = false)
        // Điều này đảm bảo các tài khoản admin luôn được giữ lại
        const { error: err2 } = await supabase.from('users').delete().eq('isAdmin', false);
        if (err2) console.error("Lỗi xoá users:", err2);
        
        return;
    }

    // Local Storage logic
    localStorage.removeItem(ENTRIES_KEY);
    
    const users = await getUsers();
    // Chỉ giữ lại những ai là Admin
    const adminUsers = users.filter(u => u.isAdmin);
    
    if (adminUsers.length > 0) {
        localStorage.setItem(USERS_KEY, JSON.stringify(adminUsers));
    } else if (excludeUsername) {
        // Trường hợp hy hữu không có admin nào, giữ lại user hiện tại
        const currentUserObj = users.find(u => u.username === excludeUsername);
        if (currentUserObj) {
            localStorage.setItem(USERS_KEY, JSON.stringify([currentUserObj]));
        }
    } else {
        localStorage.removeItem(USERS_KEY);
    }
};

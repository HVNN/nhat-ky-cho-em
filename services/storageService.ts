import { DiaryEntry, User, PASTEL_COLORS, MoodType } from '../types';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// HƯỚNG DẪN TẠO BẢNG TRÊN SUPABASE (SQL EDITOR)
// Copy đoạn code dưới đây và chạy trong SQL Editor của Supabase để tạo bảng:
/*
-- 1. Tạo bảng Users
create table users (
  username text primary key,
  "isAdmin" boolean default false,
  "avatarColor" text
);

-- 2. Tạo bảng Entries
create table entries (
  id uuid primary key default gen_random_uuid(),
  username text references users(username),
  title text,
  content text,
  mood text,
  "createdAt" timestamptz default now()
);

-- 3. (Tùy chọn) Bật RLS nếu cần bảo mật cao hơn, 
-- nhưng với app cá nhân đơn giản thì có thể bỏ qua bước này hoặc set policy public.
*/
// ============================================================================

// Lấy config từ biến môi trường (.env)
// Lưu ý: Cần restart lại server dev sau khi thay đổi file .env
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key] || '';
  }
  return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL'); 
const SUPABASE_KEY = getEnv('VITE_SUPABASE_KEY'); 

let supabase: any = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

const USERS_KEY = 'diary_users';
const ENTRIES_KEY = 'diary_entries';
const CURRENT_USER_KEY = 'diary_current_user';

// --- INIT ---
export const initStorage = async () => {
  if (supabase) return;

  // --- SEED USERS ---
  const storedUsers = localStorage.getItem(USERS_KEY);
  const usersCount = storedUsers ? JSON.parse(storedUsers).length : 0;

  // Nếu ít user (dữ liệu cũ), thêm danh sách user phong phú hơn
  if (usersCount < 10) {
    const dummyUsers: User[] = [
      { username: 'Saitama', isAdmin: true, avatarColor: 'bg-rose-200' },
      { username: 'Mây', isAdmin: false, avatarColor: 'bg-sky-200' },
      { username: 'Gió', isAdmin: false, avatarColor: 'bg-emerald-200' },
      { username: 'Nắng', isAdmin: false, avatarColor: 'bg-amber-200' },
      { username: 'Mưa', isAdmin: false, avatarColor: 'bg-indigo-200' },
      { username: 'Cỏ_Ba_Lá', isAdmin: false, avatarColor: 'bg-lime-200' },
      { username: 'Gấu_Bông', isAdmin: false, avatarColor: 'bg-orange-200' },
      { username: 'Mèo_Mướp', isAdmin: false, avatarColor: 'bg-yellow-200' },
      { username: 'Thỏ_Trắng', isAdmin: false, avatarColor: 'bg-pink-200' },
      { username: 'Sóc_Nâu', isAdmin: false, avatarColor: 'bg-red-200' },
      { username: 'Nhím_Xù', isAdmin: false, avatarColor: 'bg-slate-200' },
      { username: 'Cáo_Nhỏ', isAdmin: false, avatarColor: 'bg-orange-300' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(dummyUsers));
  }
  
  // --- SEED ENTRIES ---
  const storedEntries = localStorage.getItem(ENTRIES_KEY);
  const entriesCount = storedEntries ? JSON.parse(storedEntries).length : 0;

  // Nếu ít nhật ký (< 20 bài), tự động sinh thêm 50 bài để test load more
  if (entriesCount < 20) {
    const now = new Date();
    const subDays = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    const subHours = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

    // Các bài mẫu cố định
    let dummyEntries: DiaryEntry[] = [
      {
        id: '1',
        username: 'Saitama',
        title: 'Lời mở đầu',
        content: 'Chào mừng đến với cuốn nhật ký chung. Hãy viết những điều trong lòng nhé. Nơi đây sẽ lưu giữ những kỷ niệm đẹp nhất của chúng ta.',
        mood: 'rainbow',
        createdAt: now.toISOString(),
      },
      {
        id: '2',
        username: 'Mây',
        title: 'Một chiều bình yên',
        content: 'Hôm nay bầu trời thật xanh, những đám mây trôi lững lờ làm mình nhớ đến những ngày tháng cũ. Đôi khi, chỉ cần ngồi yên và ngắm nhìn thế giới cũng là một loại hạnh phúc.',
        mood: 'cloudy',
        createdAt: subHours(2), 
      },
      {
        id: '3',
        username: 'Gió',
        title: 'Xong Deadline rồi!',
        content: 'Chạy deadline muốn xỉu nhưng mà vui! Cuối cùng cũng hoàn thành xong dự án quan trọng. Tự thưởng cho bản thân một ly trà sữa full topping nha.',
        mood: 'starry',
        createdAt: subHours(5),
      },
      {
        id: '4',
        username: 'Nắng',
        title: 'Ngày mưa buồn',
        content: 'Có những ngày mưa tầm tã làm lòng mình cũng ướt sũng theo. \n\n"Em về, mưa lạnh đôi vai\nLối xưa vắng vẻ, gót hài in sâu..."\n\nNhớ một người không nên nhớ.',
        mood: 'rainy',
        createdAt: subDays(1),
      },
      {
        id: '5',
        username: 'Mây',
        title: 'Gửi cậu',
        content: 'Gửi cậu, người đang đọc dòng này.\n\nHãy nhớ rằng dù hôm nay có tồi tệ đến đâu, ngày mai mặt trời vẫn sẽ mọc. Cố lên nhé!',
        mood: 'flower',
        createdAt: subDays(1),
      },
    ];

    // Sinh thêm 50 bài ngẫu nhiên
    const sampleMoods: MoodType[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'starry', 'flower', 'leaf', 'rainbow'];
    const sampleUsers = ['Mây', 'Gió', 'Nắng', 'Mưa', 'Cỏ_Ba_Lá', 'Gấu_Bông', 'Mèo_Mướp', 'Thỏ_Trắng', 'Sóc_Nâu', 'Nhím_Xù', 'Cáo_Nhỏ'];
    const sampleContents = [
        "Hôm nay trời đẹp quá, mình đi dạo công viên.",
        "Mệt mỏi với công việc, chỉ muốn ngủ một giấc thật dài.",
        "Nghe được một bài hát hay, cảm thấy yêu đời hẳn.",
        "Nhớ lại chuyện cũ, lòng chợt buồn man mác.",
        "Ăn một món ngon, hạnh phúc đơn giản là đây.",
        "Gặp lại bạn cũ, nói chuyện cười đau cả bụng.",
        "Trời mưa rồi, không biết ai đó có mang dù không.",
        "Deadline dí chạy không kịp thở, cứu tôi với!",
        "Hôm nay mình đã làm được một việc tốt.",
        "Cảm thấy lạc lõng giữa phố đông người.",
        "Mong chờ chuyến đi sắp tới quá đi mất.",
        "Đôi khi chỉ cần một cái ôm là đủ.",
        "Học được một điều mới mẻ hôm nay.",
        "Tại sao mọi thứ lại khó khăn thế này?",
        "Tự thưởng cho bản thân một ly trà sữa.",
        "Thức dậy sớm đón bình minh, không khí thật trong lành.",
        "Đọc một cuốn sách hay, ngẫm ra được nhiều điều.",
        "Trồng thêm một cái cây nhỏ ngoài ban công.",
        "Nấu một bữa ăn ngon chiêu đãi cả nhà.",
        "Chỉ muốn nằm lười cả ngày không làm gì cả."
    ];

    for (let i = 0; i < 50; i++) {
        const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
        const randomMood = sampleMoods[Math.floor(Math.random() * sampleMoods.length)];
        const randomContent = sampleContents[Math.floor(Math.random() * sampleContents.length)];
        // Random ngày trong khoảng 60 ngày gần đây
        const daysAgo = Math.floor(Math.random() * 60); 
        
        dummyEntries.push({
            id: `seed-${i + 10}`,
            username: randomUser,
            title: `Chuyện ngày ${60 - daysAgo}`,
            content: randomContent,
            mood: randomMood,
            createdAt: subDays(daysAgo),
        });
    }

    // Sắp xếp lại theo thời gian giảm dần
    dummyEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    localStorage.setItem(ENTRIES_KEY, JSON.stringify(dummyEntries));
  }
};

// --- USER OPERATIONS ---
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
  const newUser: User = { username, isAdmin: false, avatarColor: randomColor };

  if (supabase) {
    const { data: existing } = await supabase.from('users').select('*').eq('username', username).single();
    if (existing) return { success: false, message: 'Tên này đã có người dùng rồi!' };
    
    const { error } = await supabase.from('users').insert([newUser]);
    if (error) return { success: false, message: 'Lỗi kết nối server: ' + error.message };
    return { success: true, message: 'Đăng ký thành công!' };
  }

  // LocalStorage Fallback
  const users = await getUsers();
  if (users.find(u => u.username === username)) {
    return { success: false, message: 'Username đã tồn tại rồi nè!' };
  }
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { success: true, message: 'Đăng ký thành công!' };
};

export const loginUser = async (username: string): Promise<User | null> => {
  if (supabase) {
    const { data } = await supabase.from('users').select('*').eq('username', username).single();
    if (data) {
       localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data));
       return data;
    }
    return null;
  }

  // LocalStorage
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

// --- DIARY OPERATIONS ---
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
    const { id, ...entryData } = entry; 
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
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, DiaryEntry, Page, MOODS, MOOD_LABELS, MoodType, PASTEL_COLORS } from './types';
import * as storage from './services/storageService';
import Navbar from './components/Navbar';
import TreeTimeline from './components/TreeTimeline';
import { Search, Heart, Sparkles, Cloud, Star, ArrowDownWideNarrow, ArrowUpWideNarrow, Loader2, ArrowUp, SlidersHorizontal, Calendar as CalendarIcon, Trash2, Database, Wifi, WifiOff, Wand2, Edit3 } from 'lucide-react';
import { ConfigProvider, Button, Input, Select, DatePicker, message, Spin, Modal, Tooltip, Tag, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi'; 

// Fix for Ant Design DatePicker
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

dayjs.locale('vi');

const customTheme = {
  token: {
    colorPrimary: '#f43f5e',
    fontFamily: "'Quicksand', sans-serif",
    borderRadius: 16,
    colorText: '#352b25',
  },
  components: {
    Button: {
      fontWeight: 700,
    },
    Input: {
      paddingBlock: 10,
    },
    Select: {
      controlHeight: 42,
    },
    DatePicker: {
        controlHeight: 42,
    },
    Modal: {
        contentBg: '#fffdf5',
        headerBg: '#fffdf5',
    }
  }
};

const ITEMS_PER_PAGE = 10;

// Component hiển thị bóng bay bay lơ lửng ở background
const BalloonsBackground: React.FC = () => {
    // Giảm số lượng bóng bay xuống
    const balloonCount = 6;
    
    const balloons = useMemo(() => {
        return [...Array(balloonCount)].map((_, i) => ({
            id: i,
            color: PASTEL_COLORS[i % PASTEL_COLORS.length],
            // Random hóa các tham số animation
            delay: Math.random() * 15, // Thời gian trễ khi bắt đầu
            duration: 25 + Math.random() * 15, // Tốc độ bay lên (càng lớn càng chậm)
            swayDuration: 3 + Math.random() * 2, // Tốc độ lắc lư của thân bóng
            stringDuration: 1.5 + Math.random(), // Tốc độ đung đưa của dây
            left: Math.random() * 60 - 10, // Vị trí xuất phát (thiên về bên trái màn hình)
            scale: 0.7 + Math.random() * 0.4, // Kích thước to nhỏ khác nhau
        }));
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {balloons.map((b) => (
                <div
                    key={b.id}
                    className="absolute opacity-0 animate-balloon-rise"
                    style={{
                        left: `${b.left}%`,
                        // bottom được xử lý bởi keyframes, ở đây chỉ set giá trị ban đầu để tránh flash
                        animationDelay: `${b.delay}s`,
                        animationDuration: `${b.duration}s`,
                        transform: `scale(${b.scale})`,
                    }}
                >
                    {/* Container này chịu trách nhiệm lắc lư qua lại nhẹ nhàng */}
                    <div 
                        className="animate-balloon-wobble" 
                        style={{ animationDuration: `${b.swayDuration}s` }}
                    >
                        {/* Thân bóng bay: Bo tròn hơn (gần như tròn) nhưng hơi cao hơn rộng một chút */}
                        <div className={`w-20 h-24 rounded-[50%_50%_50%_50%_/_40%_40%_60%_60%] relative shadow-inner ${b.color} border border-white/20`}>
                            {/* Vệt sáng trên bóng */}
                            <div className="absolute top-4 left-4 w-4 h-8 bg-white/30 rounded-full rotate-[20deg] blur-[1px]"></div>
                        </div>

                        {/* Phần dây và thư: Đung đưa mạnh hơn như con lắc trước gió */}
                        <div 
                            className="absolute bottom-0 left-1/2 w-0 h-0 animate-string-swing"
                            style={{ animationDuration: `${b.stringDuration}s` }}
                        >
                            {/* Nút thắt ngay dưới bóng */}
                            <div className="absolute -top-1 -left-1.5 w-3 h-2 bg-inherit opacity-80 rounded-sm"></div>
                            
                            {/* Sợi dây dài */}
                            <div className="absolute top-0 left-[-0.5px] w-[1px] h-24 bg-stone-400/40"></div>
                            
                            {/* Phong thư nhỏ treo ở cuối dây */}
                            <div className="absolute top-24 left-[-10px] w-5 h-4 bg-white border border-stone-200 shadow-sm rotate-6 origin-top flex items-center justify-center">
                                <Heart size={8} className="text-rose-400 fill-rose-400" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // Fallback if randomUUID fails (e.g. insecure context)
        }
    }
    return 'id-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('home');
  const [users, setUsers] = useState<User[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  
  const [connectionType, setConnectionType] = useState<'SUPABASE' | 'LOCAL_STORAGE'>('LOCAL_STORAGE');
  const [usernameInput, setUsernameInput] = useState('');
  
  // Create/Edit Entry States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [diaryContent, setDiaryContent] = useState('');
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryDate, setDiaryDate] = useState<dayjs.Dayjs>(dayjs());
  const [selectedMood, setSelectedMood] = useState<MoodType>('rainbow');

  // Filters & Sorting & Pagination
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<dayjs.Dayjs | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('asc');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [showFloatingControls, setShowFloatingControls] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
    setConnectionType(storage.getConnectionType());

    const handleScroll = () => {
        if (window.scrollY > 200) {
            setShowFloatingControls(true);
        } else {
            setShowFloatingControls(false);
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filterUser, filterDate, sortOrder]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await storage.initStorage();
      const loadedUser = storage.getCurrentUser();
      setCurrentUser(loadedUser);
      await refreshData();
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    const [fetchedUsers, fetchedEntries] = await Promise.all([
      storage.getUsers(),
      storage.getEntries()
    ]);
    setUsers(fetchedUsers);
    setEntries(fetchedEntries);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    
    setLoading(true);
    const user = await storage.loginUser(usernameInput.trim());
    setLoading(false);

    if (user) {
      setCurrentUser(user);
      setUsernameInput('');
      setPage('home');
      messageApi.success({
        content: `Chào mừng ${user.username} quay trở lại!`,
        icon: <span className="text-xl">🌸</span>
      });
    } else {
      messageApi.error('Không tìm thấy người dùng này.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    setLoading(true);
    const result = await storage.registerUser(usernameInput.trim());
    
    if (result.success) {
      const user = await storage.loginUser(usernameInput.trim());
      setCurrentUser(user);
      setUsernameInput('');
      setPage('home');
      await refreshData();
      messageApi.success({
         content: result.message,
         icon: <span className="text-xl">✨</span>
      });
    } else {
      messageApi.error(result.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    storage.logoutUser();
    setCurrentUser(null);
    setPage('home');
    messageApi.info('Đã đăng xuất. Hẹn gặp lại nhé!');
  };

  const resetWriteForm = () => {
      setDiaryContent('');
      setDiaryTitle('');
      setDiaryDate(dayjs());
      setSelectedMood('rainbow');
      setEditingId(null);
  };

  const handleSaveEntry = async () => {
    if (!currentUser || !diaryContent.trim()) {
        messageApi.warning('Hãy viết gì đó vào nhật ký nhé!');
        return;
    }

    setLoading(true);
    
    try {
        const finalDateTime = diaryDate;
        const finalTitle = diaryTitle.trim() ? diaryTitle.trim() : `Ngày ${finalDateTime.format('DD/MM/YYYY')}`;

        if (editingId) {
            await storage.updateEntry(editingId, {
                title: finalTitle,
                content: diaryContent,
                mood: selectedMood,
                createdAt: finalDateTime.toISOString()
            });
            messageApi.success('Đã cập nhật dòng tâm sự...');
        } else {
            const newEntry: DiaryEntry = {
              id: generateId(),
              username: currentUser.username,
              title: finalTitle,
              content: diaryContent,
              mood: selectedMood,
              createdAt: finalDateTime.toISOString()
            };
            await storage.addEntry(newEntry);
            messageApi.success('Đã lưu lại dòng tâm sự mới...');
        }

        resetWriteForm();
        await refreshData();
        setPage('home');
    } catch (error: any) {
        console.error("Save error:", error);
        messageApi.error('Lỗi khi lưu bài viết: ' + (error.message || 'Lỗi không xác định'));
    } finally {
        setLoading(false);
    }
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setDiaryTitle(entry.title || '');
    setDiaryContent(entry.content);
    setDiaryDate(dayjs(entry.createdAt));
    setSelectedMood(entry.mood);
    setPage('write');
  };

  const handleDeleteEntry = async (id: string) => {
    setLoading(true);
    try {
        await storage.deleteEntry(id);
        await refreshData();
        messageApi.success('Đã xóa dòng nhật ký.');
    } catch (error: any) {
        messageApi.error('Lỗi khi xóa: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
        await storage.clearAllData(currentUser.username);
        await refreshData();
        messageApi.success('Đã xóa sạch dữ liệu cũ!');
    } catch (error: any) {
        messageApi.error('Lỗi khi xóa dữ liệu: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setLoading(true);
    try {
        await storage.seedData();
        await refreshData();
        messageApi.success('Đã tạo 15 trang nhật ký mẫu! ✨');
    } catch (error: any) {
        messageApi.error('Lỗi khi tạo dữ liệu mẫu: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const processedEntries = useMemo(() => {
    let result = entries.filter(entry => {
        const matchUser = filterUser ? entry.username === filterUser : true;
        const matchDate = filterDate ? entry.createdAt.startsWith(filterDate.format('YYYY-MM-DD')) : true;
        return matchUser && matchDate;
    });
    result.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
    return result;
  }, [entries, filterUser, filterDate, sortOrder]);

  const visibleEntries = processedEntries.slice(0, visibleCount);
  const hasMore = visibleCount < processedEntries.length;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setTimeout(() => {
            setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
          }, 300);
        }
      },
      { threshold: 0.5 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [hasMore, visibleCount]); 

  const activeFilterCount = (filterUser ? 1 : 0) + (filterDate ? 1 : 0);

  return (
    <ConfigProvider theme={customTheme}>
        <div className="min-h-screen pb-32 text-ink bg-warm relative overflow-x-hidden">
        {contextHolder}
        
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute top-20 -left-10 text-sky-100 animate-float" style={{ animationDuration: '8s' }}>
                <Cloud size={180} fill="currentColor" />
            </div>
            <div className="absolute bottom-40 -right-10 text-rose-50 animate-float" style={{ animationDelay: '2s', animationDuration: '10s' }}>
                <Cloud size={220} fill="currentColor" />
            </div>
            <div className="absolute top-40 right-20 text-yellow-100 animate-spin-slow">
                <Star size={40} fill="currentColor" />
            </div>
            <div className="absolute bottom-20 left-20 text-purple-100 animate-pulse">
                <Sparkles size={50} fill="currentColor" />
            </div>
            
            {/* Hiệu ứng bóng bay */}
            <BalloonsBackground />
        </div>

        <Navbar 
            currentUser={currentUser} 
            setCurrentPage={(p) => { 
                if (p === 'write') resetWriteForm();
                setPage(p); 
            }} 
            onLogout={handleLogout}
            activePage={page}
        />

        <main className="container mx-auto px-4 pt-6 relative z-10">
            
            {loading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[70] flex items-center justify-center">
                    <Spin size="large" />
                </div>
            )}

            {(page === 'home' || page === 'admin') && (
            <>
                <div className="max-w-6xl mx-auto animate-fade-in-up">
                    <div className="text-center mb-6">
                        <h1 className="font-hand text-5xl md:text-6xl text-ink mb-3 font-bold drop-shadow-sm">
                        {page === 'admin' ? 'Quản Lý Ký Ức' : 'Góc Nhỏ Tâm Sự'}
                        </h1>
                        <p className="text-ink-light text-lg font-medium flex items-center justify-center gap-3">
                        <Sparkles size={18} className="text-yellow-500 fill-yellow-500 animate-pulse"/>
                        Nơi lưu giữ nỗi nhớ bé Hỏ
                        <Sparkles size={18} className="text-yellow-500 fill-yellow-500 animate-pulse"/>
                        </p>

                        {page === 'admin' && (
                            <div className="mt-6 flex flex-wrap justify-center items-center gap-4">
                                <div className="inline-flex items-center h-[42px] gap-3 bg-white px-5 rounded-full shadow-sm border border-stone-200">
                                    <span className="text-sm font-bold text-stone-500 uppercase tracking-wider">Trạng thái:</span>
                                    {connectionType === 'SUPABASE' ? (
                                        <Tag color="green" className="m-0 flex items-center gap-1.5 font-bold px-3 py-1 text-sm rounded-full border-0 bg-green-50 text-green-600">
                                            <Wifi size={16} /> Database (Supabase)
                                        </Tag>
                                    ) : (
                                        <Tag color="orange" className="m-0 flex items-center gap-1.5 font-bold px-3 py-1 text-sm rounded-full border-0 bg-orange-50 text-orange-600">
                                            <WifiOff size={16} /> Local Storage
                                        </Tag>
                                    )}
                                </div>

                                <Button 
                                    onClick={handleSeedData}
                                    type="default" 
                                    shape="round" 
                                    size="large"
                                    icon={<Wand2 size={18} className="text-sky-500" />}
                                    className="shadow-md h-[42px] border-stone-200 flex items-center hover:!border-sky-400 hover:!text-sky-600"
                                >
                                    Dữ liệu mẫu ✨
                                </Button>

                                <Popconfirm
                                    title="Xóa sạch dữ liệu?"
                                    description="Hành động này sẽ xóa toàn bộ nhật ký."
                                    onConfirm={handleClearAllData}
                                    okText="Xóa hết đi"
                                    cancelText="Thôi đừng"
                                    okButtonProps={{ danger: true, size: 'large' }}
                                >
                                    <Button 
                                        danger 
                                        type="primary" 
                                        shape="round" 
                                        size="large"
                                        icon={<Trash2 size={18} />}
                                        className="shadow-md animate-sparkle-hover h-[42px] border-none flex items-center"
                                    >
                                        Xóa toàn bộ dữ liệu cũ
                                    </Button>
                                </Popconfirm>
                            </div>
                        )}
                    </div>

                    <div className="mb-8 py-2 px-4 transition-all duration-300">
                        <div className="bg-white/60 p-3 rounded-2xl border border-stone-200 max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 shadow-sm">
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <Search size={18} className="text-stone-400" />
                                <Select
                                    placeholder="Chọn người viết"
                                    style={{ width: 180 }}
                                    allowClear
                                    value={filterUser}
                                    onChange={(val) => setFilterUser(val)}
                                    options={[
                                        {value: '', label: 'Tất cả mọi người'}, 
                                        ...users.filter(u => !u.isAdmin).map(u => ({ value: u.username, label: u.username }))
                                    ]}
                                    bordered={false}
                                    className="bg-transparent hover:bg-white rounded-xl transition-colors"
                                />
                            </div>
                            <div className="w-full md:w-auto">
                                <DatePicker 
                                    placeholder="Chọn ngày..."
                                    format="DD/MM/YYYY"
                                    value={filterDate}
                                    onChange={(date) => setFilterDate(date)}
                                    className="w-full md:w-auto bg-transparent hover:bg-white border-none rounded-xl h-[42px] transition-colors"
                                />
                            </div>
                            <div className="w-full md:w-auto">
                                <Select
                                    value={sortOrder}
                                    onChange={(val) => setSortOrder(val)}
                                    options={[
                                        { value: 'desc', label: <span className="flex items-center gap-2"><ArrowDownWideNarrow size={16}/> Mới nhất</span> },
                                        { value: 'asc', label: <span className="flex items-center gap-2"><ArrowUpWideNarrow size={16}/> Cũ nhất</span> },
                                    ]}
                                    bordered={false}
                                    className="bg-transparent hover:bg-white rounded-xl w-full md:w-[140px] transition-colors"
                                />
                            </div>
                            {(filterUser || filterDate) && (
                                <Button type="link" danger onClick={() => {setFilterUser(null); setFilterDate(null);}}>Xóa bộ lọc</Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        <TreeTimeline 
                            entries={visibleEntries} 
                            users={users} 
                            currentUser={currentUser}
                            onDelete={handleDeleteEntry}
                            onEdit={handleEditEntry}
                            sortOrder={sortOrder}
                        />
                    </div>

                    {hasMore && (
                    <div ref={loadMoreRef} className="flex justify-center items-center py-8 opacity-70">
                        <div className="bg-white/80 p-2 px-4 rounded-full shadow-sm flex items-center gap-2 text-stone-500 font-hand text-lg animate-pulse">
                            <Loader2 className="animate-spin" size={20} />
                            Đang tìm lại ký ức cũ...
                        </div>
                    </div>
                    )}
                </div>

                <div className={`fixed bottom-8 right-6 z-[60] flex flex-col gap-4 items-end transition-all duration-500 transform ${showFloatingControls ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-10 invisible pointer-events-none'}`}>
                    <Tooltip title="Bộ lọc & Sắp xếp" placement="left">
                        <Button
                            type="primary"
                            shape="circle"
                            size="large"
                            className="w-14 h-14 shadow-comic hover:shadow-comic-hover bg-rose-400 hover:!bg-rose-500 flex items-center justify-center border-2 border-stone-800 transition-all transform hover:-translate-y-1 animate-sparkle-hover"
                            onClick={() => setIsFilterModalOpen(true)}
                        >
                            <div className="relative">
                                <SlidersHorizontal size={24} color="white" />
                                {activeFilterCount > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 text-stone-800 text-xs rounded-full flex items-center justify-center font-bold border border-stone-800 shadow-sm">{activeFilterCount}</span>}
                            </div>
                        </Button>
                    </Tooltip>
                    <Tooltip title="Lên đầu trang" placement="left">
                        <Button
                            type="default"
                            shape="circle"
                            size="large"
                            className="w-14 h-14 shadow-comic hover:shadow-comic-hover bg-yellow-200 hover:!bg-yellow-300 border-2 border-stone-800 text-stone-800 flex items-center justify-center transition-all transform hover:-translate-y-1"
                            onClick={scrollToTop}
                        >
                            <ArrowUp size={24} />
                        </Button>
                    </Tooltip>
                </div>

                <Modal
                    title={<div className="font-hand text-2xl text-rose-500 text-center w-full">✨ Tìm kiếm kỷ niệm ✨</div>}
                    open={isFilterModalOpen}
                    onCancel={() => setIsFilterModalOpen(false)}
                    footer={[
                        <Button key="clear" danger type="text" onClick={() => {setFilterUser(null); setFilterDate(null); setIsFilterModalOpen(false);}}>Xóa bộ lọc</Button>,
                        <Button key="submit" type="primary" onClick={() => setIsFilterModalOpen(false)} className="bg-stone-800 rounded-lg">Xong</Button>
                    ]}
                    centered width={350} closeIcon={null} className="modal-cute"
                >
                    <div className="flex flex-col gap-4 py-4">
                        <div>
                            <label className="block text-stone-500 font-bold mb-2 flex items-center gap-2"><Search size={16} /> Người viết</label>
                            <Select
                                placeholder="Chọn người viết" style={{ width: '100%' }} allowClear value={filterUser} onChange={(val) => setFilterUser(val)}
                                options={[{value: '', label: 'Tất cả mọi người'}, ...users.filter(u => !u.isAdmin).map(u => ({ value: u.username, label: u.username }))]}
                            />
                        </div>
                        <div>
                            <label className="block text-stone-500 font-bold mb-2 flex items-center gap-2"><CalendarIcon size={16} /> Ngày viết</label>
                            <DatePicker placeholder="Chọn ngày..." format="DD/MM/YYYY" value={filterDate} onChange={(date) => setFilterDate(date)} className="w-full" />
                        </div>
                        <div>
                            <label className="block text-stone-500 font-bold mb-2 flex items-center gap-2"><ArrowDownWideNarrow size={16} /> Sắp xếp</label>
                            <Select value={sortOrder} onChange={(val) => setSortOrder(val)} options={[{ value: 'desc', label: 'Mới nhất trước' }, { value: 'asc', label: 'Cũ nhất trước' }]} className="w-full" />
                        </div>
                    </div>
                </Modal>
            </>
            )}

            {(page === 'login' || page === 'register') && (
            <div className="flex justify-center items-center min-h-[60vh] animate-fade-in-up">
                <div className="bg-paper p-10 rounded-[2rem] shadow-comic border-2 border-stone-800 max-w-lg w-full relative overflow-visible transform transition-all duration-300 hover:-translate-y-2 hover:shadow-comic-hover">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-rose-200/80 rotate-3 washi-tape"></div>
                <h2 className="text-5xl font-bold text-center mb-8 text-ink relative z-10 font-hand mt-4">{page === 'login' ? 'Vào Nhà' : 'Đăng Ký Sổ'}</h2>
                <form onSubmit={page === 'login' ? handleLogin : handleRegister} className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-base font-bold text-ink-light mb-2">Tên bí danh của bạn</label>
                        <Input size="large" placeholder="Ví dụ: Mây Lang Thang" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} prefix={<span className="text-xl">🪴</span>} className="rounded-xl border-2 border-stone-200" />
                    </div>
                    <Button type="primary" htmlType="submit" block size="large" className="bg-stone-800 hover:!bg-stone-900 h-14 text-lg rounded-xl shadow-lg border-none animate-sparkle-hover" loading={loading}>{page === 'login' ? 'Mở cửa' : 'Tạo sổ mới'}</Button>
                </form>
                <div className="mt-8 text-center relative z-10 border-t-2 border-dashed border-stone-200 pt-6">
                    <Button type="link" onClick={() => {setPage(page === 'login' ? 'register' : 'login'); setUsernameInput('');}} className="text-rose-600 font-bold">{page === 'login' ? 'Chưa có sổ? Đăng ký ngay' : 'Đã có sổ rồi? Đăng nhập'}</Button>
                </div>
                </div>
            </div>
            )}

            {page === 'write' && (
            <div className="max-w-4xl mx-auto animate-fade-in-up">
                <div className="lined-paper min-h-[80vh] p-8 md:p-16 rounded-lg shadow-comic border border-stone-300 relative transform transition-transform hover:-translate-y-1">
                <div className="absolute left-12 md:left-20 top-0 bottom-0 w-px bg-rose-300 opacity-60 pointer-events-none"></div>
                <div className="absolute top-4 right-4 text-yellow-400 opacity-80 animate-wiggle-hover"><Star size={40} fill="currentColor" /></div>
                <div className="ml-8 md:ml-12 flex flex-col items-start mb-8 pb-4 relative z-10">
                    <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="w-full md:w-2/3">
                            <input type="text" placeholder="Tiêu đề nhật ký..." value={diaryTitle} onChange={(e) => setDiaryTitle(e.target.value)} className="w-full bg-transparent border-b-2 border-dashed border-stone-300 font-hand text-3xl text-ink font-bold placeholder:text-stone-300 focus:outline-none focus:border-rose-400 pb-2 transition-colors" />
                             <div className="mt-2 flex items-center gap-2">
                                <span className="text-stone-500 font-hand text-xl">Thời gian:</span>
                                <DatePicker 
                                    value={diaryDate} 
                                    onChange={(date) => setDiaryDate(date || dayjs())} 
                                    format="DD/MM/YYYY HH:mm" 
                                    showTime={{ format: 'HH:mm' }}
                                    allowClear={false} 
                                    className="bg-transparent border-none shadow-none font-hand text-lg text-rose-500 font-bold p-0 cursor-pointer hover:bg-stone-50 px-2 rounded-lg" 
                                    style={{ color: '#f43f5e' }}
                                />
                             </div>
                        </div>
                         <div className="text-5xl animate-float self-end md:self-center">{MOODS[selectedMood]}</div>
                    </div>
                    <div className="w-full bg-white/50 p-4 rounded-2xl border border-stone-200 shadow-sm backdrop-blur-sm">
                        <p className="text-sm font-bold text-stone-500 mb-2">Hôm nay cảm xúc của bạn là...</p>
                        <div className="flex flex-wrap gap-3 justify-start">
                        {Object.entries(MOODS).map(([key, icon]) => (
                            <button key={key} onClick={() => setSelectedMood(key as MoodType)} className={`group relative px-3 py-2 rounded-xl transition-all duration-300 border-2 ${selectedMood === key ? 'bg-white border-rose-300 scale-110 shadow-md' : 'bg-transparent border-transparent hover:bg-white/60 hover:border-stone-200'}`} type="button" title={MOOD_LABELS[key]}>
                                <span className="text-2xl filter drop-shadow-sm">{icon}</span>
                                <span className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-ink whitespace-nowrap bg-white px-2 py-1 rounded-md shadow-sm pointer-events-none transition-opacity z-50 ${selectedMood === key ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{MOOD_LABELS[key]}</span>
                            </button>
                        ))}
                        </div>
                    </div>
                </div>
                {/* layout fix: pb-40 để đảm bảo không bị nút "Lưu" che khuất dòng chữ cuối khi viết dài */}
                <div className="ml-8 md:ml-12 relative z-10 mt-2 pb-40">
                    <textarea value={diaryContent} onChange={(e) => setDiaryContent(e.target.value)} placeholder="Hãy kể cho mình nghe mọi chuyện..." className="w-full h-[45vh] bg-transparent font-hand text-[1.5rem] md:text-[1.75rem] text-ink outline-none resize-none leading-[2.5rem] placeholder:text-stone-300" autoFocus />
                </div>
                <div className="fixed bottom-6 right-6 md:right-12 flex gap-3 z-50 animate-fade-in-up">
                    <Button size="large" onClick={() => { setPage('home'); resetWriteForm(); }} className="h-12 px-6 rounded-full border-2 border-stone-200 font-bold">Hủy bỏ</Button>
                    <Button type="primary" size="large" onClick={handleSaveEntry} loading={loading} icon={<Heart size={20} className="fill-white" />} className="bg-stone-800 hover:!bg-stone-900 h-12 px-8 rounded-full shadow-xl font-bold border-none animate-sparkle-hover">
                        {editingId ? 'Cập nhật bài viết' : 'Lưu trang viết'}
                    </Button>
                </div>
                </div>
            </div>
            )}
        </main>
        </div>
    </ConfigProvider>
  );
};

export default App;
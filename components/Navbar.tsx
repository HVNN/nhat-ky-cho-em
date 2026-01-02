import React from 'react';
import { User, Page } from '../types';
import { BookHeart, LogOut, PenTool, LayoutDashboard, UserPlus } from 'lucide-react';
import { Button } from 'antd';

interface NavbarProps {
  currentUser: User | null;
  setCurrentPage: (page: Page) => void;
  onLogout: () => void;
  activePage: Page;
}

const Navbar: React.FC<NavbarProps> = ({ currentUser, setCurrentPage, onLogout, activePage }) => {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-sm transition-all duration-300 h-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => setCurrentPage('home')}
          >
            <div className="bg-rose-100 p-2 rounded-full mr-2 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <BookHeart className="text-rose-500 group-hover:animate-wiggle-hover" size={24} />
            </div>
            <span className="font-bold text-xl text-stone-700 tracking-tight hidden sm:block font-hand">Chuyện của anh Cún</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {currentUser ? (
              <>
                 <span className="text-stone-500 text-sm font-medium mr-2 hidden md:block animate-fade-in-up">
                  Xin chào, <span className="text-rose-500 font-bold font-hand text-lg">{currentUser.username}</span>
                </span>
                
                {/* Chỉ hiển thị nút viết nhật ký nếu KHÔNG phải là Admin */}
                {!currentUser.isAdmin && (
                  <Button
                    onClick={() => setCurrentPage('write')}
                    type={activePage === 'write' ? 'primary' : 'default'}
                    shape="round"
                    icon={<PenTool size={16} />}
                    className={activePage === 'write' ? 'bg-rose-500 hover:!bg-rose-600 shadow-md' : 'hover:text-rose-500'}
                  >
                    <span className="hidden sm:inline">Viết Nhật Ký</span>
                  </Button>
                )}

                {currentUser.isAdmin && (
                  <Button
                    onClick={() => setCurrentPage('admin')}
                    type={activePage === 'admin' ? 'primary' : 'default'}
                    shape="round"
                    icon={<LayoutDashboard size={16} />}
                    className={activePage === 'admin' ? 'bg-purple-500 hover:!bg-purple-600 shadow-md' : 'hover:text-purple-500'}
                  >
                    <span className="hidden sm:inline">Quản Lý</span>
                  </Button>
                )}

                <Button
                  onClick={onLogout}
                  type="text"
                  shape="circle"
                  icon={<LogOut size={20} />}
                  className="text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                  title="Đăng xuất"
                />
              </>
            ) : (
              <>
                <Button
                  type="text"
                  onClick={() => setCurrentPage('login')}
                  className="text-stone-600 hover:text-rose-500 font-medium"
                >
                  Đăng Nhập
                </Button>
                <Button
                  type="primary"
                  shape="round"
                  onClick={() => setCurrentPage('register')}
                  icon={<UserPlus size={16} />}
                  className="bg-stone-800 hover:!bg-stone-700 shadow-md"
                >
                  Đăng Ký
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
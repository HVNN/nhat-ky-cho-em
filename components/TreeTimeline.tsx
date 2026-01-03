import React, { useState } from 'react';
import { DiaryEntry, User, MOODS, MOOD_LABELS } from '../types';
import { format, isValid, parseISO } from 'date-fns';
import { Trash2, Calendar, ChevronDown, ChevronUp, Star, Cloud, Heart, Flower, Sprout, Leaf, Edit3 } from 'lucide-react';
import { Button, Popconfirm, Tooltip } from 'antd';

interface TreeTimelineProps {
  entries: DiaryEntry[];
  users: User[];
  currentUser: User | null;
  onDelete: (id: string) => void;
  onEdit: (entry: DiaryEntry) => void;
}

const TreeTimeline: React.FC<TreeTimelineProps> = ({ entries, users, currentUser, onDelete, onEdit }) => {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.createdAt), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, DiaryEntry[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getUserColor = (username: string) => {
    const user = users.find(u => u.username === username);
    return user?.avatarColor || 'bg-stone-200';
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedEntries);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedEntries(newSet);
  };

  const getSticker = (id: string) => {
    const stickers = [
      <Star size={24} className="text-yellow-400 fill-yellow-200" />,
      <Cloud size={24} className="text-sky-400 fill-sky-100" />,
      <Heart size={24} className="text-rose-400 fill-rose-200" />,
      <Flower size={24} className="text-purple-400 fill-purple-200" />
    ];
    const index = id.charCodeAt(id.length - 1) % 6; 
    if (index >= stickers.length) return null;
    return stickers[index];
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 text-ink-light font-hand text-3xl animate-fade-in-up">
        <p>Chưa có dòng nhật ký nào...</p>
        <p className="mt-2 text-xl opacity-75">Hãy là người viết nên câu chuyện đầu tiên.</p>
      </div>
    );
  }

  return (
    <div className="relative py-8 px-0 md:px-4 max-w-5xl mx-auto">
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-stone-300 transform -translate-x-1/2 z-0 opacity-70"></div>

      {sortedDates.map((date, dateIndex) => (
        <div key={date} className="mb-12 relative">
          <div className="flex justify-center mb-10 relative z-10 animate-fade-in-up" style={{ animationDelay: `${dateIndex * 0.1}s` }}>
            <div className="bg-paper border-2 border-stone-300 px-6 py-2 rounded-full text-ink font-bold shadow-comic flex items-center gap-2 text-base transform hover:scale-105 transition-transform">
              <Calendar size={18} className="text-rose-500" />
              <span>{format(new Date(date), 'dd/MM/yyyy')}</span>
            </div>
          </div>

          <div className="space-y-12">
            {groupedEntries[date].map((entry, index) => {
              const isLeft = index % 2 === 0;
              const userColor = getUserColor(entry.username);
              const isOwner = currentUser?.username === entry.username;
              const canModify = currentUser?.isAdmin || isOwner;
              
              const isLongText = entry.content.length > 400;
              const isExpanded = expandedEntries.has(entry.id);
              const displayContent = isLongText && !isExpanded 
                ? entry.content.slice(0, 400) + '...' 
                : entry.content;

              const entryDate = parseISO(entry.createdAt);
              const timeDisplay = isValid(entryDate) ? format(entryDate, 'HH:mm') : '--:--';

              return (
                <div 
                  key={entry.id} 
                  className={`flex flex-col md:flex-row w-full items-start relative group ${isLeft ? 'md:flex-row-reverse' : ''} animate-fade-in-up`}
                >
                  <div className="hidden md:flex absolute top-10 left-1/2 transform -translate-x-1/2 z-0 items-center justify-center">
                    <div className="bg-fuchsia-50 p-1 rounded-full border border-stone-200 z-10 shadow-sm relative">
                        {index % 2 === 0 ? <Leaf size={14} className="text-green-500 fill-green-100" /> : <Sprout size={14} className="text-lime-500 fill-lime-100" />}
                    </div>
                  </div>

                   <div className="md:hidden absolute top-10 left-6 w-8 h-px border-t-2 border-dashed border-stone-300 z-0"></div>
                  <div className="hidden md:block w-1/2 px-12"></div>

                  <div className="w-full md:w-1/2 px-2 md:px-12 pl-14 md:pl-12 relative z-10">
                    <div 
                      className={`
                        relative bg-paper p-6 md:p-8 rounded-2xl border-2 border-stone-200
                        shadow-comic hover:shadow-comic-hover
                        transition-all duration-500 ease-out transform hover:-translate-y-1
                        ${isLeft ? 'rotate-1 hover:rotate-0' : '-rotate-1 hover:rotate-0'}
                      `}
                    >
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-24 h-8 bg-rose-200/60 rotate-1 washi-tape z-20"></div>

                      <div className="absolute -top-4 -right-2 transform rotate-12 opacity-90 filter drop-shadow-sm pointer-events-none animate-float" style={{ animationDuration: '4s' }}>
                        {getSticker(entry.id)}
                      </div>

                      <div className="flex justify-between items-start mb-2 border-b border-stone-100 pb-2">
                         <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-ink-light border-2 border-white shadow-sm ${userColor}`}>
                              {entry.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-stone-500">{entry.username}</span>
                                <span className="text-xs text-stone-400 font-medium">{timeDisplay}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <Tooltip title={MOOD_LABELS[entry.mood]} mouseEnterDelay={0} arrow={false}>
                                <span className="text-2xl filter drop-shadow-sm transform hover:scale-125 transition-transform cursor-help">
                                    {MOODS[entry.mood]}
                                </span>
                            </Tooltip>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isOwner && (
                                    <Button 
                                        type="text" 
                                        shape="circle" 
                                        size="small" 
                                        icon={<Edit3 size={14} className="text-stone-400" />}
                                        onClick={() => onEdit(entry)}
                                    />
                                )}
                                {canModify && (
                                    <Popconfirm
                                        title="Xóa bài viết?"
                                        description="Bạn có chắc muốn xóa dòng nhật ký này không?"
                                        onConfirm={() => onDelete(entry.id)}
                                        okText="Xóa luôn"
                                        cancelText="Giữ lại"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button 
                                            type="text" 
                                            danger
                                            shape="circle"
                                            size="small"
                                            icon={<Trash2 size={14} />}
                                        />
                                    </Popconfirm>
                                )}
                            </div>
                         </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="font-hand text-2xl font-bold text-rose-500 leading-tight">
                            {entry.title || format(new Date(entry.createdAt), "'Ngày' dd 'tháng' MM")}
                        </h3>
                      </div>

                      <div className="font-hand text-[1.25rem] text-ink leading-[1.8] whitespace-pre-wrap tracking-wide">
                        {displayContent}
                      </div>

                      {isLongText && (
                        <div className="mt-4 flex justify-center">
                          <Button 
                            type="text"
                            onClick={() => toggleExpand(entry.id)}
                            className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>Thu gọn <ChevronUp size={14} /></>
                            ) : (
                              <>Đọc tiếp... <ChevronDown size={14} /></>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TreeTimeline;
import React from 'react';
import { MONTH_NAMES_FR, DAY_NAMES_FR, getMonthGrid, isSameDay } from '../utils/dateUtils';
import { Task, Priority } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMonthChange: (increment: number) => void;
  tasks: Task[];
}

const Calendar: React.FC<CalendarProps> = ({ 
  currentDate, 
  selectedDate, 
  onSelectDate, 
  onMonthChange,
  tasks 
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const grid = getMonthGrid(year, month);
  const today = new Date();

  const getDayTasks = (date: Date) => tasks.filter(t => isSameDay(new Date(t.date), date));

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'bg-red-500';
      case Priority.MEDIUM: return 'bg-yellow-500';
      case Priority.LOW: return 'bg-green-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 capitalize">
          {MONTH_NAMES_FR[month]} {year}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => onMonthChange(-1)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={() => onMonthChange(1)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
        {DAY_NAMES_FR.map((day, i) => (
          <div key={i} className="py-2 text-center text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-[1fr]">
        {grid.map((cell, index) => {
          const dayTasks = getDayTasks(cell.date);
          const isSelected = selectedDate && isSameDay(cell.date, selectedDate);
          const isToday = isSameDay(cell.date, today);

          return (
            <div 
              key={index}
              onClick={() => onSelectDate(cell.date)}
              className={`
                min-h-[50px] md:min-h-[80px] p-1 md:p-2 border-b border-r border-slate-50 cursor-pointer transition-colors relative
                ${!cell.isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white text-slate-700'}
                ${isSelected ? 'bg-indigo-50 !border-indigo-100 ring-inset ring-1 ring-indigo-200' : 'hover:bg-slate-50'}
              `}
            >
              <div className="flex justify-between items-start">
                <span className={`
                  text-[10px] md:text-sm font-medium w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : ''}
                `}>
                  {cell.date.getDate()}
                </span>
                {dayTasks.length > 0 && (
                   <span className="text-[9px] md:text-[10px] font-bold text-slate-400 bg-slate-100 px-1 md:px-1.5 rounded-full scale-90 md:scale-100 origin-top-right">
                     {dayTasks.length}
                   </span>
                )}
              </div>
              
              <div className="mt-1 md:mt-2 flex flex-wrap content-start gap-0.5 md:gap-1">
                {dayTasks.slice(0, 4).map((task) => (
                  <div 
                    key={task.id} 
                    className={`h-1 w-1 md:h-1.5 md:w-1.5 rounded-full ${getPriorityColor(task.priority)}`}
                    title={task.title}
                  />
                ))}
                {dayTasks.length > 4 && (
                  <div className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-slate-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
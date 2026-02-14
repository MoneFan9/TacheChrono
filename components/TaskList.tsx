import React from 'react';
import { Task, Priority } from '../types';
import { formatDateFr } from '../utils/dateUtils';
import { CheckCircle2, Circle, Clock, Tag, Trash2, Edit2, ListChecks } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  title?: string;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onToggleComplete, 
  onDelete, 
  onEdit, 
  title,
  selectionMode = false,
  selectedIds,
  onSelect
}) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="opacity-20" />
        </div>
        <p className="text-sm font-medium">Aucune tâche pour le moment</p>
      </div>
    );
  }

  const getPriorityBadge = (p: Priority) => {
    const styles = {
      [Priority.HIGH]: 'bg-red-50 text-red-700 border-red-100',
      [Priority.MEDIUM]: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      [Priority.LOW]: 'bg-green-50 text-green-700 border-green-100'
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${styles[p]}`}>
        {p}
      </span>
    );
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {title && <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>}
      {tasks.map((task) => {
        const completedSub = task.subtasks.filter(s => s.isCompleted).length;
        const totalSub = task.subtasks.length;
        const allSubCompleted = totalSub > 0 && completedSub === totalSub;
        const isSelected = selectedIds?.has(task.id);

        return (
          <div 
            key={task.id}
            className={`
              group relative bg-white rounded-xl p-3 md:p-4 border shadow-sm transition-all duration-200 
              ${task.isCompleted ? 'opacity-60 bg-slate-50/50' : 'hover:shadow-md hover:border-indigo-200'}
              ${isSelected ? 'border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500' : 'border-slate-100'}
            `}
          >
            <div className="flex items-start gap-3 md:gap-4">
              
              {/* Checkbox de sélection (Mode Bulk) */}
              {selectionMode && onSelect && (
                <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox"
                    checked={isSelected || false}
                    onChange={() => onSelect(task.id)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Bouton de complétion */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(task.id);
                }}
                className={`
                  flex-shrink-0 mt-[2px] transition-colors duration-200
                  ${task.isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}
                `}
              >
                {task.isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
              </button>

              {/* Contenu principal */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                
                {/* Ligne 1 : Titre */}
                <div className="pr-8 md:pr-0"> 
                  <h4 className={`text-sm md:text-base font-semibold leading-snug break-words ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                    {task.title}
                  </h4>
                </div>
                
                {/* Ligne 2 : Métadonnées (Badges, Date, Catégorie) */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  
                  {/* Badges prioritaires */}
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(task.priority)}
                    
                    {totalSub > 0 && (
                        <span className={`
                        text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 border
                        ${allSubCompleted 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'}
                        `}>
                        <ListChecks size={10} />
                        {completedSub}/{totalSub}
                        </span>
                    )}
                  </div>

                  {/* Séparateur visuel léger */}
                  <div className="hidden xs:block h-3 w-px bg-slate-200"></div>

                  {/* Infos contextuelles */}
                  <div className="flex items-center gap-3 text-[11px] md:text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span className="truncate max-w-[80px] md:max-w-none">{formatDateFr(new Date(task.date))}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Tag size={12} />
                        <span className="truncate max-w-[80px] md:max-w-none">{task.category}</span>
                    </div>
                  </div>
                </div>

                {/* Ligne 3 : Description (si existante) */}
                {task.description && !task.isCompleted && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-0.5">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Actions : Positionnées en absolu en haut à droite sur mobile pour gagner de la place, ou flex sur desktop */}
              <div className="absolute top-3 right-3 md:static md:flex md:flex-col md:gap-1">
                <div className="flex md:flex-col gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(task);
                    }} 
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors bg-white/80 backdrop-blur-sm md:bg-transparent"
                    title="Modifier"
                    >
                    <Edit2 size={16} />
                    </button>
                    <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                    }} 
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white/80 backdrop-blur-sm md:bg-transparent"
                    title="Supprimer"
                    >
                    <Trash2 size={16} />
                    </button>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;
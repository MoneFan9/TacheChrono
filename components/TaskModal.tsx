import React, { useState, useEffect } from 'react';
import { Task, Priority, Category, SubTask } from '../types';
import { X, Sparkles, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { parseNaturalLanguageTask, suggestSubtasks } from '../services/geminiService';
import { toISODateLocal } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  initialDate?: Date;
  existingTask?: Task;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialDate, existingTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toISODateLocal(new Date()));
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [category, setCategory] = useState<Category>(Category.PERSONAL);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [showSmartInput, setShowSmartInput] = useState(!existingTask); // Show by default for new tasks

  useEffect(() => {
    if (isOpen) {
      if (existingTask) {
        setTitle(existingTask.title);
        setDescription(existingTask.description || '');
        setDate(toISODateLocal(existingTask.date));
        setPriority(existingTask.priority);
        setCategory(existingTask.category);
        setSubtasks(existingTask.subtasks || []);
        setShowSmartInput(false);
      } else {
        setTitle('');
        setDescription('');
        setDate(initialDate ? toISODateLocal(initialDate) : toISODateLocal(new Date()));
        setPriority(Priority.MEDIUM);
        setCategory(Category.PERSONAL);
        setSubtasks([]);
        setSmartInput('');
        setShowSmartInput(true);
      }
    }
  }, [isOpen, existingTask, initialDate]);

  const handleSmartParse = async () => {
    if (!smartInput.trim()) return;
    setIsAiLoading(true);
    const result = await parseNaturalLanguageTask(smartInput);
    setIsAiLoading(false);

    if (result) {
      setTitle(result.title);
      if (result.description) setDescription(result.description);
      if (result.date) setDate(result.date);
      if (result.priority) setPriority(result.priority);
      if (result.category) setCategory(result.category);
      if (result.suggestedSubtasks) {
        setSubtasks(result.suggestedSubtasks.map(st => ({
          id: crypto.randomUUID(),
          title: st,
          isCompleted: false
        })));
      }
      setShowSmartInput(false);
    }
  };

  const handleGenerateSubtasks = async () => {
    if (!title) return;
    setIsAiLoading(true);
    const suggestions = await suggestSubtasks(title);
    setIsAiLoading(false);
    
    if (suggestions.length > 0) {
      const newSubtasks = suggestions.map(s => ({
        id: crypto.randomUUID(),
        title: s,
        isCompleted: false
      }));
      setSubtasks([...subtasks, ...newSubtasks]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: existingTask?.id,
      title,
      description,
      date: new Date(date),
      priority,
      category,
      subtasks,
      isCompleted: existingTask?.isCompleted || false
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">
              {existingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>

          {showSmartInput && !existingTask && (
            <div className="mb-6 bg-indigo-50 p-3 md:p-4 rounded-xl border border-indigo-100">
              <label className="block text-sm font-medium text-indigo-700 mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" />
                Création rapide avec IA
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  placeholder="Ex: Réunion projet marketing..."
                  className="flex-1 min-w-0 px-3 md:px-4 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartParse()}
                />
                <button
                  onClick={handleSmartParse}
                  disabled={isAiLoading || !smartInput.trim()}
                  className="bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm whitespace-nowrap"
                >
                  {isAiLoading ? '...' : 'Go'}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                >
                  {Object.values(Category).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priorité</label>
              <div className="flex gap-2">
                {Object.values(Priority).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 min-w-0 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors truncate px-1 ${
                      priority === p
                        ? p === Priority.HIGH ? 'bg-red-100 text-red-700 ring-2 ring-red-500' 
                          : p === Priority.MEDIUM ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500'
                          : 'bg-green-100 text-green-700 ring-2 ring-green-500'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">Sous-tâches</label>
                <button
                  type="button"
                  onClick={handleGenerateSubtasks}
                  disabled={!title || isAiLoading}
                  className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  <Sparkles size={12} />
                  Suggérer avec IA
                </button>
              </div>
              <div className="space-y-2">
                {subtasks.map((st, idx) => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <button
                      type="button"
                      onClick={() => {
                        const newSubtasks = [...subtasks];
                        newSubtasks[idx].isCompleted = !newSubtasks[idx].isCompleted;
                        setSubtasks(newSubtasks);
                      }}
                      className={`${st.isCompleted ? 'text-green-500' : 'text-slate-300'} flex-shrink-0`}
                    >
                      {st.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const newSubtasks = [...subtasks];
                        newSubtasks[idx].title = e.target.value;
                        setSubtasks(newSubtasks);
                      }}
                      className={`flex-1 min-w-0 bg-transparent focus:outline-none text-sm ${st.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setSubtasks(subtasks.filter((_, i) => i !== idx))}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setSubtasks([...subtasks, { id: crypto.randomUUID(), title: '', isCompleted: false }])}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mt-2"
                >
                  <Plus size={16} /> Ajouter une sous-tâche
                </button>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors shadow-lg shadow-indigo-200"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
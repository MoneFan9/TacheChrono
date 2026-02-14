import React, { useState, useMemo, useEffect, useRef } from 'react';
import Calendar from './components/Calendar';
import TaskList from './components/TaskList';
import TaskModal from './components/TaskModal';
import ConfirmModal from './components/ConfirmModal';
import SettingsModal from './components/SettingsModal';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { Task, Priority, Category, User } from './types';
import { Plus, Layout, List, Calendar as CalendarIcon, Search, Loader2, Bell, BellOff, FlaskConical, Trash2, CheckSquare, Square, Settings } from 'lucide-react';
import { isSameDay } from './utils/dateUtils';
import { initDB, getTasks, saveTask, deleteTask, toggleTaskComplete, deleteTasks } from './services/db';
import { requestNotificationPermission, sendNotification, getNotificationPermission } from './services/notificationService';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  // Auth State (Real implementation)
  const [user, setUser] = useState<User | null>(null);
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  
  // Delete Confirmation State
  const [deleteState, setDeleteState] = useState<{
    isOpen: boolean;
    type: 'SINGLE' | 'BULK';
    taskId?: string; // Only for SINGLE
  }>({ isOpen: false, type: 'SINGLE' });

  // Filters State
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // App Settings State
  const [showDemoButton, setShowDemoButton] = useState(true);
  
  // Selection State (for Bulk Delete)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  
  // Notification State
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helpers Toast
  const addToast = (message: string, type: ToastType) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Initialisation et chargement des données depuis SQLite
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        const loadedTasks = await getTasks();
        setTasks(loadedTasks);
      } catch (error) {
        console.error("Failed to load DB", error);
        addToast("Erreur de chargement de la base de données", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    setNotificationStatus(getNotificationPermission());
  }, []);

  // Gestion des Notifications
  useEffect(() => {
    if (notificationStatus !== 'granted') return;

    const checkUpcomingTasks = () => {
      const now = new Date();
      
      tasks.forEach(task => {
        // Si la tâche n'est pas terminée et est prévue pour aujourd'hui
        if (!task.isCompleted && isSameDay(new Date(task.date), now)) {
          // Si on n'a pas encore notifié cette tâche dans cette session
          if (!notifiedTasksRef.current.has(task.id)) {
            sendNotification(
              "Rappel de tâche 📅", 
              `C'est pour aujourd'hui : ${task.title}`
            );
            notifiedTasksRef.current.add(task.id);
          }
        }
      });
    };

    // Vérification initiale
    checkUpcomingTasks();

    // Vérification toutes les minutes
    const intervalId = setInterval(checkUpcomingTasks, 60000);

    return () => clearInterval(intervalId);
  }, [tasks, notificationStatus]);

  // Reset selection when changing view or filters
  useEffect(() => {
    setSelectedTaskIds(new Set());
  }, [viewMode, filterCategory, searchQuery]);

  // Auth Handlers (Synchronous updates via Google Component)
  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    addToast(`Bienvenue, ${authenticatedUser.name} !`, "success");
    // Optionnel: Fermer la modale après connexion
    // setIsSettingsOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    addToast("Vous avez été déconnecté", "info");
  };

  const handleLoginError = () => {
    addToast("Erreur lors de la connexion Google", "error");
  };

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationStatus(permission);
    if (permission === 'granted') {
      sendNotification("Notifications activées", "Vous recevrez des rappels pour vos tâches du jour.");
      addToast("Notifications activées", "success");
    } else {
      addToast("Notifications refusées", "info");
    }
  };

  const handleInjectTestData = async () => {
    setIsLoading(true);
    try {
        // 1. Déterminer la date pivot (Date sélectionnée ou Aujourd'hui)
        const baseDate = selectedDate ? new Date(selectedDate) : new Date();

        // Fonctions utilitaires pour générer des dates relatives
        const getDate = (offsetDays: number) => {
            const d = new Date(baseDate);
            d.setDate(d.getDate() + offsetDays);
            return d;
        };

        // 2. Bibliothèque de scénarios réalistes
        const scenarios = [
            {
                title: "Réunion de lancement Projet X",
                desc: "Définir les objectifs et le planning avec l'équipe marketing.",
                prio: Priority.HIGH,
                cat: Category.WORK,
                sub: ["Réserver la salle", "Envoyer les invitations", "Imprimer l'ordre du jour"]
            },
            {
                title: "Payer les factures mensuelles",
                desc: "Électricité, Internet et Loyer.",
                prio: Priority.HIGH,
                cat: Category.PERSONAL,
                sub: ["Vérifier le compte en banque", "Télécharger les PDF"]
            },
            {
                title: "Séance de sport intensive",
                desc: "Focus cardio et jambes.",
                prio: Priority.MEDIUM,
                cat: Category.HEALTH,
                sub: ["Préparer sac de sport", "Prendre bouteille d'eau"]
            },
            {
                title: "Courses pour le dîner",
                desc: "Ingrédients pour la recette de lasagnes.",
                prio: Priority.MEDIUM,
                cat: Category.SHOPPING,
                sub: ["Acheter viande hachée", "Pâtes", "Sauce tomate", "Fromage râpé"]
            },
            {
                title: "Appeler Mamie",
                desc: "Prendre des nouvelles pour son anniversaire.",
                prio: Priority.LOW,
                cat: Category.PERSONAL,
                sub: []
            },
            {
                title: "Mise à jour du site web",
                desc: "Corriger les bugs CSS sur la page contact.",
                prio: Priority.MEDIUM,
                cat: Category.WORK,
                sub: ["Git pull", "Fix responsive mobile", "Deploy staging"]
            },
            {
                title: "Rendez-vous Dentiste",
                desc: "Contrôle annuel.",
                prio: Priority.HIGH,
                cat: Category.HEALTH,
                sub: []
            },
            {
                title: "Réservation vacances d'été",
                desc: "Comparer les vols et les hôtels.",
                prio: Priority.LOW,
                cat: Category.OTHER,
                sub: ["Vérifier dates congés", "Regarder Airbnb", "Réserver billets train"]
            }
        ];

        // 3. Sélection aléatoire et intelligente
        // On mélange les scénarios
        const shuffled = [...scenarios].sort(() => 0.5 - Math.random());
        
        // On prend les 4 premiers pour générer des tâches
        const tasksToCreate: Task[] = [];

        // Tâche 1 : Sur la date sélectionnée (Important)
        tasksToCreate.push({
            id: crypto.randomUUID(),
            title: shuffled[0].title,
            description: shuffled[0].desc,
            date: getDate(0), // Jour J
            priority: shuffled[0].prio,
            category: shuffled[0].cat,
            isCompleted: false,
            subtasks: shuffled[0].sub.map(t => ({ id: crypto.randomUUID(), title: t, isCompleted: false }))
        });

            // Tâche 2 : Sur la date sélectionnée (Secondaire)
        tasksToCreate.push({
            id: crypto.randomUUID(),
            title: shuffled[1].title,
            description: shuffled[1].desc,
            date: getDate(0), // Jour J
            priority: Priority.LOW, // On force une priorité basse pour varier
            category: shuffled[1].cat,
            isCompleted: Math.random() > 0.7, // Parfois déjà complétée
            subtasks: shuffled[1].sub.map(t => ({ id: crypto.randomUUID(), title: t, isCompleted: Math.random() > 0.5 }))
        });

        // Tâche 3 : Le lendemain
        tasksToCreate.push({
            id: crypto.randomUUID(),
            title: shuffled[2].title,
            description: shuffled[2].desc,
            date: getDate(1), // J+1
            priority: shuffled[2].prio,
            category: shuffled[2].cat,
            isCompleted: false,
            subtasks: shuffled[2].sub.map(t => ({ id: crypto.randomUUID(), title: t, isCompleted: false }))
        });

        // Tâche 4 : Dans 2 ou 3 jours
        tasksToCreate.push({
            id: crypto.randomUUID(),
            title: shuffled[3].title,
            description: shuffled[3].desc,
            date: getDate(Math.floor(Math.random() * 2) + 2), // J+2 ou J+3
            priority: shuffled[3].prio,
            category: shuffled[3].cat,
            isCompleted: false,
            subtasks: shuffled[3].sub.map(t => ({ id: crypto.randomUUID(), title: t, isCompleted: false }))
        });

        // 4. Injection en base
        for (const t of tasksToCreate) {
            await saveTask(t);
        }
        
        await refreshTasks();
        
        // Notification toast plus contextuelle
        const dateStr = baseDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        addToast(`Données de démo générées pour le ${dateStr}`, "success");

    } catch (e) {
        console.error("Erreur génération données test", e);
        addToast("Erreur lors de la génération des données", "error");
    } finally {
        setIsLoading(false);
    }
  };

  const refreshTasks = async () => {
    const loadedTasks = await getTasks();
    setTasks(loadedTasks);
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by date if in calendar view and a date is selected
    if (viewMode === 'calendar' && selectedDate) {
      result = result.filter(t => isSameDay(t.date, selectedDate));
    } else if (viewMode === 'list') {
       // Sort by date ascending
       result = [...result].sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    if (filterCategory !== 'ALL') {
      result = result.filter(t => t.category === filterCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tasks, selectedDate, viewMode, filterCategory, searchQuery]);

  // Bulk Selection Logic
  const handleSelectTask = (id: string) => {
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTaskIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0) {
      setSelectedTaskIds(new Set()); // Deselect all
    } else {
      const allIds = new Set(filteredTasks.map(t => t.id));
      setSelectedTaskIds(allIds);
    }
  };

  // ----- Gestion de la suppression -----

  const requestDeleteSingle = (id: string) => {
    setDeleteState({ isOpen: true, type: 'SINGLE', taskId: id });
  };

  const requestDeleteBulk = () => {
    if (selectedTaskIds.size === 0) return;
    setDeleteState({ isOpen: true, type: 'BULK' });
  };

  const confirmDeleteAction = async () => {
    try {
      if (deleteState.type === 'SINGLE' && deleteState.taskId) {
        const id = deleteState.taskId;
        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== id));
        await deleteTask(id);
        addToast("Tâche supprimée définitivement", "success");
      } 
      else if (deleteState.type === 'BULK') {
        const count = selectedTaskIds.size;
        const idsToDelete = Array.from(selectedTaskIds);
        
        // Optimistic update
        setTasks(prev => prev.filter(t => !selectedTaskIds.has(t.id)));
        setSelectedTaskIds(new Set());
        
        await deleteTasks(idsToDelete as string[]);
        addToast(`${count} tâches supprimées`, "success");
      }
      
      // Sync with DB
      await refreshTasks();

    } catch (e) {
      console.error("Erreur lors de la suppression", e);
      addToast("Erreur lors de la suppression", "error");
      await refreshTasks(); // Rollback en cas d'erreur
    }
  };

  // -------------------------------------

  const handleAddTask = async (taskData: Partial<Task>) => {
    try {
      let taskToSave: Task;
      const isEdit = !!taskData.id;
      
      if (taskData.id) {
        const existing = tasks.find(t => t.id === taskData.id);
        if (!existing) return;
        taskToSave = { ...existing, ...taskData } as Task;
      } else {
        taskToSave = {
          id: crypto.randomUUID(),
          title: taskData.title!,
          description: taskData.description,
          date: taskData.date || new Date(),
          priority: taskData.priority || Priority.MEDIUM,
          category: taskData.category || Category.PERSONAL,
          isCompleted: false,
          subtasks: taskData.subtasks || []
        };
      }

      if (taskData.id) {
        setTasks(prev => prev.map(t => t.id === taskToSave.id ? taskToSave : t));
      } else {
        setTasks(prev => [...prev, taskToSave]);
      }

      await saveTask(taskToSave);
      await refreshTasks();
      addToast(isEdit ? "Tâche modifiée" : "Tâche créée avec succès", "success");
    } catch (e) {
      console.error("Error saving task", e);
      addToast("Erreur lors de la sauvegarde", "error");
    }
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
      await toggleTaskComplete(id, task.isCompleted);
      await refreshTasks();
    }
  };

  const openNewTaskModal = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="font-medium animate-pulse">Chargement de la base de données...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-0 font-sans overflow-x-hidden">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Fenêtre de Confirmation de Suppression */}
      <ConfirmModal 
        isOpen={deleteState.isOpen}
        onClose={() => setDeleteState({ ...deleteState, isOpen: false })}
        onConfirm={confirmDeleteAction}
        title={deleteState.type === 'BULK' ? "Supprimer la sélection ?" : "Supprimer la tâche ?"}
        message={
          deleteState.type === 'BULK' 
            ? `Vous êtes sur le point de supprimer ${selectedTaskIds.size} tâche(s). Cette action est irréversible.`
            : "Cette tâche sera définitivement supprimée de votre liste. Êtes-vous sûr de vouloir continuer ?"
        }
      />

      {/* Fenêtre de Paramètres */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showDemoButton={showDemoButton}
        onToggleDemoButton={() => setShowDemoButton(!showDemoButton)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onLoginError={handleLoginError}
      />

      {/* Top Navigation / Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Layout className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 truncate">TâcheChrono</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Paramètres"
                className="relative p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
              >
                {user ? (
                   <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200">
                     {user.avatarUrl ? (
                       <img src={user.avatarUrl} alt="Profil" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                         {user.name.charAt(0)}
                       </div>
                     )}
                   </div>
                ) : (
                  <Settings size={20} />
                )}
              </button>

              {showDemoButton && (
                <button
                  onClick={handleInjectTestData}
                  title="Générer des données de test"
                  className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                >
                  <FlaskConical size={20} />
                </button>
              )}

              <button
                onClick={handleRequestPermission}
                title={notificationStatus === 'granted' ? 'Notifications activées' : 'Activer les notifications'}
                className={`p-2 rounded-lg transition-colors ${
                  notificationStatus === 'granted' 
                    ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                {notificationStatus === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
              </button>

              <div className="hidden md:flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Calendrier
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Liste
                </button>
              </div>
              <button 
                onClick={openNewTaskModal}
                className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl items-center gap-2 transition-colors shadow-md shadow-indigo-200"
              >
                <Plus size={20} />
                <span className="font-medium">Nouvelle Tâche</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
               <button 
                 onClick={() => setFilterCategory('ALL')}
                 className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${filterCategory === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
               >
                 Tout
               </button>
               {Object.values(Category).map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setFilterCategory(cat)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${filterCategory === cat ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-12 gap-8">
          
          {/* Calendar Side (or Full Width based on view) */}
          <div className={`
             ${viewMode === 'calendar' ? 'md:col-span-7 lg:col-span-8' : 'hidden'}
             transition-all duration-300
          `}>
             <Calendar
               currentDate={currentDate}
               selectedDate={selectedDate}
               onSelectDate={(d) => {
                 setSelectedDate(d);
                 setViewMode('calendar'); 
               }}
               onMonthChange={(inc) => {
                 const newDate = new Date(currentDate);
                 newDate.setMonth(newDate.getMonth() + inc);
                 setCurrentDate(newDate);
               }}
               tasks={tasks}
             />
          </div>

          {/* Task List Side */}
          <div className={`
            ${viewMode === 'calendar' ? 'md:col-span-5 lg:col-span-4' : 'md:col-span-12'}
            flex flex-col gap-4
          `}>
            <div className="flex items-center justify-between min-h-[40px]">
              {viewMode === 'list' && filteredTasks.length > 0 ? (
                <div className="flex items-center gap-4 w-full bg-indigo-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2 border border-indigo-100">
                  <button 
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900"
                  >
                    {selectedTaskIds.size === filteredTasks.length && filteredTasks.length > 0 
                      ? <CheckSquare size={18} /> 
                      : <Square size={18} />
                    }
                    Tout sélec.
                  </button>
                  
                  <div className="h-4 w-px bg-indigo-200 mx-2"></div>
                  
                  <span className="text-sm text-indigo-600 font-medium">
                    {selectedTaskIds.size} sélectionnée{selectedTaskIds.size > 1 ? 's' : ''}
                  </span>

                  <div className="flex-1"></div>

                  {selectedTaskIds.size > 0 && (
                    <button 
                      onClick={requestDeleteBulk}
                      className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-slate-800">
                    {viewMode === 'calendar' && selectedDate 
                      ? (isSameDay(selectedDate, new Date()) ? "Aujourd'hui" : selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))
                      : 'Toutes les tâches'
                    }
                  </h2>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    {filteredTasks.length} tâches
                  </span>
                </>
              )}
            </div>
            
            <TaskList
              tasks={filteredTasks}
              onToggleComplete={handleToggleComplete}
              onDelete={requestDeleteSingle}
              onEdit={openEditModal}
              selectionMode={viewMode === 'list'}
              selectedIds={selectedTaskIds}
              onSelect={handleSelectTask}
            />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-40 pb-safe">
        <button 
          onClick={() => setViewMode('calendar')}
          className={`flex flex-col items-center gap-1 ${viewMode === 'calendar' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <CalendarIcon size={24} />
          <span className="text-[10px] font-medium">Calendrier</span>
        </button>
        <div className="w-12"></div> {/* Spacer for floating button */}
        <button 
           onClick={() => setViewMode('list')}
           className={`flex flex-col items-center gap-1 ${viewMode === 'list' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <List size={24} />
          <span className="text-[10px] font-medium">Liste</span>
        </button>
      </div>

      {/* Mobile Floating Add Button */}
      <button 
        onClick={openNewTaskModal}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-indigo-300 z-50 hover:scale-105 transition-transform"
      >
        <Plus size={28} />
      </button>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTask}
        initialDate={selectedDate || new Date()}
        existingTask={editingTask}
      />
    </div>
  );
};

export default App;
import React from 'react';
import { X, FlaskConical, Settings, LogOut, User as UserIcon, ShieldCheck, Cloud } from 'lucide-react';
import { User } from '../types';
import AuthForm from './AuthForm';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showDemoButton: boolean;
  onToggleDemoButton: () => void;
  user: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  onLoginError: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  showDemoButton, 
  onToggleDemoButton,
  user,
  onLogin,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Settings size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Paramètres</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section Compte */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={14} /> Compte
            </h3>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              {user ? (
                // État connecté
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate">{user.name}</h4>
                      <p className="text-sm text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded-lg mb-4 border border-green-100">
                    <Cloud size={14} />
                    <span>Session locale active</span>
                  </div>

                  <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-colors text-sm font-medium"
                  >
                    <LogOut size={16} />
                    Se déconnecter
                  </button>
                </div>
              ) : (
                // État déconnecté
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                      <UserIcon className="text-slate-400" size={24} />
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-1">Authentification</h4>
                    <p className="text-xs text-slate-500 max-w-[200px] mx-auto">
                      Connectez-vous pour accéder à votre espace personnel.
                    </p>
                  </div>
                  
                  <AuthForm onLoginSuccess={onLogin} />
                </div>
              )}
            </div>
          </section>

          {/* Section Préférences */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings size={14} /> Préférences de l'application
            </h3>
            
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
               {/* Option: Mode Démo */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-indigo-500 bg-indigo-50 p-1.5 rounded-md">
                    <FlaskConical size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Mode Démo</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bouton pour générer des données de test.
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={onToggleDemoButton}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    showDemoButton ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${
                      showDemoButton ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          <div className="text-center text-[10px] text-slate-400 pt-4">
             Version 1.0.5 • TâcheChrono
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
import React from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';
import { AppNotification } from '../types/banking';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col p-6 space-y-4 text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Notifications</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mark all as read */}
        {notifications.some(n => !n.read) && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 self-end cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all as read
          </button>
        )}

        {/* Notification Feed */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No notifications yet.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all ${
                  n.read
                    ? 'bg-slate-50 border-slate-200 opacity-80'
                    : 'bg-blue-50/40 border-blue-200 shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-900">{n.title}</span>
                  <span className="font-mono text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

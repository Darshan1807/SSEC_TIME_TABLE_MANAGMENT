import React, { useEffect } from 'react';
import { ToastNotification } from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  RefreshCw, 
  Copy, 
  Database, 
  WifiOff, 
  ServerCrash 
} from 'lucide-react';

interface ToastStackProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastNotificationStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      aria-live="assertive" 
      className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastNotification; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [copied, setCopied] = React.useState(false);
  const duration = toast.duration ?? (toast.type === 'danger' ? 7000 : 4500);

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const copyErrorToClipboard = () => {
    const textToCopy = `${toast.title ? toast.title + ': ' : ''}${toast.message}${toast.details ? '\nDetails: ' + toast.details : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStyle = () => {
    switch (toast.type) {
      case 'danger':
        return {
          bg: 'bg-white',
          border: 'border-red-300',
          shadow: 'shadow-2xl shadow-red-500/10',
          accent: 'bg-red-600',
          badgeBg: 'bg-red-50 text-red-700 border-red-200',
          titleColor: 'text-red-950',
          msgColor: 'text-slate-700',
          barColor: 'bg-red-500',
          icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        };
      case 'warning':
        return {
          bg: 'bg-white',
          border: 'border-amber-300',
          shadow: 'shadow-2xl shadow-amber-500/10',
          accent: 'bg-amber-500',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          titleColor: 'text-amber-950',
          msgColor: 'text-slate-700',
          barColor: 'bg-amber-500',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        };
      case 'info':
        return {
          bg: 'bg-white',
          border: 'border-sky-300',
          shadow: 'shadow-2xl shadow-sky-500/10',
          accent: 'bg-sky-500',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
          titleColor: 'text-sky-950',
          msgColor: 'text-slate-700',
          barColor: 'bg-sky-500',
          icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        };
      case 'success':
      default:
        return {
          bg: 'bg-white',
          border: 'border-emerald-300',
          shadow: 'shadow-2xl shadow-emerald-500/10',
          accent: 'bg-emerald-500',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          titleColor: 'text-slate-900',
          msgColor: 'text-slate-700',
          barColor: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        };
    }
  };

  const style = getStyle();

  return (
    <div 
      className={`${style.bg} ${style.border} ${style.shadow} pointer-events-auto border rounded-2xl p-4 transition-all duration-200 overflow-hidden relative group`}
      role="alert"
    >
      {/* Top Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${style.accent}`} />

      <div className="flex items-start gap-3 pt-0.5">
        {style.icon}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`text-xs font-bold ${style.titleColor}`}>
              {toast.title || (toast.type === 'danger' ? 'API Request Error' : toast.type === 'warning' ? 'System Notice' : 'Success')}
            </h4>
            {toast.details && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${style.badgeBg}`}>
                {toast.details}
              </span>
            )}
          </div>
          <p className={`text-xs ${style.msgColor} mt-1 leading-relaxed break-words font-medium`}>
            {toast.message}
          </p>

          {/* Action buttons */}
          {(toast.onAction || toast.type === 'danger') && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 flex-wrap">
              {toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    onDismiss(toast.id);
                  }}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{toast.actionLabel || 'Retry API Call'}</span>
                </button>
              )}

              <button
                onClick={copyErrorToClipboard}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-[11px] font-semibold px-2 py-1 rounded transition-colors"
                title="Copy error details to clipboard"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy Error'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-dismiss progress bar animation */}
      {duration > 0 && (
        <div 
          className={`absolute bottom-0 left-0 h-0.5 ${style.barColor} opacity-40`}
          style={{
            animation: `shrinkWidth ${duration}ms linear forwards`,
            width: '100%'
          }}
        />
      )}
    </div>
  );
};

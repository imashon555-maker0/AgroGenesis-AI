import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, X, Info } from "lucide-react";
import { sounds } from "@/services/sounds";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (type === "success") sounds.success();
    else if (type === "error") sounds.error();
    else if (type === "warning") sounds.notification();
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast, i) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} index={i} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onRemove,
  index,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
  index: number;
}) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle size={18} className="text-agro-400 shrink-0" />,
    error: <XCircle size={18} className="text-red-400 shrink-0" />,
    warning: <AlertTriangle size={18} className="text-earth-300 shrink-0" />,
    info: <Info size={18} className="text-blue-400 shrink-0" />,
  };

  const borders = {
    success: "border-agro-500/30",
    error: "border-red-500/30",
    warning: "border-earth-300/30",
    info: "border-blue-500/30",
  };

  return (
    <div
      className={`flex items-start gap-3 bg-field-900 border ${borders[toast.type]} rounded-lg p-3 shadow-xl backdrop-blur-sm ${
        exiting ? "animate-[toastOut_0.3s_ease-in_forwards]" : "animate-[toastIn_0.3s_ease-out_both]"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {icons[toast.type]}
      <p className="text-sm text-earth-100 flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="text-field-300 hover:text-earth-100 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg overflow-hidden">
        <div
          className={`h-full ${
            toast.type === "success"
              ? "bg-agro-500"
              : toast.type === "error"
              ? "bg-red-500"
              : toast.type === "warning"
              ? "bg-earth-300"
              : "bg-blue-500"
          }`}
          style={{
            animation: `shrink ${toast.duration || 4000}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

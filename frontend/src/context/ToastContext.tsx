import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  description: string;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, "id">) => void;
  success: (description: string, title?: string) => void;
  error: (description: string, title?: string) => void;
  info: (description: string, title?: string) => void;
  warning: (description: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type, title, description }: Omit<ToastMessage, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback(
    (description: string, title = "Success") => {
      toast({ type: "success", title, description });
    },
    [toast]
  );

  const error = useCallback(
    (description: string, title = "Error") => {
      toast({ type: "error", title, description });
    },
    [toast]
  );

  const info = useCallback(
    (description: string, title = "Note") => {
      toast({ type: "info", title, description });
    },
    [toast]
  );

  const warning = useCallback(
    (description: string, title = "Warning") => {
      toast({ type: "warning", title, description });
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-xl border backdrop-blur-md",
                t.type === "success" &&
                  "bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100",
                t.type === "error" &&
                  "bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100",
                t.type === "warning" &&
                  "bg-amber-50/95 border-amber-200 text-amber-900 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-100",
                t.type === "info" &&
                  "bg-sky-50/95 border-sky-200 text-sky-900 dark:bg-sky-950/90 dark:border-sky-800 dark:text-sky-100"
              )}
            >
              <div className="mt-0.5 shrink-0">
                {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                {t.type === "error" && <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                {t.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                {t.type === "info" && <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
              </div>
              <div className="flex-1 text-sm">
                {t.title && <p className="font-semibold leading-tight">{t.title}</p>}
                <p className={cn("text-xs mt-0.5", t.title ? "opacity-90" : "font-medium")}>
                  {t.description}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

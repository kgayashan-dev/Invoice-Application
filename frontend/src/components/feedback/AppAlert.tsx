import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface AppAlertProps {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
}

export default function AppAlert({ type, message, onClose }: AppAlertProps) {
  const isSuccess = type === "success";
  const bgClasses = isSuccess
    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
    : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200";

  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm mb-6 ${bgClasses}`}>
      <div className="flex items-center gap-2.5">
        {isSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
        <p className="font-medium">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:opacity-75 transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

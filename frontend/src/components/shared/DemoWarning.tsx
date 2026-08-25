import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const DISMISS_KEY = "agro_demo_warning_dismissed";

export function DemoWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed) setShow(true);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-field-900 border border-earth-300/30 rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-slide-up">
        <div className="p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-earth-300/10 flex items-center justify-center">
            <AlertTriangle size={28} className="text-earth-300" />
          </div>
          <h2 className="text-lg font-bold text-earth-100 mb-2">Демо-версия AgroGenesis AI</h2>
          <div className="space-y-2 text-sm text-field-200 mb-6">
            <p>
              Это <span className="text-earth-300 font-medium">демонстрационная версия</span> платформы точного земледелии, 
              разработанная для хакатона Future Minds 2026.
            </p>
            <p className="text-field-300 text-xs">
              Данные в системе являются тестовыми. Функции ИИ-генерации рецептур 
              работают через локальный генератор (без подключённого бэкенда).
            </p>
            <p className="text-field-300 text-xs">
              Трек: <span className="text-agro-400">EcoFin — Оптимизация углеродных кредитов</span>
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-full px-5 py-2.5 bg-agro-600 hover:bg-agro-500 text-earth-100 rounded-lg text-sm font-medium transition-colors"
          >
            Понятно, начать работу
          </button>
        </div>
      </div>
    </div>
  );
}
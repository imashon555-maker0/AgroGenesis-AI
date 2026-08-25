import { useState } from "react";
import { login, register, hasUsers, type AuthUser } from "@/services/authStore";
import { Wheat, Eye, EyeOff, Loader2, Mail, Lock, User, Building2 } from "lucide-react";

interface Props {
  onAuth: (user: AuthUser) => void;
}

export function LoginModal({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">(hasUsers() ? "login" : "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 600)); // Simulate network delay
      let user: AuthUser;
      if (mode === "login") {
        user = login(email, password);
      } else {
        if (!name.trim()) throw new Error("Введите ваше имя");
        if (!organization.trim()) throw new Error("Введите организацию");
        if (password.length < 6) throw new Error("Пароль минимум 6 символов");
        user = register(email, password, name.trim(), organization.trim());
      }
      onAuth(user);
    } catch (err: any) {
      setError(err.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 transition-all";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-[420px] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
            <Wheat size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {mode === "login" ? "Добро пожаловать" : "Создайте аккаунт"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "login"
              ? "Войдите в AgroGenesis AI"
              : "Начните оптимизировать поля с ИИ"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className={labelClass}>Полное имя</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иван Иванов"
                    className={inputClass + " pl-10"}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Организация</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="КазАгро Холдинг"
                    className={inputClass + " pl-10"}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Электронная почта</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@company.com"
                className={inputClass + " pl-10"}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Пароль</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Минимум 6 символов" : "Введите пароль"}
                className={inputClass + " pl-10 pr-10"}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-lg py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> {mode === "login" ? "Вход..." : "Создание аккаунта..."}</>
            ) : (
              mode === "login" ? "Войти" : "Создать аккаунт"
            )}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">или</span></div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg py-3 text-sm font-medium transition-colors"
          >
            {mode === "login" ? "Создать новый аккаунт" : "Уже есть аккаунт? Войти"}
          </button>
        </form>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-[11px] text-gray-400">
            AgroGenesis AI v0.1.0 · Точное земледелие
          </p>
        </div>
      </div>
    </div>
  );
}

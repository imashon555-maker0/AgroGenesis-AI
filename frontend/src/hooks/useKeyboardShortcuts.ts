import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      const key = e.key.toLowerCase();
      if (key === "g" || key === "d" || key === "f" || key === "t" || key === "i" || key === "p" || key === "e" || key === "s") {
        if (e.ctrlKey || e.metaKey) return;
        const routes: Record<string, string> = { d: "/", f: "/fields", t: "/telemetry", i: "/imagery", p: "/prescriptions", e: "/ecofin", s: "/settings" };
        if (routes[key]) { e.preventDefault(); navigate(routes[key]); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}

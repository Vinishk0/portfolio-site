import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  // Check if already authenticated
  useEffect(() => {
    const token = (window as any).__fw_token;
    if (token) navigate("/admin/dashboard");
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/c0mmand-center", { password });
      (window as any).__fw_token = res.token;
      navigate("/admin/dashboard");
    } catch {
      setError("Неверный пароль");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-8)",
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "40px", height: "40px", color: "var(--color-primary)" }}>
            <path d="M20 4 L34 30 H6 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
            <path d="M13 22 L27 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="20" cy="4" r="2" fill="currentColor"/>
          </svg>
        </div>

        <h1
          className="font-display font-semibold text-center mb-2"
          style={{ fontSize: "var(--text-lg)" }}
        >
          Command Center
        </h1>
        <p
          className="text-center mb-8"
          style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}
        >
          Режим управления портфолио
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="password" className="admin-label">Пароль</label>
            <input
              id="password"
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              data-testid="admin-password-input"
              required
            />
          </div>

          {error && (
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-error)", textAlign: "center" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            data-testid="admin-login-btn"
            style={{
              justifyContent: "center",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <p
          className="mt-6 text-center"
          style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}
        >
          Стандартный пароль: <code style={{ color: "var(--color-primary)" }}>firewolf2026</code>
        </p>
      </div>
    </div>
  );
}

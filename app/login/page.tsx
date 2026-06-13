"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "登录失败，请检查账号密码");
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: "#0F0D0B" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "#8B6F47" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: "#C9A961" }} />
      </div>

      <div className="relative w-full max-w-md mx-4 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-glow" style={{ background: "linear-gradient(135deg, #8B6F47, #C9A961)" }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-bold mb-2 gradient-text">咖啡工坊</h1>
          <p className="text-sm" style={{ color: "#8B8378" }}>会员储值风险监测系统</p>
        </div>

        <div className="rounded-2xl p-8 card-glow" style={{ backgroundColor: "#1A1613", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#E8E0D5" }}>邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2"
                style={{
                  backgroundColor: "#0F0D0B",
                  border: "1px solid #2D2722",
                  color: "#E8E0D5",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#8B6F47")}
                onBlur={(e) => (e.target.style.borderColor = "#2D2722")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#E8E0D5" }}>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
                className="w-full px-4 py-3 rounded-xl outline-none transition-all focus:ring-2"
                style={{
                  backgroundColor: "#0F0D0B",
                  border: "1px solid #2D2722",
                  color: "#E8E0D5",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#8B6F47")}
                onBlur={(e) => (e.target.style.borderColor = "#2D2722")}
              />
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(184,74,74,0.1)", color: "#B84A4A" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #8B6F47, #C9A961)" }}
            >
              {loading ? "登录中..." : "登 录"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t" style={{ borderColor: "#2D2722" }}>
            <p className="text-xs mb-3" style={{ color: "#8B8378" }}>演示账号：</p>
            <div className="space-y-1.5 text-xs" style={{ color: "#8B8378" }}>
              <p>管理层：admin@coffee.com / admin123</p>
              <p>一线(总店)：store1@coffee.com / store123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: "#5A5046" }}>
          © 2026 咖啡工坊 · 会员储值风险监测平台
        </p>
      </div>
    </div>
  );
}

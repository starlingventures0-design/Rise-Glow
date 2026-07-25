import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      navigate("/home");
    } catch (err) {
      setError(
        err instanceof Error ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "حدث خطأ"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-cream to-violet-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/1784951516838.png" alt="Glow & Rise" className="h-28 w-auto mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-bold text-violet-700">أهلاً بعودتك</h1>
          <p className="text-rose-500 text-sm mt-1">سجّلي دخولك لتكملي رحلتك</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white/80 backdrop-blur rounded-3xl shadow-xl shadow-rose-100 p-6 space-y-5 border border-rose-100"
        >
          <div>
            <label className="block text-sm text-violet-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-violet-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 text-white font-semibold py-3 shadow-lg shadow-rose-200 disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-sm text-violet-500"
          >
            ما عندك حساب؟ سجّلي الآن
          </button>
        </div>
      </div>
    </div>
  );
              }

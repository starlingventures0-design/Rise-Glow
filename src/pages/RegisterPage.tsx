import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { GoalKey } from "../types";

const GOALS: { key: GoalKey; title: string; icon: string }[] = [
  { key: "hair_skin", title: "شعر صحي وبشرة لامعة", icon: "✨" },
  { key: "fitness", title: "جسم رشيق", icon: "🏃‍♀️" },
  { key: "mental_health", title: "صحة نفسية جيدة", icon: "🧘‍♀️" },
  { key: "knowledge", title: "زيادة الثقافة", icon: "📚" },
];

const MAX_GOALS = 3;

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [secretName, setSecretName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [followPhoto, setFollowPhoto] = useState<File | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<GoalKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGoal = (key: GoalKey) => {
    setSelectedGoals((prev) => {
      if (prev.includes(key)) return prev.filter((g) => g !== key);
      if (prev.length >= MAX_GOALS) return prev; // لا يمكن تجاوز 3
      return [...prev, key];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !age || !secretName || !email || !password || !followPhoto) {
      setError("رجاءً عبّي كل الحقول وارفعي صورة المتابعة");
      return;
    }
    if (selectedGoals.length === 0) {
      setError("اختاري هدف واحد على الأقل (بحد أقصى 3)");
      return;
    }

    setLoading(true);
    try {
      // 1. إنشاء حساب Supabase Auth بالإيميل وكلمة المرور
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      const authId = authData.user?.id;
      if (!authId) throw new Error("تعذر إنشاء الحساب، حاولي مجدداً");

      // 2. رفع صورة المتابعة إلى Supabase Storage
      const fileExt = followPhoto.name.split(".").pop();
      const filePath = `follow-photos/${authId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(filePath, followPhoto);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("proofs")
        .getPublicUrl(filePath);

      // 3. إنشاء صف الفتاة في جدول girls (status: pending حتى تراجع صورتها)
      const { data: girlRow, error: insertError } = await supabase
        .from("girls")
        .insert({
          auth_id: authId,
          name,
          age: Number(age),
          secret_name: secretName,
          follow_photo_url: publicUrlData.publicUrl,
          status: "pending",
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // 4. إضافة الأهداف المختارة
      const goalRows = selectedGoals.map((goal_key) => ({
        girl_id: girlRow.id,
        goal_key,
      }));
      const { error: goalsError } = await supabase
        .from("girl_goals")
        .insert(goalRows);
      if (goalsError) throw goalsError;

      // 5. الدخول التلقائي بعد التسجيل مباشرة
      navigate("/home");
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-cream to-violet-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* الترويسة */}
        <div className="text-center mb-8">
       <img src="/1784951516838.png" alt="Glow & Rise" style={{ height: "140px", width: "auto" }} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-violet-700">عالم رانيا للفتيات</h1>
          <p className="text-rose-500 text-sm mt-1">انضمي لمجتمعنا وابدئي رحلتك</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur rounded-3xl shadow-xl shadow-rose-100 p-6 space-y-5 border border-rose-100"
        >
          {/* الاسم والعمر */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-violet-700 mb-1">الاسم</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="اسمك"
              />
            </div>
            <div>
              <label className="block text-sm text-violet-700 mb-1">العمر</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="عمرك"
              />
            </div>
          </div>

          {/* الاسم السري */}
          <div>
            <label className="block text-sm text-violet-700 mb-1">الاسم السري</label>
            <input
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              className="w-full rounded-xl border border-rose-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="اسم يميزك في المجتمع"
            />
          </div>

          {/* الإيميل وكلمة المرور */}
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

          {/* صورة المتابعة */}
          <div>
            <label className="block text-sm text-violet-700 mb-1">
              صورة إثبات متابعة @queen_raaniaa
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFollowPhoto(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-violet-600 file:mr-3 file:rounded-full file:border-0 file:bg-rose-100 file:px-4 file:py-2 file:text-rose-700 file:text-sm"
            />
            <p className="text-xs text-rose-500 mt-2 bg-rose-50 rounded-lg px-3 py-2">
              ⚠️ حذاري إذا كانت الصورة غير صحيحة سيتم حذف حسابك
            </p>
          </div>

          {/* اختيار الأهداف */}
          <div>
            <label className="block text-sm text-violet-700 mb-2">
              اختاري أهدافك (بحد أقصى 3) — {selectedGoals.length}/{MAX_GOALS}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((goal) => {
                const active = selectedGoals.includes(goal.key);
                return (
                  <button
                    type="button"
                    key={goal.key}
                    onClick={() => toggleGoal(goal.key)}
                    className={`rounded-xl border px-3 py-3 text-sm flex flex-col items-center gap-1 transition ${
                      active
                        ? "bg-gradient-to-br from-rose-400 to-violet-400 text-white border-transparent shadow-md"
                        : "border-rose-200 text-violet-700 bg-white"
                    }`}
                  >
                    <span className="text-xl">{goal.icon}</span>
                    {goal.title}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-violet-500 text-white font-semibold py-3 shadow-lg shadow-rose-200 disabled:opacity-60"
          >
            {loading ? "جاري إنشاء حسابك..." : "انضمي الآن"}
          </button>
        </form>
{/* رابط لمن عندها حساب بالفعل */}
<div className="text-center mt-4">
  <button
    type="button"
    onClick={() => navigate("/")}
    className="text-sm text-violet-500"
  >
    عندك حساب بالفعل؟ سجّلي دخولك
  </button>
</div>
        {/* زر صغير مخفي للدخول للوحة التحكم */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => navigate("/admin-login")}
            className="text-xs text-violet-300 hover:text-violet-400"
          >
            لوحة التحكم
          </button>
        </div>
      </div>
    </div>
  );
    }

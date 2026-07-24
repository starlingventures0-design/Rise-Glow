import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import type { Girl, GoalKey } from "../types";

const GOAL_TITLES: Record<GoalKey, { title: string; icon: string }> = {
  hair_skin: { title: "شعر صحي وبشرة لامعة", icon: "✨" },
  fitness: { title: "جسم رشيق", icon: "🏃‍♀️" },
  mental_health: { title: "صحة نفسية جيدة", icon: "🧘‍♀️" },
  knowledge: { title: "زيادة الثقافة", icon: "📚" },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [girl, setGirl] = useState<Girl | null>(null);
  const [goals, setGoals] = useState<GoalKey[]>([]);
  const [uploading, setUploading] = useState(false);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: girlRow } = await supabase
      .from("girls")
      .select("*")
      .eq("auth_id", user.id)
      .single();
    if (!girlRow) return;
    setGirl(girlRow);

    const { data: girlGoals } = await supabase
      .from("girl_goals")
      .select("goal_key")
      .eq("girl_id", girlRow.id);
    setGoals((girlGoals || []).map((g) => g.goal_key as GoalKey));

    const { count } = await supabase
      .from("girl_progress")
      .select("*", { count: "exact", head: true })
      .eq("girl_id", girlRow.id)
      .eq("completed", true);
    setTotalCompleted(count || 0);
  }

  async function handlePhotoChange(file: File) {
    if (!girl) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `profile-photos/${girl.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("community-photos")
        .upload(path, file);
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("community-photos").getPublicUrl(path);

      await supabase
        .from("girls")
        .update({ profile_photo_url: pub.publicUrl })
        .eq("id", girl.id);

      setGirl({ ...girl, profile_photo_url: pub.publicUrl });
    } finally {
      setUploading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (!girl) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-violet-50 pb-24">
      <div className="text-center pt-8 pb-4">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-300 to-violet-300 overflow-hidden flex items-center justify-center text-white text-3xl mx-auto">
            {girl.profile_photo_url ? (
              <img src={girl.profile_photo_url} className="w-full h-full object-cover" />
            ) : (
              "🌸"
            )}
          </div>
          <label className="absolute bottom-0 left-0 bg-violet-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs cursor-pointer">
            📷
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePhotoChange(f);
              }}
            />
          </label>
        </div>
        <h1 className="text-lg font-bold text-violet-700 mt-3">{girl.secret_name}</h1>
        <p className="text-rose-500 text-sm">{girl.name} • {girl.age} سنة</p>
        {uploading && <p className="text-xs text-violet-400 mt-1">جاري رفع الصورة...</p>}
      </div>

      <div className="max-w-md mx-auto px-4 space-y-4">
        <div className="bg-white rounded-2xl border border-rose-100 p-4 text-center">
          <p className="text-2xl font-bold text-violet-700">{totalCompleted}</p>
          <p className="text-sm text-rose-500">مهمة أنجزتِها منذ انضمامك</p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 p-4">
          <h3 className="font-semibold text-violet-700 mb-3">أهدافك المختارة</h3>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <span
                key={g}
                className="text-sm bg-rose-50 text-rose-600 rounded-full px-3 py-1.5"
              >
                {GOAL_TITLES[g].icon} {GOAL_TITLES[g].title}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full rounded-xl bg-white border border-rose-200 text-rose-500 py-3 text-sm font-medium"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
      }

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface RankRow {
  girlId: string;
  secretName: string;
  profilePhoto: string | null;
  completedCount: number;
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = الأحد
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myGirlId, setMyGirlId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: me } = await supabase
        .from("girls")
        .select("id")
        .eq("auth_id", user.id)
        .single();
      setMyGirlId(me?.id ?? null);
    }

    const weekStart = getWeekStart().toISOString();

    const { data: progress } = await supabase
      .from("girl_progress")
      .select("girl_id")
      .eq("completed", true)
      .gte("completed_at", weekStart);

    const counts = new Map<string, number>();
    (progress || []).forEach((p) => {
      counts.set(p.girl_id, (counts.get(p.girl_id) || 0) + 1);
    });

    const ids = Array.from(counts.keys());
    let girlsInfo: { id: string; secret_name: string; profile_photo_url: string | null }[] = [];
    if (ids.length > 0) {
      const { data } = await supabase
        .from("girls")
        .select("id, secret_name, profile_photo_url")
        .in("id", ids);
      girlsInfo = data || [];
    }

    const result: RankRow[] = girlsInfo
      .map((g) => ({
        girlId: g.id,
        secretName: g.secret_name,
        profilePhoto: g.profile_photo_url,
        completedCount: counts.get(g.id) || 0,
      }))
      .sort((a, b) => b.completedCount - a.completedCount);

    setRows(result);
    setLoading(false);
  }

  const medal = (index: number) => ["🥇", "🥈", "🥉"][index] || `#${index + 1}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-rose-50 pb-24">
      <header className="pt-6 pb-4 text-center">
        <h1 className="text-xl font-bold text-violet-700">الترتيب الأسبوعي 🏆</h1>
        <p className="text-rose-500 text-sm">يبدأ من كل أحد</p>
      </header>

      <div className="max-w-md mx-auto px-4 space-y-2">
        {loading && <p className="text-violet-400 text-center">جاري التحميل...</p>}
        {!loading && rows.length === 0 && (
          <p className="text-violet-400 text-center">لا يوجد إنجازات هذا الأسبوع بعد</p>
        )}
        {rows.map((r, i) => (
          <div
            key={r.girlId}
            className={`flex items-center gap-3 rounded-2xl p-3 border ${
              r.girlId === myGirlId
                ? "bg-gradient-to-r from-rose-100 to-violet-100 border-rose-300"
                : "bg-white border-rose-100"
            }`}
          >
            <span className="text-lg w-8 text-center">{medal(i)}</span>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-300 to-violet-300 overflow-hidden flex items-center justify-center text-white">
              {r.profilePhoto ? (
                <img src={r.profilePhoto} className="w-full h-full object-cover" />
              ) : (
                "🌸"
              )}
            </div>
            <p className="flex-1 text-sm font-medium text-violet-700">{r.secretName}</p>
            <p className="text-sm text-rose-500">{r.completedCount} مهمة</p>
          </div>
        ))}
      </div>
    </div>
  );
    }

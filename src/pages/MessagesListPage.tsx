import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

interface Conversation {
  girlId: string;
  secretName: string;
  profilePhoto: string | null;
  lastMessage: string;
  lastAt: string;
}

export default function MessagesListPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: me } = await supabase
      .from("girls")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!me) {
      setLoading(false);
      return;
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
      .order("created_at", { ascending: false });

    const seen = new Map<string, Conversation>();
    for (const m of msgs || []) {
      const otherId = m.sender_id === me.id ? m.receiver_id : m.sender_id;
      if (!seen.has(otherId)) {
        seen.set(otherId, {
          girlId: otherId,
          secretName: "",
          profilePhoto: null,
          lastMessage: m.content,
          lastAt: m.created_at,
        });
      }
    }

    const ids = Array.from(seen.keys());
    if (ids.length > 0) {
      const { data: girls } = await supabase
        .from("girls")
        .select("id, secret_name, profile_photo_url")
        .in("id", ids);
      girls?.forEach((g) => {
        const conv = seen.get(g.id);
        if (conv) {
          conv.secretName = g.secret_name;
          conv.profilePhoto = g.profile_photo_url;
        }
      });
    }

    setConversations(Array.from(seen.values()));
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-violet-50 pb-24">
      <header className="pt-6 pb-4 text-center">
        <h1 className="text-xl font-bold text-violet-700">الرسائل 💌</h1>
      </header>

      <div className="max-w-md mx-auto px-4 space-y-2">
        {loading && <p className="text-violet-400 text-center">جاري التحميل...</p>}
        {!loading && conversations.length === 0 && (
          <p className="text-violet-400 text-center">لا يوجد محادثات بعد</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.girlId}
            onClick={() => navigate(`/chat/${c.girlId}`)}
            className="w-full text-right bg-white rounded-2xl border border-rose-100 p-3 flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-300 to-violet-300 flex items-center justify-center text-white overflow-hidden shrink-0">
              {c.profilePhoto ? (
                <img src={c.profilePhoto} className="w-full h-full object-cover" />
              ) : (
                "🌸"
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-violet-700">{c.secretName}</p>
              <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
                     }

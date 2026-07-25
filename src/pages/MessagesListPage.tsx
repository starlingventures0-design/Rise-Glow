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

interface SearchResult {
  id: string;
  secret_name: string;
  profile_photo_url: string | null;
}

export default function MessagesListPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function search() {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("girls")
      .select("id, secret_name, profile_photo_url")
      .ilike("secret_name", `%${query.trim()}%`)
      .eq("status", "approved")
      .limit(10);
    setResults(data || []);
    setSearching(false);
  }

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

      {/* مربع البحث عن فتاة لبدء محادثة جديدة */}
      <div className="max-w-md mx-auto px-4 mb-4">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="ابحثي عن فتاة بالاسم السري..."
            className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          <button
            onClick={search}
            className="px-4 py-2 rounded-full bg-violet-600 text-white text-sm shrink-0"
          >
            بحث
          </button>
        </div>

        {searching && <p className="text-violet-400 text-sm text-center mt-2">جاري البحث...</p>}

        {results.length > 0 && (
          <div className="mt-2 space-y-2">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/chat/${r.id}`)}
                className="w-full text-right bg-white rounded-2xl border border-violet-100 p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-violet-300 flex items-center justify-center text-white overflow-hidden shrink-0">
                  {r.profile_photo_url ? (
                    <img src={r.profile_photo_url} className="w-full h-full object-cover" />
                  ) : (
                    "🌸"
                  )}
                </div>
                <p className="text-sm font-medium text-violet-700">{r.secret_name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 space-y-2">
        {loading && <p className="text-violet-400 text-center">جاري التحميل...</p>}
        {!loading && conversations.length === 0 && results.length === 0 && (
          <p className="text-violet-400 text-center">لا يوجد محادثات بعد، ابحثي عن فتاة لتبدئي معها</p>
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

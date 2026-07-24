import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

interface PostWithGirl {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  girl_id: string;
  girls: {
    secret_name: string;
    profile_photo_url: string | null;
  };
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<PostWithGirl[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
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

    const { data } = await supabase
      .from("community_posts")
      .select("id, content, image_url, created_at, girl_id, girls ( secret_name, profile_photo_url )")
      .order("created_at", { ascending: false });

    setPosts((data as unknown as PostWithGirl[]) || []);
    setLoading(false);
  }

  async function handlePost() {
    if (!myGirlId || (!content.trim() && !image)) return;
    setPosting(true);
    try {
      let imageUrl: string | null = null;
      if (image) {
        const ext = image.name.split(".").pop();
        const path = `community/${myGirlId}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("community-photos")
          .upload(path, image);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("community-photos").getPublicUrl(path);
        imageUrl = pub.publicUrl;
      }

      await supabase.from("community_posts").insert({
        girl_id: myGirlId,
        content: content.trim() || null,
        image_url: imageUrl,
      });

      setContent("");
      setImage(null);
      load();
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-violet-50 pb-24">
      <header className="pt-6 pb-4 text-center">
        <h1 className="text-xl font-bold text-violet-700">مجتمع رانيا 💬</h1>
        <p className="text-rose-500 text-sm">شاركي تجربتك مع الفتيات</p>
      </header>

      <div className="max-w-md mx-auto px-4 mb-5">
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="شاركي ماذا جربتِ وكيف كانت النتيجة..."
            className="w-full text-sm border border-rose-100 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
            rows={3}
          />
          <div className="flex items-center justify-between mt-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="text-xs text-violet-600"
            />
            <button
              onClick={handlePost}
              disabled={posting}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-400 to-violet-400 text-white text-sm font-medium disabled:opacity-60"
            >
              {posting ? "جاري النشر..." : "نشر"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 space-y-4">
        {loading && <p className="text-violet-400 text-center">جاري التحميل...</p>}
        {!loading && posts.length === 0 && (
          <p className="text-violet-400 text-center">كوني أول من تشارك اليوم 🌸</p>
        )}
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-violet-300 flex items-center justify-center text-white text-sm overflow-hidden">
                {post.girls?.profile_photo_url ? (
                  <img src={post.girls.profile_photo_url} className="w-full h-full object-cover" />
                ) : (
                  "🌸"
                )}
              </div>
              <p className="text-sm font-medium text-violet-700">{post.girls?.secret_name}</p>
            </div>
            {post.image_url && (
              <img
                src={post.image_url}
                className="w-full rounded-xl mb-2 max-h-72 object-cover"
              />
            )}
            {post.content && <p className="text-sm text-gray-700">{post.content}</p>}
          </div>
        ))}
      </div>
    </div>
  );
                 }

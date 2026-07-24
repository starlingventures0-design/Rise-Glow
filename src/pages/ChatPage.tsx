import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const { girlId } = useParams<{ girlId: string }>();
  const navigate = useNavigate();

  const [myId, setMyId] = useState<string | null>(null);
  const [otherName, setOtherName] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [girlId]);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !girlId) return;

    const { data: me } = await supabase
      .from("girls")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!me) return;
    setMyId(me.id);

    const { data: other } = await supabase
      .from("girls")
      .select("secret_name")
      .eq("id", girlId)
      .single();
    if (other) setOtherName(other.secret_name);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${me.id},receiver_id.eq.${girlId}),and(sender_id.eq.${girlId},receiver_id.eq.${me.id})`
      )
      .order("created_at", { ascending: true });

    setMessages(msgs || []);
  }

  async function send() {
    if (!myId || !girlId || !text.trim()) return;
    const content = text.trim();
    setText("");
    await supabase.from("messages").insert({
      sender_id: myId,
      receiver_id: girlId,
      content,
    });
    load();
  }

  async function submitReport() {
    if (!myId || !girlId) return;
    await supabase.from("reports").insert({
      reporter_id: myId,
      reported_id: girlId,
      reason: reportReason.trim() || "محادثة غير لائقة",
    });
    setReportSent(true);
    setShowReport(false);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-rose-50 to-violet-50">
      <header className="bg-white border-b border-rose-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-violet-500">
            →
          </button>
          <p className="font-semibold text-violet-700">{otherName}</p>
        </div>
        <button
          onClick={() => setShowReport(true)}
          className="text-xs text-red-500 border border-red-200 rounded-full px-3 py-1"
        >
          🚩 إبلاغ
        </button>
      </header>

      {reportSent && (
        <p className="bg-green-50 text-green-600 text-sm text-center py-2">
          تم إرسال البلاغ، سيتم مراجعته من الإدارة
        </p>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              m.sender_id === myId
                ? "bg-gradient-to-r from-rose-400 to-violet-400 text-white mr-auto"
                : "bg-white border border-rose-100 text-gray-700 ml-auto"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div className="bg-white border-t border-rose-100 p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="اكتبي رسالتك..."
          className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-full bg-violet-600 text-white text-sm"
        >
          إرسال
        </button>
      </div>

      {showReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-20">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-violet-700">الإبلاغ عن {otherName}</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="اكتبي سبب البلاغ (اختياري)"
              className="w-full text-sm border border-rose-200 rounded-xl px-3 py-2 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={submitReport}
                className="flex-1 rounded-xl bg-red-500 text-white py-2 text-sm"
              >
                إرسال البلاغ
              </button>
              <button
                onClick={() => setShowReport(false)}
                className="flex-1 rounded-xl bg-gray-100 text-gray-600 py-2 text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
          }

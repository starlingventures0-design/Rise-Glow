import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Tab = "pending" | "search" | "reports";

function authHeaders() {
  const token = localStorage.getItem("admin_token");
  return { "Content-Type": "application/json", "x-admin-token": token || "" };
}

interface PendingGirl {
  id: string;
  name: string;
  age: number;
  secret_name: string;
  follow_photo_url: string;
  status: string;
}

interface SearchGirl {
  id: string;
  name: string;
  age: number;
  secret_name: string;
  status: string;
  profile_photo_url: string | null;
}

interface GirlDetail {
  girl: SearchGirl & { follow_photo_url: string };
  posts: { id: string; content: string | null; image_url: string | null; created_at: string }[];
}

interface ReportRow {
  id: string;
  reason: string | null;
  status: string;
  created_at: string;
  reporter: { id: string; name: string; secret_name: string };
  reported: { id: string; name: string; secret_name: string };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("pending");

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) navigate("/admin-login");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-rose-50">
      <header className="bg-white border-b border-violet-100 px-4 py-4 flex items-center justify-between">
        <h1 className="font-bold text-violet-700">لوحة تحكم عالم رانيا</h1>
        <button
          onClick={() => {
            localStorage.removeItem("admin_token");
            navigate("/admin-login");
          }}
          className="text-sm text-rose-500"
        >
          خروج
        </button>
      </header>

      <nav className="flex gap-2 px-4 py-3 bg-white border-b border-violet-100 sticky top-0 z-10">
        {[
          { key: "pending", label: "الحسابات المعلّقة" },
          { key: "search", label: "البحث عن فتاة" },
          { key: "reports", label: "البلاغات" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              tab === t.key
                ? "bg-violet-600 text-white"
                : "bg-violet-50 text-violet-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="p-4">
        {tab === "pending" && <PendingGirlsTab />}
        {tab === "search" && <SearchGirlsTab />}
        {tab === "reports" && <ReportsTab />}
      </main>
    </div>
  );
}

function PendingGirlsTab() {
  const [girls, setGirls] = useState<PendingGirl[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pending-girls", { headers: authHeaders() });
    const data = await res.json();
    setGirls(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, action: "approve" | "ban") => {
    await fetch(`/api/admin/girls/${id}/${action}`, {
      method: "POST",
      headers: authHeaders(),
    });
    load();
  };

  if (loading) return <p className="text-violet-500">جاري التحميل...</p>;
  if (girls.length === 0)
    return <p className="text-violet-400">لا يوجد حسابات بانتظار المراجعة 🎉</p>;

  return (
    <div className="space-y-4">
      {girls.map((g) => (
        <div
          key={g.id}
          className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 flex gap-4 items-center"
        >
          <img
            src={g.follow_photo_url}
            alt="صورة المتابعة"
            className="w-24 h-24 object-cover rounded-xl border border-rose-200"
          />
          <div className="flex-1">
            <p className="font-semibold text-violet-700">{g.name} ({g.age} سنة)</p>
            <p className="text-sm text-rose-500">الاسم السري: {g.secret_name}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => act(g.id, "approve")}
                className="px-3 py-1.5 rounded-full bg-green-500 text-white text-sm"
              >
                ✓ الصورة صحيحة
              </button>
              <button
                onClick={() => act(g.id, "ban")}
                className="px-3 py-1.5 rounded-full bg-red-500 text-white text-sm"
              >
                ✕ حظر الحساب
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchGirlsTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchGirl[]>([]);
  const [detail, setDetail] = useState<GirlDetail | null>(null);

  const search = async () => {
    const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
      headers: authHeaders(),
    });
    setResults(await res.json());
  };

  const openGirl = async (id: string) => {
    const res = await fetch(`/api/admin/girls/${id}`, { headers: authHeaders() });
    setDetail(await res.json());
  };

  const act = async (id: string, action: "approve" | "ban" | "warn") => {
    await fetch(`/api/admin/girls/${id}/${action}`, {
      method: "POST",
      headers: authHeaders(),
    });
    openGirl(id);
  };

  if (detail) {
    return (
      <div>
        <button
          onClick={() => setDetail(null)}
          className="text-sm text-violet-500 mb-3"
        >
          ← رجوع للبحث
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 mb-4">
          <div className="flex items-center gap-4">
            <img
              src={detail.girl.profile_photo_url || detail.girl.follow_photo_url}
              className="w-20 h-20 rounded-full object-cover border border-rose-200"
            />
            <div>
              <p className="font-bold text-violet-700">{detail.girl.name}</p>
              <p className="text-sm text-rose-500">الاسم السري: {detail.girl.secret_name}</p>
              <p className="text-xs text-violet-400">الحالة: {detail.girl.status}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => act(detail.girl.id, "warn")}
              className="px-3 py-1.5 rounded-full bg-amber-400 text-white text-sm"
            >
              تحذير
            </button>
            <button
              onClick={() => act(detail.girl.id, "ban")}
              className="px-3 py-1.5 rounded-full bg-red-500 text-white text-sm"
            >
              حظر
            </button>
          </div>
        </div>

        <h3 className="font-semibold text-violet-700 mb-2">منشوراتها في المجتمع</h3>
        <div className="space-y-3">
          {detail.posts.length === 0 && (
            <p className="text-violet-400 text-sm">لا يوجد منشورات</p>
          )}
          {detail.posts.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-rose-100 p-3">
              {p.image_url && (
                <img src={p.image_url} className="w-full rounded-lg mb-2 max-h-64 object-cover" />
              )}
              {p.content && <p className="text-sm text-gray-700">{p.content}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="اسم الفتاة أو اسمها السري"
          className="flex-1 rounded-xl border border-violet-200 px-3 py-2 text-sm"
        />
        <button
          onClick={search}
          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm"
        >
          بحث
        </button>
      </div>
      <div className="space-y-2">
        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => openGirl(r.id)}
            className="w-full text-right bg-white rounded-xl border border-rose-100 p-3 flex items-center gap-3"
          >
            <img
              src={r.profile_photo_url || undefined}
              className="w-10 h-10 rounded-full bg-rose-100 object-cover"
            />
            <div>
              <p className="text-sm font-medium text-violet-700">{r.name}</p>
              <p className="text-xs text-rose-500">{r.secret_name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReportsTab() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [openReport, setOpenReport] = useState<ReportRow | null>(null);
  const [conversation, setConversation] = useState<
    { id: string; sender_id: string; content: string; created_at: string }[]
  >([]);

  const load = async () => {
    const res = await fetch("/api/admin/reports", { headers: authHeaders() });
    setReports(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const openConversation = async (report: ReportRow) => {
    setOpenReport(report);
    const res = await fetch(`/api/admin/reports/${report.id}/conversation`, {
      headers: authHeaders(),
    });
    setConversation(await res.json());
  };

  const resolve = async (action: "ban" | "dismiss") => {
    if (!openReport) return;
    await fetch(`/api/admin/reports/${openReport.id}/resolve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ action }),
    });
    setOpenReport(null);
    load();
  };

  if (openReport) {
    return (
      <div>
        <button onClick={() => setOpenReport(null)} className="text-sm text-violet-500 mb-3">
          ← رجوع للبلاغات
        </button>
        <div className="bg-white rounded-2xl border border-rose-100 p-4 mb-4">
          <p className="text-sm">
            <span className="font-semibold text-violet-700">المبلّغة:</span>{" "}
            {openReport.reporter.name} ({openReport.reporter.secret_name})
          </p>
          <p className="text-sm">
            <span className="font-semibold text-violet-700">المُبلّغ عنها:</span>{" "}
            {openReport.reported.name} ({openReport.reported.secret_name})
          </p>
          {openReport.reason && (
            <p className="text-sm text-rose-500 mt-1">السبب: {openReport.reason}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 p-4 mb-4 max-h-80 overflow-y-auto space-y-2">
          {conversation.map((m) => (
            <div
              key={m.id}
              className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                m.sender_id === openReport.reported.id
                  ? "bg-rose-100 ml-auto"
                  : "bg-violet-100"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => resolve("ban")}
            className="flex-1 rounded-xl bg-red-500 text-white py-2.5 text-sm"
          >
            حظر المُبلّغ عنها
          </button>
          <button
            onClick={() => resolve("dismiss")}
            className="flex-1 rounded-xl bg-gray-200 text-gray-700 py-2.5 text-sm"
          >
            رفض البلاغ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.length === 0 && <p className="text-violet-400">لا يوجد بلاغات حالياً</p>}
      {reports.map((r) => (
        <button
          key={r.id}
          onClick={() => openConversation(r)}
          className="w-full text-right bg-white rounded-xl border border-rose-100 p-3"
        >
          <p className="text-sm">
            <span className="font-medium text-violet-700">{r.reporter.secret_name}</span>
            {" أبلغت عن "}
            <span className="font-medium text-rose-600">{r.reported.secret_name}</span>
          </p>
          <p className="text-xs text-violet-400 mt-1">الحالة: {r.status}</p>
        </button>
      ))}
    </div>
  );
          }

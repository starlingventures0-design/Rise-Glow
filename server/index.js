import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// عرض ملفات الموقع المبنية (React) من مجلد dist
app.use(express.static(path.join(__dirname, "..", "dist")));

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TOKEN_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

function expectedToken() {
  return crypto
    .createHash("sha256")
    .update(`${ADMIN_EMAIL}:${ADMIN_PASSWORD}:${TOKEN_SECRET}`)
    .digest("hex");
}

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== expectedToken()) {
    return res.status(401).json({ error: "غير مصرح لك بالدخول" });
  }
  next();
}

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({ token: expectedToken() });
  }
  return res.status(401).json({ error: "الإيميل أو كلمة المرور غير صحيحة" });
});

app.get("/api/admin/pending-girls", requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("girls")
    .select("id, name, age, secret_name, follow_photo_url, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/admin/girls/:id/approve", requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin
    .from("girls")
    .update({ status: "approved" })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post("/api/admin/girls/:id/ban", requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin
    .from("girls")
    .update({ status: "banned" })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post("/api/admin/girls/:id/warn", requireAdmin, async (req, res) => {
  const { error } = await supabaseAdmin
    .from("girls")
    .update({ status: "warned" })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.get("/api/admin/search", requireAdmin, async (req, res) => {
  const q = req.query.q || "";
  const { data, error } = await supabaseAdmin
    .from("girls")
    .select("id, name, age, secret_name, status, profile_photo_url")
    .or(`name.ilike.%${q}%,secret_name.ilike.%${q}%`)
    .limit(20);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/admin/girls/:id", requireAdmin, async (req, res) => {
  const { data: girl, error: girlError } = await supabaseAdmin
    .from("girls")
    .select("*")
    .eq("id", req.params.id)
    .single();
  if (girlError) return res.status(500).json({ error: girlError.message });

  const { data: posts, error: postsError } = await supabaseAdmin
    .from("community_posts")
    .select("*")
    .eq("girl_id", req.params.id)
    .order("created_at", { ascending: false });
  if (postsError) return res.status(500).json({ error: postsError.message });

  res.json({ girl, posts });
});

app.get("/api/admin/reports", requireAdmin, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .select(
      `id, reason, status, created_at,
       reporter:reporter_id ( id, name, secret_name ),
       reported:reported_id ( id, name, secret_name )`
    )
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/admin/reports/:id/conversation", requireAdmin, async (req, res) => {
  const { data: report, error: reportError } = await supabaseAdmin
    .from("reports")
    .select("reporter_id, reported_id")
    .eq("id", req.params.id)
    .single();
  if (reportError) return res.status(500).json({ error: reportError.message });

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${report.reporter_id},receiver_id.eq.${report.reported_id}),and(sender_id.eq.${report.reported_id},receiver_id.eq.${report.reporter_id})`
    )
    .order("created_at", { ascending: true });
  if (messagesError) return res.status(500).json({ error: messagesError.message });

  res.json(messages);
});

app.post("/api/admin/reports/:id/resolve", requireAdmin, async (req, res) => {
  const { action } = req.body;

  const { data: report, error: reportError } = await supabaseAdmin
    .from("reports")
    .select("reported_id")
    .eq("id", req.params.id)
    .single();
  if (reportError) return res.status(500).json({ error: reportError.message });

  if (action === "ban") {
    await supabaseAdmin
      .from("girls")
      .update({ status: "banned" })
      .eq("id", report.reported_id);
  }

  const { error: updateError } = await supabaseAdmin
    .from("reports")
    .update({ status: action === "ban" ? "banned" : "dismissed" })
    .eq("id", req.params.id);
  if (updateError) return res.status(500).json({ error: updateError.message });

  res.json({ success: true });
});

// أي رابط غير /api يوديه لصفحة الموقع الرئيسية (عشان React Router يتحكم بالتنقل)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ سيرفر الأدمن يعمل على المنفذ ${PORT}`);
});

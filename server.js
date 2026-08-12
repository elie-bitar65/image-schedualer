const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_PASSWORD) {
  console.error("Missing required environment variables.");
  console.error("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

function isValidTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeSchedule(schedule) {
  if (!Array.isArray(schedule)) return [];
  return [...new Set(schedule.filter(isValidTime))].sort();
}

// Public retrieval endpoint
app.get("/api/config", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("device_config")
      .select("image_base64,schedule,updated_at")
      .eq("id", 1)
      .single();

    if (error) throw error;

    res.json({
      image: data?.image_base64 || null,
      schedule: Array.isArray(data?.schedule) ? data.schedule : [],
      updatedAt: data?.updated_at || null
    });
  } catch (err) {
    console.error("GET /api/config:", err);
    res.status(500).json({ error: "Could not load configuration." });
  }
});

// Password-protected save endpoint
app.post("/api/save", async (req, res) => {
  try {
    const suppliedPassword = req.get("x-admin-password");

    if (suppliedPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Wrong admin password." });
    }

    const { image, schedule } = req.body;

    if (typeof image !== "string" || !image.startsWith("data:image/bmp;base64,")) {
      return res.status(400).json({ error: "Please upload a BMP image." });
    }

    const normalizedSchedule = normalizeSchedule(schedule);

    const { error } = await supabase
      .from("device_config")
      .upsert(
        {
          id: 1,
          image_base64: image,
          schedule: normalizedSchedule,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );

    if (error) throw error;

    res.json({
      ok: true,
      schedule: normalizedSchedule
    });
  } catch (err) {
    console.error("POST /api/save:", err);
    res.status(500).json({ error: "Could not save configuration." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
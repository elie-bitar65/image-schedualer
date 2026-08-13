const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_PASSWORD) {
  console.error("Missing environment variables.");
  console.error("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

app.use(express.json({ limit: "25mb" }));

app.use(express.static(path.join(__dirname, "public")));

/*
==================================================
HELPER: CURRENT DATE/TIME
==================================================
*/

function getCurrentDateTime(timeZone = "Asia/Beirut") {

  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  return {
    dateNow: dateFormatter.format(now),
    timeNow: timeFormatter.format(now)
  };
}

/*
==================================================
GET STORED CONFIG
==================================================
*/

async function getStoredConfig() {

  const { data, error } = await supabase
    .from("device_config")
    .select("config,updated_at")
    .eq("id", 1)
    .single();

  if (error) {
    throw error;
  }

  return {
    config: data?.config || {},
    updatedAt: data?.updated_at || null
  };
}

/*
==================================================
PRODUCTION API
GET /api/config

Returns only what the ESP32 needs.
No HEX debug array.
==================================================
*/

app.get("/api/config", async (req, res) => {

  try {

    const { config, updatedAt } = await getStoredConfig();

    const requestedTimeZone = req.get("timezone") || "Asia/Beirut";

    const { timeNow, dateNow } = getCurrentDateTime(requestedTimeZone);

    const response = {
      width: config.width,
      height: config.height,
      displayMode: config.displayMode,
      bitOrder: config.bitOrder,
      packing: config.packing,
      rotation: config.rotation,
      threshold: config.threshold,
      dithering: config.dithering,
      invert: config.invert,
      schedule: config.schedule || [],
      timeNow: timeNow,
      dateNow: dateNow,
      updatedAt: updatedAt
    };

    /*
    ------------------------------------------
    SINGLE IMAGE MODE
    ------------------------------------------
    */

    if (config.image) {

      const rawBuffer = Buffer.from(config.image, "base64");

      response.imageBase64 = config.image;
      response.rawByteLength = rawBuffer.length;
    }

    /*
    ------------------------------------------
    COLORED DUAL-PLANE MODE
    ------------------------------------------
    */

    if (config.blackPlane) {

      const blackBuffer = Buffer.from(config.blackPlane, "base64");

      response.blackPlaneBase64 = config.blackPlane;
      response.blackPlaneRawByteLength = blackBuffer.length;
    }

    if (config.accentPlane) {

      const accentBuffer = Buffer.from(config.accentPlane, "base64");

      response.accentPlaneBase64 = config.accentPlane;
      response.accentPlaneRawByteLength = accentBuffer.length;
      response.accentColor = config.accentColor || null;
    }

    if (config.blackPlane || config.accentPlane) {

      response.totalRawByteLength =
        (response.blackPlaneRawByteLength || 0) +
        (response.accentPlaneRawByteLength || 0);
    }

    res.json(response);

  } catch (err) {

    console.error("GET /api/config:", err);

    res.status(500).json({
      error: "Could not load configuration."
    });
  }
});

/*
==================================================
DEBUG API
GET /api/debug

Returns Base64 + full HEX data.
Use only for debugging in browser.
==================================================
*/

app.get("/api/debug", async (req, res) => {

  try {

    const { config, updatedAt } = await getStoredConfig();

    const requestedTimeZone = req.get("timezone") || "Asia/Beirut";

    const { timeNow, dateNow } = getCurrentDateTime(requestedTimeZone);

    const response = {
      width: config.width,
      height: config.height,
      displayMode: config.displayMode,
      bitOrder: config.bitOrder,
      packing: config.packing,
      rotation: config.rotation,
      threshold: config.threshold,
      dithering: config.dithering,
      invert: config.invert,
      schedule: config.schedule || [],
      timeNow: timeNow,
      dateNow: dateNow,
      updatedAt: updatedAt
    };

    /*
    ------------------------------------------
    SINGLE IMAGE DEBUG
    ------------------------------------------
    */

    if (config.image) {

      const rawBuffer = Buffer.from(config.image, "base64");

      response.imageBase64 = config.image;

      response.base64CharacterLength = config.image.length;

      response.base64TextByteLength = Buffer.byteLength(
        config.image,
        "utf8"
      );

      response.rawByteLength = rawBuffer.length;

      response.base64DecodedByteLength = rawBuffer.length;

      response.rawDataHex = Array.from(rawBuffer).map(
        byte => byte.toString(16).padStart(2, "0").toUpperCase()
      );

      response.rawDataHexCount = response.rawDataHex.length;
    }

    /*
    ------------------------------------------
    BLACK PLANE DEBUG
    ------------------------------------------
    */

    if (config.blackPlane) {

      const blackBuffer = Buffer.from(config.blackPlane, "base64");

      response.blackPlaneBase64 = config.blackPlane;

      response.blackPlaneBase64CharacterLength = config.blackPlane.length;

      response.blackPlaneBase64TextByteLength = Buffer.byteLength(
        config.blackPlane,
        "utf8"
      );

      response.blackPlaneRawByteLength = blackBuffer.length;

      response.blackPlaneRawHex = Array.from(blackBuffer).map(
        byte => byte.toString(16).padStart(2, "0").toUpperCase()
      );

      response.blackPlaneRawHexCount = response.blackPlaneRawHex.length;
    }

    /*
    ------------------------------------------
    ACCENT PLANE DEBUG
    ------------------------------------------
    */

    if (config.accentPlane) {

      const accentBuffer = Buffer.from(config.accentPlane, "base64");

      response.accentPlaneBase64 = config.accentPlane;

      response.accentPlaneBase64CharacterLength = config.accentPlane.length;

      response.accentPlaneBase64TextByteLength = Buffer.byteLength(
        config.accentPlane,
        "utf8"
      );

      response.accentPlaneRawByteLength = accentBuffer.length;

      response.accentPlaneRawHex = Array.from(accentBuffer).map(
        byte => byte.toString(16).padStart(2, "0").toUpperCase()
      );

      response.accentPlaneRawHexCount = response.accentPlaneRawHex.length;

      response.accentColor = config.accentColor || null;
    }

    if (config.blackPlane || config.accentPlane) {

      response.totalRawByteLength =
        (response.blackPlaneRawByteLength || 0) +
        (response.accentPlaneRawByteLength || 0);
    }

    res.json(response);

  } catch (err) {

    console.error("GET /api/debug:", err);

    res.status(500).json({
      error: "Could not load debug configuration."
    });
  }
});

/*
==================================================
SAVE API
POST /api/save
==================================================
*/

app.post("/api/save", async (req, res) => {

  try {

    const suppliedPassword = req.get("x-admin-password");

    if (suppliedPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({
        error: "Wrong admin password."
      });
    }

    const config = req.body?.config;

    if (!config || typeof config !== "object") {
      return res.status(400).json({
        error: "Missing config object."
      });
    }

    if (
      !Number.isInteger(config.width) ||
      !Number.isInteger(config.height) ||
      config.width < 1 ||
      config.height < 1
    ) {
      return res.status(400).json({
        error: "Invalid display dimensions."
      });
    }

    if (!Array.isArray(config.schedule)) {
      return res.status(400).json({
        error: "Schedule must be an array."
      });
    }

    const allowedTime = /^([01]\d|2[0-3]):[0-5]\d$/;

    config.schedule = [
      ...new Set(
        config.schedule.filter(
          time => typeof time === "string" && allowedTime.test(time)
        )
      )
    ].sort();

    const { error } = await supabase
      .from("device_config")
      .upsert(
        {
          id: 1,
          config: config,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "id"
        }
      );

    if (error) {
      throw error;
    }

    res.json({
      ok: true,
      schedule: config.schedule
    });

  } catch (err) {

    console.error("POST /api/save:", err);

    res.status(500).json({
      error: "Could not save configuration."
    });
  }
});

/*
==================================================
START SERVER
==================================================
*/

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const app = express();
const PORT = process.env.PORT || 3000;
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSWORD } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_PASSWORD) {
  console.error("Missing required environment variables."); process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});
app.use(express.json({limit:"25mb"}));
app.use(express.static(path.join(__dirname,"public")));
app.get("/api/config", async (_req,res)=>{
  try {
    const {data,error}=await supabase.from("device_config").select("config,updated_at").eq("id",1).single();
    if(error) throw error;
    res.json({...((data&&data.config)||{}), updatedAt:data&&data.updated_at||null});
  } catch(e){ console.error(e); res.status(500).json({error:"Could not load configuration."}); }
});
app.post("/api/save", async (req,res)=>{
  try {
    if(req.get("x-admin-password")!==ADMIN_PASSWORD) return res.status(401).json({error:"Wrong admin password."});
    const config=req.body&&req.body.config;
    if(!config||typeof config!=="object") return res.status(400).json({error:"Missing config object."});
    if(!Number.isInteger(config.width)||!Number.isInteger(config.height)||config.width<1||config.height<1)
      return res.status(400).json({error:"Invalid display dimensions."});
    if(!Array.isArray(config.schedule)) return res.status(400).json({error:"Schedule must be an array."});
    const re=/^([01]\d|2[0-3]):[0-5]\d$/;
    config.schedule=[...new Set(config.schedule.filter(t=>typeof t==="string"&&re.test(t)))].sort();
    const {error}=await supabase.from("device_config").upsert({id:1,config,updated_at:new Date().toISOString()},{onConflict:"id"});
    if(error) throw error;
    res.json({ok:true,schedule:config.schedule});
  } catch(e){ console.error(e); res.status(500).json({error:"Could not save configuration."}); }
});
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));

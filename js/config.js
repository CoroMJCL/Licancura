// js/config.js
// ─────────────────────────────────────────────────────────────
// Configuración de Supabase
// Estos valores son públicos (anon key) — seguros para el frontend
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://oqvetqpowbphesbirupd.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_3lZyAjovwn2LIAbdLeXZmw_9mzB4QY0';
const STORAGE_URL   = `${SUPABASE_URL}/storage/v1/object/public/proyectos/`;

// Cliente Supabase (cargado desde CDN en el HTML)
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

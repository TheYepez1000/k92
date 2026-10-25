/**
 * UNIDAD CANINA K9 - API SERVERLESS DE SINCRONIZACIÓN EN LA NUBE (VERCEL)
 * Permite almacenar y sincronizar el estado global de la unidad K9 entre
 * múltiples navegadores, ordenadores y dispositivos en tiempo real.
 *
 * Compatible con:
 * - Vercel KV / Upstash Redis (variables KV_REST_API_URL o UPSTASH_REDIS_REST_URL)
 * - Memoria del proceso Serverless en ejecución con fusión inteligente (Smart Merge)
 */

let memoryStore = {
  users: [],
  presets: [],
  dogs: [],
  dogRequests: [],
  announcements: [],
  disciplinary: [],
  reports: [],
  badges: [],
  webhookUrl: null,
  updatedAt: Date.now()
};

function mergeDatasets(existing, incoming) {
  if (!existing) existing = {};
  if (!incoming) return existing;

  const result = Object.assign({}, existing);

  // 1. Fusión de Usuarios por discordId o id
  if (Array.isArray(incoming.users)) {
    const userMap = new Map();
    (existing.users || []).forEach(u => {
      const key = u.discordId || u.id;
      if (key) userMap.set(key, u);
    });
    incoming.users.forEach(u => {
      const key = u.discordId || u.id;
      if (!key) return;
      const prev = userMap.get(key);
      if (prev) {
        // Mantener rango asignado si ya estaba verificado
        const merged = Object.assign({}, prev, u);
        if (prev.isVerified && (!u.isVerified || u.rank === 'Sin Rango Asignado')) {
          merged.rank = prev.rank;
          merged.placa = prev.placa;
          merged.isVerified = true;
          merged.isJefatura = prev.isJefatura;
          merged.permissions = prev.permissions;
        }
        userMap.set(key, merged);
      } else {
        userMap.set(key, u);
      }
    });
    result.users = Array.from(userMap.values());
  }

  // 2. Fusión de Presets por discordId
  if (Array.isArray(incoming.presets)) {
    const presetMap = new Map();
    (existing.presets || []).forEach(p => { if (p.discordId) presetMap.set(p.discordId, p); });
    incoming.presets.forEach(p => { if (p.discordId) presetMap.set(p.discordId, p); });
    result.presets = Array.from(presetMap.values());
  }

  // 3. Canes K9 (Jefatura autoritativa: si viene en incoming, actualiza la lista respetando bajas y eliminaciones)
  if (Array.isArray(incoming.dogs)) {
    result.dogs = incoming.dogs;
  }

  // 4. Fusión de Solicitudes de Canes por id
  if (Array.isArray(incoming.dogRequests)) {
    result.dogRequests = incoming.dogRequests;
  }

  // 5. Expedientes Disciplinarios (Jefatura autoritativa: respeta eliminaciones)
  if (Array.isArray(incoming.disciplinary)) {
    result.disciplinary = incoming.disciplinary;
  }

  // 6. Fusión de Informes por id
  if (Array.isArray(incoming.reports)) {
    const repMap = new Map();
    (existing.reports || []).forEach(r => { if (r.id) repMap.set(r.id, r); });
    incoming.reports.forEach(r => { if (r.id) repMap.set(r.id, r); });
    result.reports = Array.from(repMap.values());
  }

  // 7. Comunicados oficiales
  if (Array.isArray(incoming.announcements)) {
    result.announcements = incoming.announcements;
  }

  // 8. Mensajes de Chat de Despacho con Jefatura
  if (Array.isArray(incoming.chatMessages)) {
    const msgMap = new Map();
    (existing.chatMessages || []).forEach(m => { if (m.id) msgMap.set(m.id, m); });
    incoming.chatMessages.forEach(m => { if (m.id) msgMap.set(m.id, m); });
    result.chatMessages = Array.from(msgMap.values()).slice(-60);
  }

  // 9. Badges y Webhook
  if (Array.isArray(incoming.badges) && incoming.badges.length > 0) {
    result.badges = incoming.badges;
  }
  if (incoming.webhookUrl) {
    result.webhookUrl = incoming.webhookUrl;
  }

  result.updatedAt = Date.now();
  return result;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // Si existe Vercel KV o Upstash Redis configurado
  if (kvUrl && kvToken) {
    try {
      if (req.method === 'POST' || req.method === 'PUT') {
        const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        // Leer estado actual de KV
        const getRes = await fetch(`${kvUrl}/get/k9_shared_database`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        const getJson = await getRes.json();
        let existing = {};
        if (getJson && getJson.result) {
          existing = typeof getJson.result === 'string' ? JSON.parse(getJson.result) : getJson.result;
        }

        // Fusionar inteligente
        const merged = mergeDatasets(existing, incoming);
        memoryStore = merged;

        await fetch(`${kvUrl}/set/k9_shared_database`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kvToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(merged)
        });

        return res.status(200).json({ ok: true, source: 'kv_merged', data: merged });
      } else {
        const getRes = await fetch(`${kvUrl}/get/k9_shared_database`, {
          headers: { Authorization: `Bearer ${kvToken}` }
        });
        const getJson = await getRes.json();
        let data = null;
        if (getJson && getJson.result) {
          data = typeof getJson.result === 'string' ? JSON.parse(getJson.result) : getJson.result;
        }
        return res.status(200).json(data || memoryStore || {});
      }
    } catch (err) {
      console.error('[API Sync KV Error]:', err);
    }
  }

  // Fallback: Memoria del proceso Serverless con fusión inteligente
  if (req.method === 'POST' || req.method === 'PUT') {
    const incoming = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    memoryStore = mergeDatasets(memoryStore, incoming);
    return res.status(200).json({ ok: true, source: 'memory_merged', data: memoryStore });
  }

  return res.status(200).json(memoryStore || {});
};

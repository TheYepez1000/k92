/**
 * UNIDAD CANINA K9 - API SERVERLESS DE SINCRONIZACIÓN EN LA NUBE (VERCEL)
 * Permite almacenar y sincronizar el estado global de la unidad K9 entre
 * múltiples navegadores, ordenadores y dispositivos en tiempo real.
 *
 * Compatible con:
 * - Vercel KV / Upstash Redis (si están configuradas las variables de entorno)
 * - Memoria del proceso Serverless en ejecución
 */

let memoryStore = null;

module.exports = async (req, res) => {
  // Encabezados CORS universales
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Integración con Vercel KV / Upstash Redis si existe en el entorno
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      if (req.method === 'POST' || req.method === 'PUT') {
        const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const setRes = await fetch(`${kvUrl}/set/k9_shared_database`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${kvToken}`,
            'Content-Type': 'application/json'
          },
          body: bodyStr
        });
        const setJson = await setRes.json();
        return res.status(200).json({ ok: true, source: 'vercel_kv', result: setJson });
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

  // 2. Almacenamiento en caché de memoria del proceso
  if (req.method === 'POST' || req.method === 'PUT') {
    memoryStore = req.body;
    return res.status(200).json({ ok: true, source: 'memory', timestamp: Date.now() });
  }

  return res.status(200).json(memoryStore || {});
};

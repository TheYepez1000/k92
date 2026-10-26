/**
 * UNIDAD CANINA K9 - ADAPTADOR DE BASE DE DATOS SUPABASE (POSTGRESQL)
 * Gestiona la conexión en la nube, lecturas/escrituras persistentes
 * y suscripciones en tiempo real (WebSockets / Supabase Realtime).
 */

const DEFAULT_SUPABASE_PROJECT_ID = 'lokfaliwnnfqmachndwv';
const DEFAULT_SUPABASE_URL = 'https://lokfaliwnnfqmachndwv.supabase.co';

// Fallback de contingencia seguro para despliegues públicos (ej. Vercel)
const BUILTIN_B64_KEY = 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW14dmEyWmhiR2wzYm01bWNXMWhZMmh1WkhkMklpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT1RJNU9UZ3hOREVzSW1WNGNDSTZNakV3T0RVM05ERTBNWDAuN1lWYnJ4eV9oaTNkckZsNHdVRlZtcjh4TVpIQlVnY2hoenZtT2lVcjBjZw==';

const SUPABASE_STORAGE_KEYS = {
  URL: 'k9_supabase_url',
  ANON_KEY: 'k9_supabase_anon_key',
  LAST_SYNC: 'k9_supabase_last_sync'
};

class K9SupabaseManager {
  constructor() {
    this.client = null;
    this.channel = null;
    this.isConnected = false;
    this._inFlightPromise = null;
    this.hasInitialPullCompleted = false;
    this.init();
  }

  normalizeUrl(raw) {
    let clean = (raw || '').trim();
    if (!clean) return DEFAULT_SUPABASE_URL;
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      if (/^[a-z0-9_-]+$/i.test(clean)) {
        return `https://${clean}.supabase.co`;
      }
      return `https://${clean}`;
    }
    return clean;
  }

  getConfig() {
    const local = (typeof window !== 'undefined' && window.K9_DB_CONFIG) || {};
    const storedUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL);
    const storedKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.ANON_KEY);

    // 1. Si config.local.js tiene una clave JWT válida, tiene prioridad
    let activeKey = '';
    if (local.key && String(local.key).trim().startsWith('eyJ')) {
      activeKey = String(local.key).trim();
    } else if (storedKey && String(storedKey).trim().startsWith('eyJ')) {
      activeKey = String(storedKey).trim();
    } else {
      // 2. Si no hay clave en localStorage ni en config.local.js (ej. visita anónima en Vercel), decodificar fallback integrado
      try {
        const decoded = (typeof atob === 'function') ? atob(BUILTIN_B64_KEY) : '';
        if (decoded && decoded.startsWith('eyJ')) activeKey = decoded;
      } catch (e) {}
      if (!activeKey) activeKey = (storedKey || local.key || '').trim();
    }

    const activeUrl = this.normalizeUrl(local.url || storedUrl || DEFAULT_SUPABASE_URL);

    // Auto-sanar localStorage para sesiones persistentes
    if (activeKey && activeKey.startsWith('eyJ') && storedKey !== activeKey) {
      try {
        localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, activeKey);
        localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, activeUrl);
      } catch (e) {}
    }

    return {
      url: activeUrl,
      key: activeKey
    };
  }

  isConfigured() {
    const cfg = this.getConfig();
    return Boolean(cfg.url && cfg.key && cfg.url.startsWith('http') && cfg.key.length > 20);
  }

  saveConfig(url, key) {
    const cleanUrl = url && url.trim() ? this.normalizeUrl(url) : '';
    if (cleanUrl) {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, cleanUrl);
    } else {
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);
    }

    if (key && key.trim()) {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, key.trim());
    } else {
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.ANON_KEY);
    }

    this.init();
    if (this.isConfigured()) {
      this.pull(true);
    }
  }

  // Petición REST nativa directa a Supabase (independiente de librerías externas o caídas de CDN)
  async _restFetch(path, options = {}) {
    const cfg = this.getConfig();
    if (!cfg.url || !cfg.key) return null;
    const url = `${cfg.url.replace(/\/+$/, '')}${path}`;
    const headers = Object.assign({
      'apikey': cfg.key,
      'Authorization': `Bearer ${cfg.key}`,
      'Accept': 'application/json'
    }, options.headers || {});

    return fetch(url, Object.assign({}, options, { headers }));
  }

  init() {
    const cfg = this.getConfig();
    if (cfg.key && cfg.key.startsWith('eyJ')) {
      this.isConnected = true;
    }

    if (!this.isConfigured()) {
      this.isConnected = false;
      this.updateIndicatorUI();
      return;
    }

    // Inicializar cliente Supabase oficial para WebSockets en tiempo real si está disponible
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.client = window.supabase.createClient(cfg.url, cfg.key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });

        this.isConnected = true;
        console.log('[K9Supabase] Cliente PostgreSQL conectado con soporte Realtime');
        this.setupRealtimeSubscription();
      } catch (err) {
        console.warn('[K9Supabase] Advertencia al instanciar cliente JS (se usará REST nativo):', err);
      }
    } else {
      // Si la librería de Supabase aún no cargó desde CDN, reintentar para WebSockets sin bloquear
      this._initRetries = (this._initRetries || 0) + 1;
      if (this._initRetries <= 8) {
        setTimeout(() => this.init(), 1200);
      }
    }

    this.updateIndicatorUI();

    // Sincronizar inmediatamente al iniciar usando pull()
    setTimeout(() => this.pull(), 250);
  }

  // Suscripción WebSockets para cambios en vivo entre todos los dispositivos
  setupRealtimeSubscription() {
    if (!this.client) return;

    if (this.channel) {
      try {
        this.client.removeChannel(this.channel);
      } catch (e) {
        // Silencioso
      }
    }

    this.channel = this.client
      .channel('k9_app_state_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'k9_app_state'
        },
        (change) => {
          if (!change || !change.new) return;
          const newPayload = change.new.payload;
          if (newPayload) {
            // Anti-eco: Si el cambio recibido es idéntico a lo que acabamos de subir nosotros, ignorarlo
            const remoteHash = JSON.stringify(newPayload);
            if (this._lastPushedHash && remoteHash === this._lastPushedHash) {
              return;
            }
            this._lastPushedHash = remoteHash;
            this.handleRemotePayload(newPayload);
            this.hasInitialPullCompleted = true;
          } else {
            this.pull(true);
          }
        }
      )
      .subscribe((status) => {
        this.updateIndicatorUI(status === 'SUBSCRIBED');
      });
  }

  // Descargar el estado completo desde Supabase (Soporta cliente JS y REST nativo)
  async pull(force = false) {
    if (!this.isConfigured()) return null;
    if (this._inFlightPromise) {
      return this._inFlightPromise;
    }
    this._inFlightPromise = this._doPull(force);
    try {
      const res = await this._inFlightPromise;
      return res;
    } finally {
      this._inFlightPromise = null;
    }
  }

  async _doPull(force = false) {
    try {
      let payload = null;

      // 1. Intentar mediante cliente oficial
      if (this.client) {
        try {
          const { data, error } = await this.client
            .from('k9_app_state')
            .select('payload, updated_at')
            .eq('id', 'k9_global_state')
            .maybeSingle();

          if (!error && data && data.payload) {
            payload = data.payload;
          }
        } catch (e) {
          console.warn('[K9Supabase] Error en cliente JS, usando REST nativo:', e);
        }
      }

      // 2. Fallback REST nativo si el cliente no obtuvo datos
      if (!payload) {
        try {
          const resp = await this._restFetch('/rest/v1/k9_app_state?id=eq.k9_global_state&select=payload,updated_at', {
            cache: 'no-store'
          });
          if (resp && resp.ok) {
            const list = await resp.json();
            if (Array.isArray(list) && list.length > 0 && list[0].payload) {
              payload = list[0].payload;
            }
          }
        } catch (errRest) {
          console.warn('[K9Supabase] Fallo en REST fetch:', errRest);
        }
      }

      this.isConnected = true;

      // Si la nube está vacía ({}) o sin claves, auto-sembrar con los datos locales
      if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
        console.log('[K9Supabase] Nube vacía o inicial detectada. Sembrando datos locales en Supabase...');
        this.hasInitialPullCompleted = true;
        await this.push();
        return null;
      }

      this.handleRemotePayload(payload);
      this.hasInitialPullCompleted = true;
      localStorage.setItem(SUPABASE_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      this.updateIndicatorUI(true);
      return payload;
    } catch (err) {
      console.warn('[K9Supabase] Fallo general en pull:', err);
      return null;
    }
  }

  // Subir el estado completo de la plataforma a Supabase (Soporta cliente JS y REST nativo)
  async push(customPayload = null) {
    // Si aún no hemos completado la lectura inicial de Supabase, bloquear push automático para NUNCA sobrescribir la nube con datos locales vacíos o por defecto
    if (!this.hasInitialPullCompleted && !customPayload) {
      console.warn('[K9Supabase] Push cancelado: esperando lectura inicial de Supabase para no sobreescribir datos.');
      return false;
    }
    let payload = customPayload;
    if (!payload) {
      if (window.K9CloudSync && typeof window.K9CloudSync.exportPayload === 'function') {
        payload = window.K9CloudSync.exportPayload();
      } else if (window.K9Store) {
        const k = (typeof window !== 'undefined' && window.STORAGE_KEYS) || {};
        payload = {
          version: 2,
          updatedAt: Date.now(),
          users: (window.K9Store.getAllUsers ? window.K9Store.getAllUsers() : window.K9Store.getUsers()) || [],
          presets: window.K9Store.getAgentPresets() || [],
          dogs: window.K9Store.getDogs() || [],
          dogRequests: window.K9Store.getDogRequests() || [],
          announcements: window.K9Store.getAnnouncements() || [],
          disciplinary: window.K9Store.getDisciplinary() || [],
          reports: window.K9Store.getReports() || [],
          badges: window.K9Store.getBadges() || [],
          chatMessages: window.K9Store.getChatMessages() || [],
          normatives: window.K9Store.getNormatives() || [],
          manuals: window.K9Store.getManuals() || [],
          promotions: window.K9Store.getPromotions() || [],
          logs: window.K9Store.getLogs() || [],
          expelledUserIds: window.K9Store.getExpelledUserIds() || [],
          tasks: (window.K9Store.getRawTasks ? window.K9Store.getRawTasks() : (window.K9Store.get(k.TASKS) || [])),
          events: (window.K9Store.getRawEvents ? window.K9Store.getRawEvents() : (window.K9Store.get(k.EVENTS) || [])),
          notifications: (window.K9Store.getRawNotifications ? window.K9Store.getRawNotifications() : (window.K9Store.get(k.NOTIFICATIONS) || []))
        };
      }
    }
    if (!payload) return false;

    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
    const updatedBy = user ? `${user.name} [${user.placa}]` : 'Guía Operativo';
    const nowIso = new Date().toISOString();

    let ok = false;

    // 1. Intentar mediante cliente oficial
    if (this.client) {
      try {
        const { error } = await this.client
          .from('k9_app_state')
          .upsert({
            id: 'k9_global_state',
            payload: payload,
            updated_at: nowIso,
            updated_by: updatedBy
          }, { onConflict: 'id' });

        if (!error) ok = true;
      } catch (e) {
        console.warn('[K9Supabase] Upsert con cliente JS falló, recurriendo a REST nativo:', e);
      }
    }

    // 2. Si falló el cliente o no está cargado, usar REST POST con upsert header
    if (!ok) {
      try {
        const resp = await this._restFetch('/rest/v1/k9_app_state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: 'k9_global_state',
            payload: payload,
            updated_at: nowIso,
            updated_by: updatedBy
          })
        });
        if (resp && resp.ok) ok = true;
      } catch (err) {
        console.error('[K9Supabase] Error al subir datos vía REST nativo:', err);
      }
    }

    if (ok) {
      this.isConnected = true;
      this._lastPushedHash = JSON.stringify(payload);
      localStorage.setItem(SUPABASE_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      this.updateIndicatorUI(true);
      return true;
    }
    return false;
  }

  // Integrar datos recibidos en la memoria local
  handleRemotePayload(payload) {
    if (!payload || typeof payload !== 'object') return;
    if (window.K9CloudSync && typeof window.K9CloudSync.mergeRemoteData === 'function') {
      window.K9CloudSync.mergeRemoteData(payload);
    }
  }

  // Probar conexión a la base de datos con credenciales específicas
  async testConnection(url, key) {
    if (!window.supabase) {
      return { ok: false, message: 'La librería de Supabase no está cargada en el navegador.' };
    }

    try {
      const cleanUrl = this.normalizeUrl(url);
      const tempClient = window.supabase.createClient(cleanUrl, key.trim(), {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const { data, error } = await tempClient
        .from('k9_app_state')
        .select('id, updated_at')
        .eq('id', 'k9_global_state')
        .maybeSingle();

      if (error) {
        // Si el error es que la tabla no existe
        if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
          return {
            ok: false,
            tableMissing: true,
            message: 'Conexión a Supabase exitosa, pero la tabla "k9_app_state" aún no ha sido creada. Ejecuta el script SQL en tu panel.'
          };
        }
        return { ok: false, message: error.message };
      }

      return { ok: true, message: '¡Conexión a la base de datos PostgreSQL establecida con éxito!' };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  // Actualizar el pill táctico superior en la interfaz
  updateIndicatorUI(isRealtimeActive = false) {
    const dot = document.getElementById('cloudSyncDot');
    const label = document.getElementById('cloudSyncLabel');
    const badge = document.getElementById('syncModalStatusBadge');
    const supabaseBadge = document.getElementById('supabaseStatusBadge');

    if (!dot || !label) return;

    if (this.isConfigured() && this.isConnected) {
      dot.className = 'pulse-dot dot-online';
      dot.style.background = '#00e5ff';
      dot.style.boxShadow = '0 0 10px #00e5ff';
      label.textContent = isRealtimeActive ? 'TERMINAL EN VIVO' : 'EN LÍNEA';
      label.style.color = '#00e5ff';

      if (supabaseBadge) {
        supabaseBadge.innerHTML = '● CONECTADO A SUPABASE (POSTGRESQL)';
        supabaseBadge.style.color = 'var(--police-cyan)';
        supabaseBadge.style.borderColor = 'var(--police-cyan)';
        supabaseBadge.style.background = 'rgba(0, 229, 255, 0.12)';
      }
    } else {
      dot.style.background = '';
      dot.style.boxShadow = '';
      label.style.color = '';

      if (supabaseBadge) {
        supabaseBadge.innerHTML = '○ MODO LOCAL / PENDIENTE DE CONECTAR';
        supabaseBadge.style.color = 'var(--tactical-amber)';
        supabaseBadge.style.borderColor = 'var(--tactical-amber)';
        supabaseBadge.style.background = 'rgba(255, 184, 0, 0.1)';
      }
    }
  }
}

// Instancia global
window.K9Supabase = new K9SupabaseManager();

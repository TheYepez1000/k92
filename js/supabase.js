/**
 * UNIDAD CANINA K9 - ADAPTADOR DE BASE DE DATOS SUPABASE (POSTGRESQL)
 * Gestiona la conexión en la nube, lecturas/escrituras persistentes
 * y suscripciones en tiempo real (WebSockets / Supabase Realtime).
 */

const DEFAULT_SUPABASE_PROJECT_ID = 'lokfaliwnnfqmachndwv';
const DEFAULT_SUPABASE_URL = 'https://lokfaliwnnfqmachndwv.supabase.co';

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
    this._inFlight = false;
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
    return {
      url: this.normalizeUrl(storedUrl || local.url || DEFAULT_SUPABASE_URL),
      key: (storedKey || local.key || '').trim()
    };
  }

  isConfigured() {
    const cfg = this.getConfig();
    return Boolean(cfg.url && cfg.key && cfg.url.startsWith('http') && cfg.key.length > 10);
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

  init() {
    const local = (typeof window !== 'undefined' && window.K9_DB_CONFIG) || {};
    if (local.key && !localStorage.getItem(SUPABASE_STORAGE_KEYS.ANON_KEY)) {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, local.key);
      localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, local.url || DEFAULT_SUPABASE_URL);
    }

    if (!this.isConfigured()) {
      this.isConnected = false;
      this.updateIndicatorUI();
      return;
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      this._initRetries = (this._initRetries || 0) + 1;
      if (this._initRetries <= 5) {
        console.warn(`[K9Supabase] La librería de Supabase aún no está cargada. Reintento ${this._initRetries}/5 en 1s...`);
        setTimeout(() => this.init(), 1000);
      } else {
        console.warn('[K9Supabase] La librería de Supabase no se pudo cargar desde el CDN tras 5 intentos.');
      }
      return;
    }
    this._initRetries = 0;

    try {
      const cfg = this.getConfig();
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
      console.log('[K9Supabase] Cliente PostgreSQL inicializado correctamente');
      this.setupRealtimeSubscription();
      this.updateIndicatorUI();

      // Sincronizar inmediatamente al iniciar
      setTimeout(() => this.pull(), 400);
    } catch (err) {
      console.error('[K9Supabase] Error al inicializar cliente:', err);
      this.isConnected = false;
      this.updateIndicatorUI();
    }
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
          console.log('[K9Supabase Realtime] Cambio detectado en la nube:', change.eventType);
          if (change.new && change.new.payload) {
            this.handleRemotePayload(change.new.payload);
          } else {
            this.pull(true);
          }
        }
      )
      .subscribe((status) => {
        console.log('[K9Supabase Realtime] Estado del canal:', status);
        this.updateIndicatorUI(status === 'SUBSCRIBED');
      });
  }

  // Descargar el estado completo desde la tabla PostgreSQL de Supabase
  async pull(force = false) {
    if (!this.isConnected || !this.client || this._inFlight) return null;
    this._inFlight = true;

    try {
      const { data, error } = await this.client
        .from('k9_app_state')
        .select('payload, updated_at')
        .eq('id', 'k9_global_state')
        .maybeSingle();

      this._inFlight = false;

      if (error) {
        console.warn('[K9Supabase] Error al consultar datos:', error.message);
        return null;
      }

      if (data && data.payload && typeof data.payload === 'object' && Object.keys(data.payload).length > 0) {
        this.handleRemotePayload(data.payload);
        localStorage.setItem(SUPABASE_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        this.updateIndicatorUI(true);
        return data.payload;
      }
      return null;
    } catch (err) {
      this._inFlight = false;
      console.warn('[K9Supabase] Fallo en pull:', err);
      return null;
    }
  }

  // Subir el estado completo de la plataforma a Supabase
  async push(customPayload = null) {
    if (!this.isConnected || !this.client) return false;

    const payload = customPayload || (window.K9CloudSync ? window.K9CloudSync.exportPayload() : null);
    if (!payload) return false;

    try {
      const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
      const updatedBy = user ? `${user.name} [${user.placa}]` : 'Guía Operativo';

      const { error } = await this.client
        .from('k9_app_state')
        .upsert({
          id: 'k9_global_state',
          payload: payload,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        }, { onConflict: 'id' });

      if (error) {
        console.error('[K9Supabase] Error al subir datos:', error.message);
        return false;
      }

      localStorage.setItem(SUPABASE_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      this.updateIndicatorUI(true);
      return true;
    } catch (err) {
      console.error('[K9Supabase] Fallo en push:', err);
      return false;
    }
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

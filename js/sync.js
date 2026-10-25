/**
 * UNIDAD CANINA K9 - SISTEMA DE SINCRONIZACIÓN EN LA NUBE
 * Sincroniza en tiempo real los datos de la unidad (agentes, rangos,
 * canes, solicitudes de binomios, anuncios, faltas e informes)
 * entre todos los dispositivos que accedan a la web.
 */

const SYNC_STORAGE_KEYS = {
  ENDPOINT: 'k9_cloud_sync_url',
  LAST_SYNC: 'k9_cloud_last_sync_ts',
  SYNC_STATUS: 'k9_cloud_status'
};

class K9CloudSyncManager {
  constructor() {
    this._inFlight = false;
    this._pushTimer = null;
    this._pollInterval = null;
    this._lastRemoteHash = null;
    this._status = 'initializing';
    this.init();
  }

  // Determinar URL de sincronización activa
  getEndpointUrl() {
    const custom = localStorage.getItem(SYNC_STORAGE_KEYS.ENDPOINT);
    if (custom && custom.trim()) {
      return custom.trim();
    }
    // Si estamos en Vercel o un host web, usar el endpoint serverless propio
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      return window.location.origin + '/api/sync';
    }
    return null;
  }

  setEndpointUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem(SYNC_STORAGE_KEYS.ENDPOINT, url.trim());
    } else {
      localStorage.removeItem(SYNC_STORAGE_KEYS.ENDPOINT);
    }
    this.pull(true);
  }

  init() {
    // 1. Sincronizar inmediatamente al cargar la página
    setTimeout(() => this.pull(), 500);

    // 2. Intervalo de sondeo continuo (cada 5 segundos)
    if (this._pollInterval) clearInterval(this._pollInterval);
    this._pollInterval = setInterval(() => {
      this.pull();
    }, 5000);

    // 3. Sincronizar al volver a la pestaña activa del navegador
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.pull(true);
      }
    });

    window.addEventListener('online', () => this.pull(true));
  }

  // Empaquetar todo el estado compartido para subir a la nube
  exportPayload() {
    if (!window.K9Store) return null;
    return {
      version: 2,
      updatedAt: Date.now(),
      users: window.K9Store.get(STORAGE_KEYS.USERS) || [],
      presets: window.K9Store.get(STORAGE_KEYS.AGENT_PRESETS) || [],
      dogs: window.K9Store.get(STORAGE_KEYS.DOGS) || [],
      dogRequests: window.K9Store.get(STORAGE_KEYS.DOG_REQUESTS) || [],
      announcements: window.K9Store.get(STORAGE_KEYS.ANNOUNCEMENTS) || [],
      disciplinary: window.K9Store.get(STORAGE_KEYS.DISCIPLINARY) || [],
      reports: window.K9Store.get(STORAGE_KEYS.REPORTS) || [],
      badges: window.K9Store.get(STORAGE_KEYS.BADGES) || [],
      chatMessages: window.K9Store.get(STORAGE_KEYS.CHAT_MESSAGES) || [],
      webhookUrl: localStorage.getItem('k9_webhook_url') || null
    };
  }

  // Guardar en la nube con debounce para no saturar peticiones
  schedulePush() {
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this.push();
    }, 600);
  }

  // Enviar cambios locales a la nube
  async push() {
    const endpoint = this.getEndpointUrl();
    if (!endpoint) return;

    const payload = this.exportPayload();
    if (!payload) return;

    try {
      this.setStatus('syncing');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        this._lastRemoteHash = JSON.stringify(payload);
        localStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        this.setStatus('online');
        console.log('[K9CloudSync] Datos sincronizados en la nube con éxito');
      } else {
        this.setStatus('warning');
      }
    } catch (err) {
      console.warn('[K9CloudSync] No se pudo enviar actualización a la nube:', err.message);
      this.setStatus('offline');
    }
  }

  // Descargar cambios más recientes de la nube
  async pull(force = false) {
    if (this._inFlight) return;
    const endpoint = this.getEndpointUrl();
    if (!endpoint) return;

    this._inFlight = true;
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const remoteData = await response.json();
        this._inFlight = false;

        if (remoteData && typeof remoteData === 'object' && Object.keys(remoteData).length > 0) {
          const remoteStr = JSON.stringify(remoteData);
          if (force || remoteStr !== this._lastRemoteHash) {
            this._lastRemoteHash = remoteStr;
            this.mergeRemoteData(remoteData);
          }
        }
        localStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
        this.setStatus('online');
      } else {
        this._inFlight = false;
        this.setStatus('warning');
      }
    } catch (err) {
      this._inFlight = false;
      this.setStatus('offline');
    }
  }

  // Fusionar datos de la nube en localStorage sin alterar la sesión local del usuario
  mergeRemoteData(remote) {
    if (!window.K9Store) return;
    let hasChanges = false;

    // 1. Presets de Jefatura (Fusión por discordId)
    if (Array.isArray(remote.presets)) {
      const localPresets = window.K9Store.get(STORAGE_KEYS.AGENT_PRESETS) || [];
      const presetMap = new Map();
      localPresets.forEach(p => { if (p.discordId) presetMap.set(p.discordId, p); });
      remote.presets.forEach(p => { if (p.discordId) presetMap.set(p.discordId, p); });
      localStorage.setItem(STORAGE_KEYS.AGENT_PRESETS, JSON.stringify(Array.from(presetMap.values())));
      hasChanges = true;
    }

    // 2. Directorio de usuarios y rangos (Fusión sin perder a nadie que haya entrado con Discord)
    if (Array.isArray(remote.users) && remote.users.length > 0) {
      const localUsers = window.K9Store.getUsers();
      const userMap = new Map();
      localUsers.forEach(u => {
        const key = u.discordId || u.id;
        if (key) userMap.set(key, u);
      });
      remote.users.forEach(u => {
        const key = u.discordId || u.id;
        if (!key) return;
        const prev = userMap.get(key);
        if (prev) {
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
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(Array.from(userMap.values())));
      hasChanges = true;
    }

    // 3. Solicitudes de canes (binomios)
    if (Array.isArray(remote.dogRequests)) {
      const localReqs = window.K9Store.getDogRequests();
      const reqMap = new Map();
      localReqs.forEach(r => { if (r.id) reqMap.set(r.id, r); });
      remote.dogRequests.forEach(r => { if (r.id) reqMap.set(r.id, r); });
      localStorage.setItem(STORAGE_KEYS.DOG_REQUESTS, JSON.stringify(Array.from(reqMap.values())));
      hasChanges = true;
    }

    // 4. Canes K9 (Autoritativo desde la nube para no revivir bajas ni eliminaciones)
    if (Array.isArray(remote.dogs)) {
      localStorage.setItem(STORAGE_KEYS.DOGS, JSON.stringify(remote.dogs));
      hasChanges = true;
    }

    // 5. Comunicados oficiales
    if (Array.isArray(remote.announcements)) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(remote.announcements));
      hasChanges = true;
    }

    // 6. Expedientes disciplinarios (Autoritativo para respetar bajas y eliminaciones)
    if (Array.isArray(remote.disciplinary)) {
      localStorage.setItem(STORAGE_KEYS.DISCIPLINARY, JSON.stringify(remote.disciplinary));
      hasChanges = true;
    }

    // 7. Chat de Despacho con Jefatura
    if (Array.isArray(remote.chatMessages)) {
      const localChat = window.K9Store.getChatMessages();
      const chatMap = new Map();
      localChat.forEach(m => { if (m.id) chatMap.set(m.id, m); });
      remote.chatMessages.forEach(m => { if (m.id) chatMap.set(m.id, m); });
      const mergedChat = Array.from(chatMap.values()).slice(-60);
      localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(mergedChat));
      hasChanges = true;
      window.dispatchEvent(new CustomEvent('k9_chat_updated', { detail: mergedChat }));
    }

    // 8. Informes de patrulla
    if (Array.isArray(remote.reports)) {
      const localRep = window.K9Store.getReports();
      const repMap = new Map();
      localRep.forEach(r => { if (r.id) repMap.set(r.id, r); });
      remote.reports.forEach(r => { if (r.id) repMap.set(r.id, r); });
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(Array.from(repMap.values())));
      hasChanges = true;
    }

    // 8. Webhook URL si está configurada en la nube
    if (remote.webhookUrl && remote.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      localStorage.setItem('k9_webhook_url', remote.webhookUrl);
    }

    if (hasChanges) {
      // Si el usuario actual está logueado, sincronizar su rango si Jefatura lo cambió remotamente
      if (window.K9Auth) {
        const currentUser = window.K9Auth.getCurrentUser();
        if (currentUser) {
          const freshUsers = window.K9Store.getUsers();
          const fresh = freshUsers.find(u => u.id === currentUser.id);
          if (fresh) {
            window.K9Auth.loadUser();
          }
        }
      }

      // Refrescar vistas activas en tiempo real
      if (typeof window.setupAuthUI === 'function') window.setupAuthUI();
      if (typeof window.renderCurrentView === 'function') window.renderCurrentView();

      // Disparar evento para componentes
      window.dispatchEvent(new CustomEvent('k9:cloud-sync', { detail: remote }));
    }
  }

  setStatus(status) {
    this._status = status;
    this.updateIndicatorUI();
  }

  getStatus() {
    return this._status;
  }

  updateIndicatorUI() {
    const dot = document.getElementById('cloudSyncDot');
    const label = document.getElementById('cloudSyncLabel');
    if (!dot) return;

    if (this._status === 'online') {
      dot.style.background = '#00e676';
      dot.style.boxShadow = '0 0 10px #00e676';
      if (label) label.textContent = 'NUBE CONECTADA';
    } else if (this._status === 'syncing') {
      dot.style.background = '#ffd166';
      dot.style.boxShadow = '0 0 10px #ffd166';
      if (label) label.textContent = 'SINCRONIZANDO…';
    } else {
      dot.style.background = '#ff5252';
      dot.style.boxShadow = '0 0 10px #ff5252';
      if (label) label.textContent = 'MODO LOCAL';
    }
  }
}

// Instancia global
window.K9CloudSync = new K9CloudSyncManager();

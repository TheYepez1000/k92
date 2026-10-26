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
      webhookUrl: localStorage.getItem('k9_webhook_url') || null
    };
  }

  // Guardar en la nube con debounce para no saturar peticiones
  schedulePush() {
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this.push();
    }, 350);
  }

  // Enviar cambios locales a la nube
  async push() {
    const endpoint = this.getEndpointUrl();
    if (!endpoint) return;

    const payload = this.exportPayload();
    if (!payload) return;

    try {
      this.setStatus('syncing');
      const isFirebase = endpoint.includes('firebaseio.com') || endpoint.endsWith('.json');
      const response = await fetch(endpoint, {
        method: isFirebase ? 'PUT' : 'POST',
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

    // 0. Sincronizar agentes expulsados (refleja expulsiones y readmisiones)
    if (Array.isArray(remote.expelledUserIds)) {
      window.K9Store.save(STORAGE_KEYS.EXPELLED_USERS, remote.expelledUserIds);
    }
    const expelled = window.K9Store.getExpelledUserIds();

    // 1. Presets de Jefatura
    if (Array.isArray(remote.presets)) {
      const validPresets = remote.presets.filter(p => !expelled.includes(p.discordId));
      localStorage.setItem(STORAGE_KEYS.AGENT_PRESETS, JSON.stringify(validPresets));
      hasChanges = true;
    }

    // 2. Directorio completo de usuarios (preservando estados)
    if (Array.isArray(remote.users)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remote.users));
      hasChanges = true;
    }

    // 3. Solicitudes de canes (binomios)
    if (Array.isArray(remote.dogRequests)) {
      localStorage.setItem(STORAGE_KEYS.DOG_REQUESTS, JSON.stringify(remote.dogRequests));
      hasChanges = true;
    }

    // 4. Canes K9 (Si la nube tiene datos, los aplica; si está vacía, local nutre a la nube)
    if (Array.isArray(remote.dogs) && remote.dogs.length > 0) {
      localStorage.setItem(STORAGE_KEYS.DOGS, JSON.stringify(remote.dogs));
      hasChanges = true;
    } else {
      const localDogs = window.K9Store.getDogs();
      if (localDogs && localDogs.length > 0) {
        this.schedulePush();
      }
    }

    // 5. Comunicados oficiales
    if (Array.isArray(remote.announcements)) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(remote.announcements));
      hasChanges = true;
    }

    // 6. Expedientes disciplinarios
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
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(remote.reports));
      hasChanges = true;
    }

    // 9. Normativas Oficiales
    if (Array.isArray(remote.normatives) && remote.normatives.length > 0) {
      localStorage.setItem(STORAGE_KEYS.NORMATIVES, JSON.stringify(remote.normatives));
      hasChanges = true;
    } else {
      const localNorms = window.K9Store.getNormatives();
      if (localNorms && localNorms.length > 0) this.schedulePush();
    }

    // 10. Manuales de Instrucción
    if (Array.isArray(remote.manuals) && remote.manuals.length > 0) {
      localStorage.setItem(STORAGE_KEYS.MANUALS, JSON.stringify(remote.manuals));
      hasChanges = true;
    } else {
      const localMans = window.K9Store.getManuals();
      if (localMans && localMans.length > 0) this.schedulePush();
    }

    // 11. Ascensos Oficiales
    if (Array.isArray(remote.promotions)) {
      localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(remote.promotions));
      hasChanges = true;
    }

    // 12. Logs tácticos internos: Asignación directa autoritativa (permite purgar sin que resuciten)
    if (Array.isArray(remote.logs)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(remote.logs));
      hasChanges = true;
    }

    // 13. Webhook URL si está configurada en la nube
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

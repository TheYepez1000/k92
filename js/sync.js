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

// Acceso seguro a las claves de persistencia sin colisión de identificadores const
const K9_SYNC_KEYS = (typeof window !== 'undefined' && window.STORAGE_KEYS) || (typeof STORAGE_KEYS !== 'undefined' ? STORAGE_KEYS : {
  CURRENT_USER: 'k9_current_user_id',
  USERS: 'k9_data_users',
  DOGS: 'k9_data_dogs',
  REPORTS: 'k9_data_reports',
  DISCIPLINARY: 'k9_data_disciplinary',
  BADGES: 'k9_data_badges',
  ANNOUNCEMENTS: 'k9_data_announcements',
  NORMATIVES: 'k9_data_normatives',
  MANUALS: 'k9_data_manuals',
  DISCORD_CONFIG: 'k9_discord_config',
  DOG_REQUESTS: 'k9_dog_requests',
  AGENT_PRESETS: 'k9_agent_presets',
  CHAT_MESSAGES: 'k9_chat_messages',
  PROMOTIONS: 'k9_data_promotions',
  LOGS: 'k9_data_logs',
  EXPELLED_USERS: 'k9_expelled_users',
  LAST_UPDATE: 'k9_last_local_update',
  TASKS: 'k9_data_tasks',
  EVENTS: 'k9_data_events',
  NOTIFICATIONS: 'k9_data_notifications',
  UNIFORMS: 'k9_data_uniforms',
  MAP_MARKERS: 'k9_data_map_markers',
  ACTIVE_PATROLS: 'k9_data_active_patrols',
  PATROL_SESSIONS: 'k9_data_patrol_sessions',
  EXAMS: 'k9_data_exams',
  EXAM_SUBMISSIONS: 'k9_data_exam_submissions'
});

class K9CloudSyncManager {
  constructor() {
    this._inFlight = false;
    this._isApplyingRemote = false;
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
    // Si Supabase ya está configurado, NO usar el endpoint serverless /api/sync
    // para evitar que reinicios en frío de funciones serverless sobrescriban datos persistentes
    if (window.K9Supabase && window.K9Supabase.isConfigured()) {
      return null;
    }
    // Si estamos en Vercel o un host web y no hay Supabase, usar el endpoint serverless propio
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
    // 1. Sincronizar al cargar la página
    setTimeout(() => this.pull(true), 250);

    // 2. Intervalo de sondeo continuo de resguardo (cada 25s, no saturar si Realtime está activo)
    if (this._pollInterval) clearInterval(this._pollInterval);
    this._pollInterval = setInterval(() => {
      // Si Supabase Realtime ya está activo y escuchando WebSockets, no saturar con peticiones continuas
      if (window.K9Supabase && window.K9Supabase.isConnected && window.K9Supabase.channel) {
        return;
      }
      this.pull();
    }, 25000);

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
      tasks: (window.K9Store.getRawTasks ? window.K9Store.getRawTasks() : (window.K9Store.get(K9_SYNC_KEYS.TASKS) || [])),
      events: (window.K9Store.getRawEvents ? window.K9Store.getRawEvents() : (window.K9Store.get(K9_SYNC_KEYS.EVENTS) || [])),
      notifications: (window.K9Store.getRawNotifications ? window.K9Store.getRawNotifications() : (window.K9Store.get(K9_SYNC_KEYS.NOTIFICATIONS) || [])),
      uniforms: (window.K9Store.getUniforms ? window.K9Store.getUniforms() : (window.K9Store.get(K9_SYNC_KEYS.UNIFORMS) || [])),
      mapMarkers: (window.K9Store.getMapMarkers ? window.K9Store.getMapMarkers() : (window.K9Store.get(K9_SYNC_KEYS.MAP_MARKERS) || [])),
      activePatrols: (window.K9Store.getActivePatrols ? window.K9Store.getActivePatrols() : (window.K9Store.get(K9_SYNC_KEYS.ACTIVE_PATROLS) || [])),
      patrolSessions: (window.K9Store.getPatrolSessions ? window.K9Store.getPatrolSessions() : (window.K9Store.get(K9_SYNC_KEYS.PATROL_SESSIONS) || [])),
      exams: (window.K9Store.getExams ? window.K9Store.getExams() : (window.K9Store.get(K9_SYNC_KEYS.EXAMS) || [])),
      examSubmissions: (window.K9Store.getExamSubmissions ? window.K9Store.getExamSubmissions() : (window.K9Store.get(K9_SYNC_KEYS.EXAM_SUBMISSIONS) || [])),
      webhookUrl: localStorage.getItem('k9_webhook_url') || null
    };
  }

  // Guardar en la nube con debounce para no saturar peticiones
  schedulePush() {
    if (this._isApplyingRemote) return; // NUNCA disparar push si estamos aplicando datos entrantes de la nube
    if (this._pushTimer) clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(() => {
      this.push();
    }, 500);
  }

  // Enviar cambios locales a la nube
  async push() {
    if (this._isApplyingRemote) return;
    // Si Supabase está configurado pero aún no completó la lectura inicial, postergar para no pisar la nube con datos por defecto
    if (window.K9Supabase && window.K9Supabase.isConfigured() && !window.K9Supabase.hasInitialPullCompleted) {
      console.warn('[K9CloudSync] Push postergado: esperando lectura inicial de Supabase...');
      return;
    }
    const payload = this.exportPayload();
    if (!payload) return;

    let supabaseOk = false;
    // 1. Prioridad: Supabase PostgreSQL (si está configurado)
    if (window.K9Supabase && window.K9Supabase.isConfigured()) {
      try {
        this.setStatus('syncing');
        supabaseOk = await window.K9Supabase.push(payload);
        if (supabaseOk) {
          this._lastRemoteHash = JSON.stringify(payload);
          localStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC, Date.now().toString());
          this.setStatus('online');
          console.log('[K9CloudSync] Datos sincronizados en Supabase PostgreSQL');
          return; // Éxito con Supabase: omitir endpoint REST para no duplicar peticiones
        }
      } catch (err) {
        console.warn('[K9CloudSync] Error al subir a Supabase:', err);
      }
    }

    // 2. Endpoint REST o Firebase complementario / fallback (SOLO si Supabase NO está configurado)
    const endpoint = this.getEndpointUrl();
    if (!endpoint) {
      if (!supabaseOk && (!window.K9Supabase || !window.K9Supabase.isConfigured())) {
        this.setStatus('offline');
      }
      return;
    }

    try {
      if (!supabaseOk) this.setStatus('syncing');
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
        console.log('[K9CloudSync] Datos sincronizados en endpoint REST con éxito');
      } else if (!supabaseOk) {
        this.setStatus('warning');
      }
    } catch (err) {
      if (!supabaseOk) {
        console.warn('[K9CloudSync] No se pudo enviar actualización a la nube:', err.message);
        this.setStatus('offline');
      }
    }
  }

  // Descargar cambios más recientes de la nube
  async pull(force = false) {
    if (this._inFlight) return;

    // 1. Prioridad: Consultar Supabase PostgreSQL
    if (window.K9Supabase && window.K9Supabase.isConfigured()) {
      this._inFlight = true;
      try {
        const remoteData = await window.K9Supabase.pull(force);
        this._inFlight = false;
        if (remoteData) {
          this.setStatus('online');
        }
        return remoteData; // IMPORTANTE: no continuar hacia /api/sync si Supabase está activo
        return remoteData; // IMPORTANTE: no continuar hacia /api/sync si Supabase está activo
      } catch (err) {
        this._inFlight = false;
        console.warn('[K9CloudSync] Fallo en pull de Supabase:', err);
        return null;
        return null;
      }
    }

    // 2. Fallback: Endpoint REST / Firebase (SOLO si Supabase NO está configurado)
    // 2. Fallback: Endpoint REST / Firebase (SOLO si Supabase NO está configurado)
    const endpoint = this.getEndpointUrl();
    if (!endpoint) {
      if (window.K9Supabase && window.K9Supabase.isConfigured()) {
        this.setStatus(window.K9Supabase.isConnected ? 'online' : 'offline');
      }
      return;
    }

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
    if (!remote || typeof remote !== 'object' || !window.K9Store) return;

    // Comprobar si los datos recibidos son idénticos a los últimos que ya procesamos
    const remoteHash = JSON.stringify(remote);
    if (this._lastRemoteHash && remoteHash === this._lastRemoteHash) {
      return;
    }
    this._lastRemoteHash = remoteHash;

    this._isApplyingRemote = true;
    try {
      let hasChanges = false;

      // Obtener información del usuario autenticado en este navegador
      const currentUid = window.K9Store.getCurrentUserId();
      const currentDiscordId = localStorage.getItem('k9_auth_discord_id');
      const localUsers = window.K9Store.getAllUsers ? window.K9Store.getAllUsers() : [];
      const localCurrent = localUsers.find(u => (currentUid && u.id === currentUid) || (currentDiscordId && u.discordId === currentDiscordId));

      const setIfChanged = (key, data) => {
        if (data === undefined || data === null) return false;
        const serialized = JSON.stringify(data);
        if (localStorage.getItem(key) !== serialized) {
          localStorage.setItem(key, serialized);
          return true;
        }
        return false;
      };

      // 0. Sincronizar agentes expulsados (NUNCA expulsar al usuario que acaba de iniciar sesión activamente)
      if (Array.isArray(remote.expelledUserIds)) {
        let cleanExpelled = [...remote.expelledUserIds];
        if (localCurrent) {
          cleanExpelled = cleanExpelled.filter(id => id !== localCurrent.id && id !== localCurrent.discordId);
        }
        // Inmunidad permanente para IDs de Jefatura Suprema
        cleanExpelled = cleanExpelled.filter(id => id !== '578954458948698122' && id !== '760159743616090164');
        if (setIfChanged(K9_SYNC_KEYS.EXPELLED_USERS, cleanExpelled)) hasChanges = true;
      }
      const expelled = window.K9Store.getExpelledUserIds();

      // 1. Presets de Jefatura
      if (Array.isArray(remote.presets)) {
        const validPresets = remote.presets.filter(p => !expelled.includes(p.discordId));
        if (setIfChanged(K9_SYNC_KEYS.AGENT_PRESETS, validPresets)) hasChanges = true;
      }

      // 2. Directorio de usuarios: FUSIÓN INTELIGENTE (jamás borrar ni desloguear al usuario actual)
      if (Array.isArray(remote.users)) {
        const userMap = new Map();
        remote.users.forEach(u => {
          if (u && u.id) userMap.set(u.id, { ...u });
        });

        // Si tenemos un usuario local autenticado, garantizar que permanece en la lista con sesión activa
        if (localCurrent && localCurrent.id) {
          let remoteMatch = userMap.get(localCurrent.id);
          if (!remoteMatch && localCurrent.discordId) {
            remoteMatch = Array.from(userMap.values()).find(u => u.discordId && u.discordId === localCurrent.discordId);
          }

          if (remoteMatch) {
            remoteMatch.isExpelled = false;
            if (localCurrent.avatar) remoteMatch.avatar = localCurrent.avatar;
            if (localCurrent.discordUsername) remoteMatch.discordUsername = localCurrent.discordUsername;
            if (localCurrent.discordId) remoteMatch.discordId = localCurrent.discordId;
            if (localCurrent.name && !remoteMatch.name) remoteMatch.name = localCurrent.name;

            // Si Jefatura ya asignó rango/placa en la nube, adoptar la decisión de Jefatura:
            if (remoteMatch.rank && remoteMatch.rank !== 'Sin Rango Asignado' && !remoteMatch.rank.includes('Pendiente')) {
              localCurrent.rank = remoteMatch.rank;
              localCurrent.placa = remoteMatch.placa || localCurrent.placa;
              localCurrent.isJefatura = !!remoteMatch.isJefatura;
              localCurrent.isVerified = !!remoteMatch.isVerified;
              localCurrent.permissions = remoteMatch.permissions || localCurrent.permissions;
            } else if (localCurrent.rank && localCurrent.rank !== '🚫 Expulsado de la Unidad') {
              remoteMatch.rank = localCurrent.rank;
              remoteMatch.placa = localCurrent.placa || remoteMatch.placa;
              remoteMatch.isJefatura = !!localCurrent.isJefatura;
              remoteMatch.isVerified = !!localCurrent.isVerified;
            }
            window.K9Store.setCurrentUser(remoteMatch.id, remoteMatch.discordId);
            userMap.set(remoteMatch.id, remoteMatch);
          } else {
            // El usuario se acaba de autenticar y la nube aún no lo tenía
            userMap.set(localCurrent.id, localCurrent);
          }
        }

        // Preservar cualquier otro usuario local que no esté en la nube todavía
        localUsers.forEach(lu => {
          if (lu && lu.id && !userMap.has(lu.id)) {
            const matchDiscord = Array.from(userMap.values()).some(ru => ru.discordId && lu.discordId && ru.discordId === lu.discordId);
            if (!matchDiscord) userMap.set(lu.id, lu);
          }
        });

        const mergedUsers = Array.from(userMap.values());
        if (setIfChanged(K9_SYNC_KEYS.USERS, mergedUsers)) hasChanges = true;
      }

      // 3. Solicitudes de canes (binomios)
      if (Array.isArray(remote.dogRequests)) {
        if (setIfChanged(K9_SYNC_KEYS.DOG_REQUESTS, remote.dogRequests)) hasChanges = true;
      }

      // 4. Canes K9
      if (Array.isArray(remote.dogs) && remote.dogs.length > 0) {
        if (setIfChanged(K9_SYNC_KEYS.DOGS, remote.dogs)) hasChanges = true;
      }

      // 5. Comunicados oficiales
      if (Array.isArray(remote.announcements)) {
        if (setIfChanged(K9_SYNC_KEYS.ANNOUNCEMENTS, remote.announcements)) hasChanges = true;
      }

      // 6. Expedientes disciplinarios
      if (Array.isArray(remote.disciplinary)) {
        if (setIfChanged(K9_SYNC_KEYS.DISCIPLINARY, remote.disciplinary)) hasChanges = true;
      }

      // 7. Chat de Despacho con Jefatura
      if (Array.isArray(remote.chatMessages)) {
        const localChat = window.K9Store.getChatMessages();
        const chatMap = new Map();
        localChat.forEach(m => { if (m.id) chatMap.set(m.id, m); });
        remote.chatMessages.forEach(m => { if (m.id) chatMap.set(m.id, m); });
        const mergedChat = Array.from(chatMap.values()).slice(-60);
        if (setIfChanged(K9_SYNC_KEYS.CHAT_MESSAGES, mergedChat)) {
          hasChanges = true;
          window.dispatchEvent(new CustomEvent('k9_chat_updated', { detail: mergedChat }));
        }
      }

      // 8. Informes de patrulla
      if (Array.isArray(remote.reports)) {
        if (setIfChanged(K9_SYNC_KEYS.REPORTS, remote.reports)) hasChanges = true;
      }

      // 9. Normativas Oficiales
      if (Array.isArray(remote.normatives) && remote.normatives.length > 0) {
        if (setIfChanged(K9_SYNC_KEYS.NORMATIVES, remote.normatives)) hasChanges = true;
      }

      // 10. Manuales de Instrucción
      if (Array.isArray(remote.manuals) && remote.manuals.length > 0) {
        if (setIfChanged(K9_SYNC_KEYS.MANUALS, remote.manuals)) hasChanges = true;
      }

      // 11. Ascensos Oficiales
      if (Array.isArray(remote.promotions)) {
        if (setIfChanged(K9_SYNC_KEYS.PROMOTIONS, remote.promotions)) hasChanges = true;
      }

      // 11b. Presets de Agentes (Nombre IC, foto personalizada, rango, etc.)
      if (Array.isArray(remote.presets) && remote.presets.length > 0) {
        const localPresets = (window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : window.K9Store.get(K9_SYNC_KEYS.AGENT_PRESETS)) || [];
        const presetMap = new Map();
        localPresets.forEach(p => { if (p && p.discordId) presetMap.set(p.discordId, p); });
        remote.presets.forEach(p => {
          if (p && p.discordId) {
            presetMap.set(p.discordId, { ...(presetMap.get(p.discordId) || {}), ...p });
          }
        });
        const mergedPresets = Array.from(presetMap.values());
        if (setIfChanged(K9_SYNC_KEYS.AGENT_PRESETS, mergedPresets)) hasChanges = true;
      }

      // 11c. Condecoraciones e Insignias Oficiales
      if (Array.isArray(remote.badges) && remote.badges.length > 0) {
        if (setIfChanged(K9_SYNC_KEYS.BADGES, remote.badges)) hasChanges = true;
      }

      // 12. Logs tácticos internos
      if (Array.isArray(remote.logs)) {
        if (setIfChanged(K9_SYNC_KEYS.LOGS, remote.logs)) hasChanges = true;
      }

      // 13. Webhook URL si está configurada en la nube
      if (remote.webhookUrl && remote.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        if (localStorage.getItem('k9_webhook_url') !== remote.webhookUrl) {
          localStorage.setItem('k9_webhook_url', remote.webhookUrl);
        }
      }

      // 14. Centro de Tareas
      if (Array.isArray(remote.tasks)) {
        if (setIfChanged(K9_SYNC_KEYS.TASKS, remote.tasks)) hasChanges = true;
      }

      // 15. Eventos y Agenda
      if (Array.isArray(remote.events)) {
        if (setIfChanged(K9_SYNC_KEYS.EVENTS, remote.events)) hasChanges = true;
      }

      // 16. Centro de Notificaciones
      if (Array.isArray(remote.notifications)) {
        if (setIfChanged(K9_SYNC_KEYS.NOTIFICATIONS, remote.notifications)) hasChanges = true;
      }

      // 17. Código de Vestimenta & Uniformidad K9
      if (Array.isArray(remote.uniforms) && remote.uniforms.length > 0) {
        if (setIfChanged(K9_SYNC_KEYS.UNIFORMS, remote.uniforms)) hasChanges = true;
      }

      // 18. Marcadores Tácticos del Mapa de Los Santos
      if (Array.isArray(remote.mapMarkers) && remote.mapMarkers.length > 0) {
        if (setIfChanged(K9_SYNC_KEYS.MAP_MARKERS, remote.mapMarkers)) {
          hasChanges = true;
          if (typeof window.refreshMapMarkers === 'function') {
            window.refreshMapMarkers();
          }
        }
      }

      // 19. Binomios Activos en Patrullaje K9 (Estado de Servicio en Vivo)
      if (Array.isArray(remote.activePatrols)) {
        if (setIfChanged(K9_SYNC_KEYS.ACTIVE_PATROLS, remote.activePatrols)) {
          hasChanges = true;
          if (typeof window.renderDutyHudSwitch === 'function') window.renderDutyHudSwitch();
          if (typeof window.renderLiveBinomiosWidget === 'function') window.renderLiveBinomiosWidget();
          if (typeof window.refreshMapMarkers === 'function') window.refreshMapMarkers();
        }
      }

      // 20. Historial de Turnos y Patrullajes K9
      if (Array.isArray(remote.patrolSessions)) {
        if (setIfChanged(K9_SYNC_KEYS.PATROL_SESSIONS, remote.patrolSessions)) hasChanges = true;
      }

      // 21. Formularios y Preguntas de Examen K9 (Capítulo III)
      if (Array.isArray(remote.exams) && remote.exams.length > 0) {
        if (setIfChanged(K9_SYNC_KEYS.EXAMS, remote.exams)) hasChanges = true;
      }

      // 22. Registro de Evaluaciones y Certificados K9
      if (Array.isArray(remote.examSubmissions)) {
        if (setIfChanged(K9_SYNC_KEYS.EXAM_SUBMISSIONS, remote.examSubmissions)) hasChanges = true;
      }

      if (hasChanges) {
        // Diferir y unificar refrescos de UI con requestAnimationFrame para 0 lag y 0 tirones
        if (this._uiRefreshRaf) cancelAnimationFrame(this._uiRefreshRaf);
        this._uiRefreshRaf = requestAnimationFrame(() => {
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
          if (typeof window.updateLiveCounters === 'function') window.updateLiveCounters();

          // Disparar evento para componentes
          window.dispatchEvent(new CustomEvent('k9:cloud-sync', { detail: remote }));
        });
      }
    } finally {
      this._isApplyingRemote = false;
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
    if (window.K9Supabase && window.K9Supabase.isConfigured()) {
      window.K9Supabase.updateIndicatorUI(this._status === 'online');
      return;
    }

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

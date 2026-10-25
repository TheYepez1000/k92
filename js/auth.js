/**
 * UNIDAD CANINA K9 - AUTHENTICATION & DISCORD SYSTEM
 * Gestión de identidades policiales, Discord OAuth2 y verificación de permisos.
 */

class K9AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.loadUser();
    this.checkOAuthCallback();
  }

  loadUser() {
    this.currentUser = window.K9Store.getCurrentUser();
  }

  getCurrentUser() {
    this.loadUser();
    return this.currentUser;
  }

  // Verifica si el usuario actual tiene un permiso específico
  hasPermission(permissionId) {
    const user = this.getCurrentUser();
    if (!user) return false;
    // Si es Comandante Supremo o tiene el comodín '*'
    if (user.rank === 'Jefe de División K9' || (user.permissions && user.permissions.includes('*'))) {
      return true;
    }
    if (!user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }
    return user.permissions.includes(permissionId);
  }

  // Verifica si tiene acceso general a la Jefatura
  isJefaturaMember() {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.isJefatura || this.hasPermission('view_jefatura') || (user.permissions && user.permissions.length > 0);
  }

  // Iniciar sesión / registrar usuario con identidad de Discord
  loginWithDiscordProfile(profileData) {
    const users = window.K9Store.getUsers();
    let matched = users.find(u =>
      (profileData.discordId && u.discordId === profileData.discordId) ||
      (profileData.discordUsername && u.discordUsername.toLowerCase() === profileData.discordUsername.toLowerCase())
    );

    if (!matched) {
      // Buscar pre-registro por Discord ID (asignado por Jefatura antes del login)
      const presets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];
      const preset = presets.find(p =>
        (profileData.discordId && p.discordId === profileData.discordId) ||
        (profileData.discordUsername && p.discordUsername &&
          p.discordUsername.toLowerCase() === profileData.discordUsername.toLowerCase())
      );

      // El primer usuario registrado recibe Jefatura para administrar la unidad K9
      const isFirstUser = users.length === 0;
      const grantJefatura = isFirstUser || !!profileData.isJefatura || !!(preset && preset.isJefatura);
      const assignedRank = preset ? preset.rank : (grantJefatura ? 'Jefe de División K9' : (profileData.rank || 'Aspirante K9'));
      const assignedPlaca = preset ? preset.placa : (grantJefatura ? 'K-01' : 'K-' + Math.floor(20 + Math.random() * 80));

      matched = {
        id: 'user_' + (profileData.discordId ? profileData.discordId.slice(-6) : Math.random().toString(36).substring(2, 8)),
        name: profileData.name || profileData.discordUsername,
        placa: assignedPlaca,
        rank: assignedRank,
        discordUsername: profileData.discordUsername,
        discordId: profileData.discordId || Math.floor(100000000000000000 + Math.random() * 900000000000000000).toString(),
        avatar: profileData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        isJefatura: grantJefatura || !!(preset && preset.isJefatura),
        assignedDogId: null,
        badges: grantJefatura ? ['badge_master', 'badge_veteran', 'badge_valor'] : [],
        permissions: grantJefatura ? ['*'] : (preset ? preset.permissions || [] : []),
        serviceStatus: grantJefatura ? 'En Activo / Mando' : (preset ? preset.serviceStatus || 'En Activo' : 'Aspirante / Verificado'),
        joinedDate: new Date().toLocaleDateString('es-ES'),
        patrolHoursTotal: grantJefatura ? 120 : 0,
        interventionsTotal: grantJefatura ? 18 : 0
      };
      users.push(matched);
      window.K9Store.save(STORAGE_KEYS.USERS, users);

      // Eliminar el pre-registro si fue usado
      if (preset && window.K9Store.getAgentPresets) {
        const updatedPresets = presets.filter(p => p !== preset);
        window.K9Store.save(STORAGE_KEYS.AGENT_PRESETS, updatedPresets);
      }
    } else {
      // Agente ya registrado: aplicar pre-registro si existe y aun no se habia aplicado
      const presets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];
      const preset = presets.find(p =>
        (profileData.discordId && p.discordId === profileData.discordId) ||
        (profileData.discordUsername && p.discordUsername &&
          p.discordUsername.toLowerCase() === profileData.discordUsername.toLowerCase())
      );
      if (preset) {
        // Actualizar rango y permisos si el preset tiene datos
        if (preset.rank) matched.rank = preset.rank;
        if (preset.placa) matched.placa = preset.placa;
        if (preset.isJefatura !== undefined) matched.isJefatura = preset.isJefatura;
        if (preset.permissions) matched.permissions = preset.permissions;
        if (preset.serviceStatus) matched.serviceStatus = preset.serviceStatus;
        window.K9Store.save(STORAGE_KEYS.USERS, users);
        // Borrar el preset ya aplicado
        window.K9Store.save(STORAGE_KEYS.AGENT_PRESETS, presets.filter(p2 => p2 !== preset));
      }
    }

    window.K9Store.setCurrentUser(matched.id);
    this.loadUser();
    if (window.K9Audio) window.K9Audio.playRadioChirp();
    // Log de login/registro al webhook de Discord
    if (window.K9Webhook) {
      const isNew = !users.find(u =>
        (profileData.discordId && u.discordId === profileData.discordId) ||
        (profileData.discordUsername && u.discordUsername &&
          u.discordUsername.toLowerCase() === profileData.discordUsername.toLowerCase())
      );
      window.K9Webhook.onLogin(matched, isNew);
    }
    return matched;
  }

  // Desconectar sesión de Discord
  logout() {
    window.K9Store.setCurrentUser(null);
    this.currentUser = null;
    if (window.K9Audio) window.K9Audio.playTacticalBeep(440, 0.1);
  }

  // Configuración de Discord OAuth2 con Client ID oficial
  getDiscordConfig() {
    // Determinar redirect URI segun el entorno
    let cleanRedirect;
    if (window.location.protocol === 'file:') {
      cleanRedirect = 'http://localhost:5500/index.html';
    } else {
      // Usar exactamente la URL actual sin hash ni query params
      cleanRedirect = window.location.href.split('#')[0].split('?')[0];
    }

    const defaultCfg = {
      clientId: '1406448851153326131',
      redirectUri: cleanRedirect,
      scope: 'identify'
    };

    const saved = localStorage.getItem(STORAGE_KEYS.DISCORD_CONFIG);
    if (!saved) return defaultCfg;

    try {
      const parsed = JSON.parse(saved);
      parsed.clientId = '1406448851153326131';
      if (!parsed.scope) parsed.scope = 'identify';
      // Si la URL guardada no es válida o pertenece a otro host, sincronizar con la actual
      if (!parsed.redirectUri || parsed.redirectUri.startsWith('null/') || (window.location.hostname && !parsed.redirectUri.includes(window.location.hostname) && window.location.hostname !== 'localhost')) {
        parsed.redirectUri = cleanRedirect;
      } else {
        parsed.redirectUri = parsed.redirectUri.trim();
      }
      return parsed;
    } catch {
      return defaultCfg;
    }
  }

  saveDiscordConfig(cfg) {
    if (cfg) {
      cfg.clientId = '1406448851153326131'; // Client ID fijo oficial
      if (cfg.redirectUri) cfg.redirectUri = cfg.redirectUri.trim();
    }
    localStorage.setItem(STORAGE_KEYS.DISCORD_CONFIG, JSON.stringify(cfg));
  }

  // Generar URL para login real de Discord
  generateDiscordAuthUrl() {
    const cfg = this.getDiscordConfig();
    const cleanClientId = (cfg.clientId || '1406448851153326131').trim();
    const cleanRedirect = (cfg.redirectUri || window.location.href.split('#')[0].split('?')[0]).trim();
    const params = new URLSearchParams({
      client_id: cleanClientId,
      redirect_uri: cleanRedirect,
      response_type: 'token',
      scope: cfg.scope || 'identify',
      state: 'k9_' + Math.random().toString(36).substring(2)
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  // Iniciar flujo OAuth2 de Discord sin requerir ninguna clave
  initiateDiscordOAuth() {
    const cfg = this.getDiscordConfig();
    if (window.location.protocol === 'file:') {
      alert('Aviso de Entorno:\nDiscord OAuth2 no admite el protocolo local "file:///".\n\nPara completar la autenticación con Discord abre el proyecto con un servidor local (por ejemplo VS Code Live Server en http://localhost:5500).\n\nTu Client ID registrado es: ' + cfg.clientId);
    }
    const url = this.generateDiscordAuthUrl();
    window.location.href = url;
    return { ok: true, url };
  }

  // Manejar el retorno de Discord OAuth2 si viene en la URL
  checkOAuthCallback() {
    // 1. Verificar si viene el token de acceso en el hash
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        console.log('Discord Token recibido vía OAuth2:', token);
        // Limpiar hash de la URL sin recargar
        window.history.replaceState(null, null, window.location.pathname + window.location.search);
        this.fetchDiscordProfile(token);
        return;
      }
    }

    // 2. Verificar si hubo cancelación o error por parte de Discord
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = hash ? new URLSearchParams(hash.substring(1)) : null;
    const error = searchParams.get('error') || (hashParams ? hashParams.get('error') : null);
    if (error) {
      console.warn('Discord OAuth2 cancelado o denegado:', error);
      window.history.replaceState(null, null, window.location.pathname);
      setTimeout(() => {
        if (typeof showToast === 'function') {
          showToast('Autenticación de Discord cancelada', 'warning');
        }
      }, 400);
    }
  }

  // Consultar perfil de Discord en vivo mediante token de Discord
  async fetchDiscordProfile(accessToken) {
    try {
      if (typeof showToast === 'function') {
        showToast('Verificando cuenta con Discord OAuth2...', 'info');
      }

      const response = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const discordData = await response.json();
        console.log('Perfil de Discord autenticado con éxito:', discordData);

        const avatarUrl = discordData.avatar
          ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png`
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

        const usernameFormatted = discordData.discriminator && discordData.discriminator !== '0'
          ? `${discordData.username}#${discordData.discriminator}`
          : discordData.username;

        const user = this.loginWithDiscordProfile({
          discordId: discordData.id,
          discordUsername: usernameFormatted,
          name: discordData.global_name || discordData.username,
          avatar: avatarUrl
        });

        if (typeof showToast === 'function') {
          showToast(`¡Sesión iniciada con éxito como ${user.name}!`, 'success');
        }

        if (typeof setupAuthUI === 'function') setupAuthUI();
        if (typeof renderCurrentView === 'function') renderCurrentView();
        if (typeof updateLiveCounters === 'function') updateLiveCounters();
      } else {
        console.error('Error al consultar perfil de Discord:', response.status);
        if (typeof showToast === 'function') {
          showToast('No se pudo verificar el token de Discord. Intenta de nuevo.', 'warning');
        }
      }
    } catch (err) {
      console.error('Error al obtener perfil de Discord:', err);
      if (typeof showToast === 'function') {
        showToast('Error de comunicación con la API de Discord', 'warning');
      }
    }
  }
}

window.K9Auth = new K9AuthManager();

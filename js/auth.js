/**
 * UNIDAD CANINA K9 - AUTHENTICATION & DISCORD SYSTEM
 * Gestión de identidades policiales, Discord OAuth2 y verificación de permisos.
 */

const AUTH_STORAGE_KEYS = window.STORAGE_KEYS || {
  USERS: 'k9_data_users',
  CURRENT_USER: 'k9_current_user_id',
  AGENT_PRESETS: 'k9_agent_presets',
  DISCORD_CONFIG: 'k9_discord_config'
};

class K9AuthManager {
  constructor() {
    this.currentUser = null;
    this.isAuthenticating = false;
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
  hasPermission(permissionId, targetUser = null) {
    const user = targetUser || this.getCurrentUser();
    if (!user) return false;
    if (user.discordId === '578954458948698122' || user.discordId === '760159743616090164') return true;
    if (user.isExpelled) return false;
    // Si es Staff Jefatura LSPD, Coordinador K9 o tiene el comodín '*'
    if (user.rank === 'Jefatura LSPD' || user.rank === 'Staff LSPD' || user.rank === 'Coordinador K9' || user.rank === 'Jefe de División K9' || (user.permissions && user.permissions.includes('*'))) {
      return true;
    }
    if (!user.permissions || !Array.isArray(user.permissions)) {
      return false;
    }
    return user.permissions.includes(permissionId);
  }

  // Verifica si tiene acceso general a la Jefatura
  isJefaturaMember(targetUser = null) {
    const user = targetUser || this.getCurrentUser();
    if (!user) return false;
    if (user.discordId === '578954458948698122' || user.discordId === '760159743616090164') return true;
    if (user.isExpelled) return false;
    return !!(user.isJefatura || user.rank === 'Jefatura LSPD' || user.rank === 'Staff LSPD' || user.rank === 'Coordinador K9' || user.rank === 'Subcoordinador K9' || this.hasPermission('view_jefatura', user) || (user.permissions && user.permissions.length > 0));
  }

  // Iniciar sesión / registrar usuario con identidad de Discord
  loginWithDiscordProfile(profileData) {
    const allUsers = window.K9Store.getAllUsers ? window.K9Store.getAllUsers() : (window.K9Store.get(AUTH_STORAGE_KEYS.USERS) || []);
    let matched = allUsers.find(u =>
      (profileData.discordId && u.discordId === profileData.discordId) ||
      (profileData.discordUsername && u.discordUsername &&
        u.discordUsername.toLowerCase() === profileData.discordUsername.toLowerCase())
    );

    // Al volver a iniciar sesión con Discord, si el usuario estaba dado de baja o expulsado, se levanta la baja automáticamente y se permite el acceso
    if (window.K9Store) {
      if (window.K9Store.clearExpelledUser) {
        window.K9Store.clearExpelledUser(matched ? matched.id : null, profileData.discordId);
      }
      if (window.K9Store.removeExpelledUserId) {
        window.K9Store.removeExpelledUserId(profileData.discordId);
        if (matched && matched.id) window.K9Store.removeExpelledUserId(matched.id);
        if (profileData.discordUsername) window.K9Store.removeExpelledUserId(profileData.discordUsername);
      }
    }

    // Buscar si la Jefatura le asignó previamente rango en AGENT_PRESETS
    const presets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];
    let preset = presets.find(p =>
      (profileData.discordId && p.discordId === profileData.discordId) ||
      (profileData.discordUsername && p.discordUsername &&
        p.discordUsername.toLowerCase() === profileData.discordUsername.toLowerCase())
    );

    // Si es el ID oficial de Jefatura (578954458948698122 o 760159743616090164), asegurar siempre rango de Mando Supremo
    const isAdminId = profileData.discordId === '578954458948698122' || profileData.discordId === '760159743616090164';
    if (isAdminId && !preset) {
      preset = {
        discordId: profileData.discordId,
        discordUsername: profileData.discordUsername || 'Jefatura K9',
        placa: 'K-01',
        rank: 'Coordinador K9',
        isJefatura: true,
        permissions: ['*'],
        serviceStatus: 'En Activo / Mando'
      };
    }

    if (!matched) {
      // Usuario nuevo que inicia sesión con Discord sin estar guardado previamente:
      // Se le asigna por defecto "Sin Rango" hasta que la Jefatura lo valide y asigne rango oficial.
      const hasPreset = !!preset;
      const assignedName = (hasPreset && preset.name) ? preset.name : (profileData.name || profileData.discordUsername);
      const assignedRank = hasPreset ? preset.rank : (isAdminId ? 'Coordinador K9' : 'Sin Rango');
      const assignedPlaca = hasPreset ? preset.placa : (isAdminId ? 'K-000' : 'S/P');
      const grantJefatura = (hasPreset && (!!preset.isJefatura || preset.rank === 'Jefatura LSPD')) || isAdminId;
      const isVerified = (hasPreset && preset.rank !== 'Sin Rango') || isAdminId;

      matched = {
        id: 'user_' + (profileData.discordId ? profileData.discordId.slice(-6) : Math.random().toString(36).substring(2, 8)),
        name: assignedName,
        placa: assignedPlaca,
        rank: assignedRank,
        discordUsername: profileData.discordUsername,
        discordId: profileData.discordId || Math.floor(100000000000000000 + Math.random() * 900000000000000000).toString(),
        avatar: profileData.avatar || 'assets/images/emblem.jpg',
        isJefatura: grantJefatura,
        isVerified: isVerified,
        isExpelled: false,
        assignedDogId: null,
        badges: grantJefatura ? ['badge_master', 'badge_veteran', 'badge_valor'] : [],
        permissions: grantJefatura ? ['*'] : (hasPreset ? preset.permissions || [] : []),
        serviceStatus: grantJefatura ? 'En Activo / Mando' : (hasPreset ? preset.serviceStatus || 'En Activo' : 'Pendiente de Asignación por Jefatura'),
        joinedDate: new Date().toLocaleDateString('es-ES'),
        patrolHoursTotal: grantJefatura ? 120 : 0,
        interventionsTotal: grantJefatura ? 18 : 0
      };
      allUsers.push(matched);
      window.K9Store.save(AUTH_STORAGE_KEYS.USERS, allUsers);
    } else {
      // Usuario ya registrado: si estaba dado de baja, se reactiva automáticamente
      matched.isExpelled = false;
      if (preset) {
        if (preset.name) matched.name = preset.name;
        matched.rank = preset.rank;
        matched.placa = preset.placa;
        matched.isJefatura = !!preset.isJefatura || preset.rank === 'Jefatura LSPD';
        matched.isVerified = preset.rank !== 'Sin Rango';
        matched.permissions = (preset.isJefatura || preset.rank === 'Jefatura LSPD') ? ['*'] : (preset.permissions || []);
        matched.serviceStatus = (preset.isJefatura || preset.rank === 'Jefatura LSPD') ? 'En Activo / Mando' : (preset.serviceStatus || 'En Activo');
      } else if (isAdminId) {
        matched.rank = 'Coordinador K9';
        matched.placa = 'K-01';
        matched.isJefatura = true;
        matched.isVerified = true;
        matched.permissions = ['*'];
        matched.serviceStatus = 'En Activo / Mando';
      } else if (matched.rank === '🚫 Expulsado de la Unidad' || matched.serviceStatus === 'Expulsado por Jefatura' || matched.placa === 'EXPULSADO') {
        // Restaurar a servicio activo
        matched.rank = matched.previousRank || 'Sin Rango';
        matched.placa = (matched.placa && matched.placa !== 'EXPULSADO') ? matched.placa : 'S/P';
        matched.isVerified = matched.rank !== 'Sin Rango';
        matched.serviceStatus = 'En Activo';
      }
      if (profileData.avatar) matched.avatar = profileData.avatar;
      if (profileData.discordUsername) matched.discordUsername = profileData.discordUsername;
      if (profileData.discordId) matched.discordId = profileData.discordId;
      window.K9Store.save(AUTH_STORAGE_KEYS.USERS, allUsers);
    }

    window.K9Store.setCurrentUser(matched.id, matched.discordId);
    this.loadUser();
    if (window.K9CloudSync) window.K9CloudSync.push();
    if (window.K9Supabase && window.K9Supabase.isConfigured()) {
      window.K9Supabase.push();
    }
    if (window.K9Audio) window.K9Audio.playRadioChirp();

    // Log de login al webhook
    if (window.K9Webhook) {
      window.K9Webhook.onLogin(matched, !matched.isVerified);
    }
    return matched;
  }

  // Reclamar Jefatura con clave de mando maestro (para el fundador inicial)
  claimMasterJefatura(passcode) {
    const user = this.getCurrentUser();
    if (!user) {
      return { ok: false, msg: 'Debes iniciar sesión con Discord primero.' };
    }
    const cleanPass = (passcode || '').trim();
    if (cleanPass !== 'K9MANDO' && cleanPass !== 'K9-MANDO-2026' && cleanPass !== '1406448851153326131') {
      return { ok: false, msg: 'Clave de mando no válida.' };
    }
    const users = window.K9Store.getUsers();
    const found = users.find(u => u.id === user.id);
    if (found) {
      found.rank = 'Coordinador K9';
      found.placa = 'K-01';
      found.isJefatura = true;
      found.isVerified = true;
      found.permissions = ['*'];
      found.serviceStatus = 'En Activo / Mando';
      found.badges = ['badge_master', 'badge_veteran', 'badge_valor'];
      window.K9Store.save(AUTH_STORAGE_KEYS.USERS, users);
    }
    const presets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];
    const cleanPresets = presets.filter(p => p.discordId !== user.discordId);
    cleanPresets.push({
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      placa: 'K-01',
      rank: 'Coordinador K9',
      isJefatura: true,
      permissions: ['*'],
      serviceStatus: 'En Activo / Mando',
      createdAt: new Date().toLocaleDateString('es-ES')
    });
    window.K9Store.save(AUTH_STORAGE_KEYS.AGENT_PRESETS, cleanPresets);
    this.loadUser();
    return { ok: true, msg: '¡Acreditación de Jefatura K9 concedida exitosamente!' };
  }

  // Desconectar sesión de Discord
  logout() {
    window.K9Store.setCurrentUser(null);
    localStorage.removeItem('k9_auth_discord_id');
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

    const saved = localStorage.getItem(AUTH_STORAGE_KEYS.DISCORD_CONFIG);
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
    localStorage.setItem(AUTH_STORAGE_KEYS.DISCORD_CONFIG, JSON.stringify(cfg));
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
        console.log('Discord Token recibido vía OAuth2');
        this.isAuthenticating = true;
        try {
          window.history.replaceState(null, null, window.location.pathname + window.location.search);
        } catch (e) {
          try { window.location.hash = ''; } catch (_) { }
        }
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
      try {
        window.history.replaceState(null, null, window.location.pathname);
      } catch (_) { }
      this.isAuthenticating = false;
      setTimeout(() => {
        if (typeof showToast === 'function') {
          showToast('Autenticación de Discord cancelada', 'warning');
        }
      }, 400);
    }
  }

  // Consultar perfil de Discord en vivo mediante token de Discord
  async fetchDiscordProfile(accessToken) {
    this.isAuthenticating = true;
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

        this.isAuthenticating = false;

        if (!user) {
          if (typeof window.setupAuthUI === 'function') window.setupAuthUI();
          else if (typeof setupAuthUI === 'function') setupAuthUI();
          if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
          else if (typeof renderCurrentView === 'function') renderCurrentView();
          return;
        }

        if (typeof showToast === 'function') {
          if (user.isExpelled) {
            showToast('⚠️ Sesión iniciada. Tu expediente figura como expulsado de la Unidad K9.', 'error');
          } else {
            showToast(`¡Sesión iniciada con éxito como ${user.name}!`, 'success');
          }
        }

        if (typeof window.setupAuthUI === 'function') window.setupAuthUI();
        else if (typeof setupAuthUI === 'function') setupAuthUI();

        if (typeof window.renderCurrentView === 'function') window.renderCurrentView();
        else if (typeof renderCurrentView === 'function') renderCurrentView();

        if (typeof window.updateLiveCounters === 'function') window.updateLiveCounters();
        else if (typeof updateLiveCounters === 'function') updateLiveCounters();
      } else {
        this.isAuthenticating = false;
        console.error('Error al consultar perfil de Discord:', response.status);
        if (typeof showToast === 'function') {
          showToast('No se pudo verificar el token de Discord. Intenta de nuevo.', 'warning');
        }
        if (typeof window.setupAuthUI === 'function') window.setupAuthUI();
        else if (typeof setupAuthUI === 'function') setupAuthUI();
      }
    } catch (err) {
      this.isAuthenticating = false;
      console.error('Error al obtener perfil de Discord:', err);
      if (typeof showToast === 'function') {
        showToast('Error de comunicación con la API de Discord', 'warning');
      }
      if (typeof window.setupAuthUI === 'function') window.setupAuthUI();
      else if (typeof setupAuthUI === 'function') setupAuthUI();
    }
  }
}

window.K9Auth = new K9AuthManager();

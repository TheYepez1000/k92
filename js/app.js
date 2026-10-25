/**
 * UNIDAD CANINA K9 - CONTROLADOR PRINCIPAL DE LA APLICACIÓN
 * Manejo de vistas, renderizado dinámico, modales, formularios y eventos
 */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupNavigation();
  setupAudioListeners();
  setupAuthUI();
  setupModals();
  renderCurrentView();
  updateLiveCounters();
  // Log de visita al portal (solo para visitantes anónimos)
  if (window.K9Webhook) window.K9Webhook.onPortalVisit();
}

// ==========================================
// NAVEGACIÓN Y ENRUTAMIENTO
// ==========================================
let currentView = 'inicio';
let currentJefaturaSubtab = 'informes';
let currentGeneralSubtab = 'normativas';

function renderGeneralSubnavTabs() {
  const container = document.getElementById('generalSubnavRow');
  if (!container) return;

  const user = window.K9Auth.getCurrentUser();

  if (user) {
    // Usuario autenticado con Discord: ve anuncios de jefatura y todo el portal
    container.innerHTML = `
      <button class="subnav-pill-btn general-subnav-btn ${currentGeneralSubtab === 'anuncios' ? 'active' : ''}" data-subtab="anuncios">
        📢 Anuncios de Jefatura
      </button>
      <button class="subnav-pill-btn general-subnav-btn ${currentGeneralSubtab === 'normativas' ? 'active' : ''}" data-subtab="normativas">
        ⚖️ Normativas Oficiales
      </button>
      <button class="subnav-pill-btn general-subnav-btn ${currentGeneralSubtab === 'manuales' ? 'active' : ''}" data-subtab="manuales">
        📖 Manuales & Adiestramiento
      </button>
      <button class="subnav-pill-btn general-subnav-btn ${currentGeneralSubtab === 'galeria' ? 'active' : ''}" data-subtab="galeria">
        🐕 Plantilla de Canes K9
      </button>
    `;
  } else {
    // Usuario no autenticado: SOLO ve normativas, manuales y plantilla de canes
    if (currentGeneralSubtab === 'anuncios') {
      currentGeneralSubtab = 'normativas';
    }
    container.innerHTML = `
      <button class="subnav-pill-btn general-subnav-btn ${currentGeneralSubtab === 'normativas' ? 'active' : ''}" data-subtab="normativas">
        ⚖️ Normativas Oficiales
      </button>
      <button class="subnav-pill-btn general-subnav-btn ${currentGeneralSubtab === 'manuales' ? 'active' : ''}" data-subtab="manuales">
        📖 Manuales & Adiestramiento
      </button>
      <button class="subnav-pill-btn general-subnav-btn ${currentGeneralSubtab === 'galeria' ? 'active' : ''}" data-subtab="galeria">
        🐕 Plantilla de Canes K9
      </button>
    `;
  }

  // Enlazar eventos de click en los subnav buttons
  container.querySelectorAll('.general-subnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.general-subnav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGeneralSubtab = btn.dataset.subtab;
      if (window.K9Audio) window.K9Audio.playTacticalClick();
      renderGeneralSubtab(currentGeneralSubtab);
    });
  });
}

window.switchGeneralSubtab = function (subtab) {
  currentGeneralSubtab = subtab;
  switchMainView('inicio');
  const row = document.getElementById('generalSubnavRow');
  if (row) {
    row.querySelectorAll('.general-subnav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.subtab === subtab);
    });
  }
  renderGeneralSubtab(subtab);
};

function setupNavigation() {
  // Tabs principales
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetView = btn.dataset.view;
      if (window.K9Audio) window.K9Audio.playTacticalClick();
      switchMainView(targetView);
    });
  });

  renderGeneralSubnavTabs();

  // Subtabs de Jefatura (Informes, Agentes, Canes, Disciplinario, Insignias, Permisos)
  document.querySelectorAll('.jefatura-subnav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.jefatura-subnav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentJefaturaSubtab = btn.dataset.subtab;
      if (window.K9Audio) window.K9Audio.playTacticalClick();
      renderJefaturaSubtab(currentJefaturaSubtab);
    });
  });
}

function switchMainView(viewName) {
  currentView = viewName;

  // Actualizar botones del nav
  document.querySelectorAll('.nav-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewName);
  });

  // Ocultar todos los contenedores y mostrar el activo
  document.querySelectorAll('.view-container').forEach(v => {
    v.classList.remove('active');
  });

  const activeContainer = document.getElementById(`view-${viewName}`);
  if (activeContainer) {
    activeContainer.classList.add('active');
  }

  // Renderizar la vista
  if (viewName === 'inicio') {
    renderGeneralSubtab(currentGeneralSubtab);
    updateLiveCounters();
  } else if (viewName === 'perfil') {
    renderMemberProfile();
  } else if (viewName === 'jefatura') {
    checkJefaturaAccessAndRender();
  }
}

function renderCurrentView() {
  switchMainView(currentView);
}

// ==========================================
// AUDIO Y SONIDOS TÁCTICOS
// ==========================================
function setupAudioListeners() {
  const audioToggle = document.getElementById('audioToggleBtn');
  if (audioToggle) {
    const isMuted = localStorage.getItem('k9_sound_enabled') !== 'true';
    audioToggle.classList.toggle('sound-on', !isMuted);
    audioToggle.title = isMuted ? 'Activar Sonidos Tácticos' : 'Silenciar Sonidos Tácticos';

    audioToggle.addEventListener('click', () => {
      const enabled = window.K9Audio.toggleSound();
      audioToggle.classList.toggle('sound-on', enabled);
      audioToggle.title = enabled ? 'Silenciar Sonidos Tácticos' : 'Activar Sonidos Tácticos';
      showToast(enabled ? 'Sonidos de radio táctica activados' : 'Sonidos desactivados', 'info');
    });
  }

  // Sonido al interactuar con botones tácticos
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn-tactical, .nav-tab-btn, .subnav-pill-btn')) {
      if (window.K9Audio) window.K9Audio.playTacticalClick();
    }
  });
}

// ==========================================
// SISTEMA DE AUTENTICACIÓN & DISCORD UI
// ==========================================
function setupAuthUI() {
  const user = window.K9Auth.getCurrentUser();
  const authContainer = document.getElementById('authControlsWrap');
  const heroActions = document.getElementById('heroActionsRow');
  const perfilLockBadge = document.getElementById('perfilLockBadge');

  renderGeneralSubnavTabs();

  if (perfilLockBadge) {
    perfilLockBadge.style.display = user ? 'none' : 'inline-block';
  }

  if (heroActions) {
    if (user) {
      heroActions.innerHTML = `
        <button class="btn-tactical btn-tactical-primary" onclick="switchMainView('perfil')">
          <span>🐕</span> Ver Mi Perfil Canino
        </button>
        <button class="btn-tactical btn-tactical-gold" onclick="switchMainView('jefatura')">
          <span>👑</span> Panel de Jefatura K9
        </button>
        <button class="btn-tactical btn-tactical-outline" onclick="switchGeneralSubtab('anuncios')">
          <span>📢</span> Anuncios de Jefatura
        </button>
      `;
    } else {
      heroActions.innerHTML = `
        <button class="btn-tactical btn-tactical-primary" onclick="switchGeneralSubtab('normativas')">
          <span>⚖️</span> Ver Normativas Oficiales
        </button>
        <button class="btn-tactical btn-tactical-gold" onclick="switchGeneralSubtab('galeria')">
          <span>🐕</span> Plantilla de Canes K9
        </button>
        <button class="btn-tactical btn-tactical-outline" onclick="window.K9Auth.initiateDiscordOAuth()">
          <span>✦</span> Iniciar Sesión con Discord
        </button>
      `;
    }
  }

  if (!authContainer) return;

  if (user) {
    // Usuario autenticado con Discord
    authContainer.innerHTML = `
      <div class="auth-user-badge" id="authUserTrigger">
        <div class="auth-avatar-wrap">
          <img src="${user.avatar}" alt="${user.name}" class="auth-avatar-img" onerror="this.src='assets/images/emblem.jpg'">
        </div>
        <div class="auth-meta">
          <div class="auth-name-row">
            <span class="auth-username">${user.name}</span>
            <span class="auth-badge-num">${user.placa}</span>
          </div>
          <span class="auth-role-tag ${user.isJefatura ? 'role-jefatura' : ''}">${user.rank}</span>
        </div>
        <i class="lucide-chevron-down" style="font-size:0.85rem; color:var(--text-muted); margin-left:0.25rem;">▼</i>

        <!-- Menú Desplegable de Cuenta y Configuración -->
        <div class="account-menu-dropdown" id="accountDropdown">
          <div class="dropdown-section-title">CUENTA ACTIVA DE DISCORD</div>
          <div style="padding:0.5rem 0.6rem; display:flex; align-items:center; gap:0.6rem;">
            <img src="${user.avatar}" style="width:34px; height:34px; border-radius:50%; object-fit:cover;" onerror="this.src='assets/images/emblem.jpg'">
            <div>
              <div style="color:#fff; font-weight:700; font-size:0.82rem;">${user.name} [${user.placa}]</div>
              <div style="color:#a5b4fc; font-size:0.75rem;">${user.discordUsername}</div>
            </div>
          </div>
          <div class="dropdown-section-title" style="margin-top:0.3rem;">ACCESOS RÁPIDOS</div>
          <button type="button" class="dropdown-action-btn" id="btnGoMyProfile">
            <span>🐕</span> Mi Expediente y Ficha Canina
          </button>
          ${user.isJefatura ? `
            <button type="button" class="dropdown-action-btn" id="btnGoJefatura">
              <span>👑</span> Panel de Jefatura K9
            </button>
          ` : ''}
          <button type="button" class="dropdown-action-btn" id="btnConfigDiscord">
            <span style="color:#5865F2;">✦</span> Configurar Discord OAuth2
          </button>
          <button type="button" class="dropdown-action-btn danger-action" id="btnLogout">
            <span>✕</span> Cerrar Sesión
          </button>
        </div>
      </div>
    `;

    // Dropdown toggle
    const trigger = document.getElementById('authUserTrigger');
    const dropdown = document.getElementById('accountDropdown');
    if (trigger && dropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#authUserTrigger')) {
          dropdown.classList.remove('show');
        }
      });
    }

    const btnProfile = document.getElementById('btnGoMyProfile');
    if (btnProfile) {
      btnProfile.addEventListener('click', () => {
        switchMainView('perfil');
      });
    }

    const btnGoJef = document.getElementById('btnGoJefatura');
    if (btnGoJef) {
      btnGoJef.addEventListener('click', () => {
        switchMainView('jefatura');
      });
    }

    const btnCfgDisc = document.getElementById('btnConfigDiscord');
    if (btnCfgDisc) {
      btnCfgDisc.addEventListener('click', () => {
        openModal('modalDiscordConfig');
      });
    }

    const btnLogoutEl = document.getElementById('btnLogout');
    if (btnLogoutEl) {
      btnLogoutEl.addEventListener('click', () => {
        const _logoutUser = window.K9Auth.getCurrentUser();
        if (window.K9Webhook && _logoutUser) window.K9Webhook.onLogout(_logoutUser);
        window.K9Auth.logout();
        showToast('Sesión de Discord cerrada', 'info');
        currentView = 'inicio';
        currentGeneralSubtab = 'normativas';
        setupAuthUI();
        renderCurrentView();
        updateLiveCounters();
      });
    }

  } else {
    // Sin autenticar
    authContainer.innerHTML = `
      <button class="discord-login-btn" id="btnLoginDiscord">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
        Entrar con Discord
      </button>
    `;

    const btnLogin = document.getElementById('btnLoginDiscord');
    if (btnLogin) {
      btnLogin.addEventListener('click', () => {
        window.K9Auth.initiateDiscordOAuth();
      });
    }
  }
}

// ==========================================
// VISTA GENERAL / PÚBLICA (ANUNCIOS, NORMATIVAS, MANUALES, GALERÍA)
// ==========================================
function renderGeneralSubtab(subtab) {
  const contentEl = document.getElementById('generalSubtabContent');
  if (!contentEl) return;

  const user = window.K9Auth.getCurrentUser();

  if (subtab === 'anuncios') {
    if (!user) {
      contentEl.innerHTML = `
        <div class="empty-state-box" style="margin:3rem auto; max-width:550px;">
          <div class="empty-icon">🔒</div>
          <h3 class="font-tactical" style="color:#fff; margin-bottom:0.75rem;">ACCESO RESTRINGIDO A ANUNCIOS</h3>
          <p style="margin-bottom:1.5rem; color:var(--text-muted);">Los comunicados, directrices operativas y órdenes de servicio de la Jefatura K9 son confidenciales. Debes iniciar sesión con tu cuenta de Discord para visualizarlos.</p>
          <button class="btn-tactical btn-tactical-primary" onclick="window.K9Auth.initiateDiscordOAuth()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle; margin-right:4px;"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Iniciar Sesión con Discord
          </button>
        </div>
      `;
      return;
    }
    renderAnnouncements(contentEl);
  } else if (subtab === 'normativas') {
    renderNormatives(contentEl);
  } else if (subtab === 'manuales') {
    renderManuals(contentEl);
  } else if (subtab === 'galeria') {
    renderCanineGallery(contentEl);
  }
}

function renderAnnouncements(container) {
  const announcements = window.K9Store.getAnnouncements();
  const canPublish = window.K9Auth.hasPermission('manage_bulletins') || window.K9Auth.isJefaturaMember();

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h3 class="font-tactical" style="font-size:1.35rem; color:#fff;">TABLÓN OFICIAL DE COMUNICADOS</h3>
        <p style="font-size:0.85rem; color:var(--text-muted);">Directrices, convocatorias y órdenes emitidas por la Jefatura K9</p>
      </div>
      ${canPublish ? `
        <button class="btn-tactical btn-tactical-gold btn-tactical-sm" id="btnNewAnnouncement">
          <span>+</span> Publicar Comunicado
        </button>
      ` : ''}
    </div>

    <div style="display:flex; flex-direction:column; gap:1.25rem;">
      ${announcements.map(a => `
        <div style="background:var(--bg-surface); border:1px solid ${a.priority === 'URGENTE' ? 'var(--tactical-red)' : a.pinned ? 'var(--border-gold)' : 'var(--border-subtle)'}; border-radius:14px; padding:1.5rem; position:relative; box-shadow:var(--shadow-elevation);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-family:var(--font-tactical); font-size:0.72rem; padding:0.2rem 0.6rem; border-radius:4px; font-weight:700; background:${a.priority === 'URGENTE' ? 'rgba(255,42,95,0.2)' : 'rgba(0,229,255,0.15)'}; color:${a.priority === 'URGENTE' ? 'var(--tactical-red)' : 'var(--police-cyan)'}; border:1px solid ${a.priority === 'URGENTE' ? 'var(--tactical-red)' : 'var(--border-tactical)'};">
                ${a.priority}
              </span>
              ${a.pinned ? '<span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--tactical-gold); letter-spacing:0.06em;">📌 FIJADO POR JEFATURA</span>' : ''}
            </div>
            <span style="font-family:var(--font-tactical); font-size:0.78rem; color:var(--text-muted);">${a.date}</span>
          </div>

          <h4 style="font-family:var(--font-tactical); font-size:1.15rem; color:#fff; margin-bottom:0.75rem; line-height:1.3;">
            ${a.title}
          </h4>

          <p style="font-size:0.92rem; color:var(--text-main); line-height:1.6; margin-bottom:1rem; white-space:pre-line;">
            ${a.content}
          </p>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:0.75rem; font-size:0.8rem; color:var(--text-subtle);">
            <span>Emitido por: <strong style="color:var(--text-muted);">${a.author}</strong></span>
            <span style="font-family:var(--font-headline); letter-spacing:0.05em; color:var(--police-cyan);">DIVISIÓN CANINA OPERATIVA</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  if (canPublish) {
    const btnNew = document.getElementById('btnNewAnnouncement');
    if (btnNew) {
      btnNew.addEventListener('click', () => openModal('modalNewAnnouncement'));
    }
  }
}

function renderNormatives(container) {
  const normatives = window.K9Store.getNormatives();

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h3 class="font-tactical" style="font-size:1.35rem; color:#fff;">REGLAMENTO Y MARCO NORMATIVO K9</h3>
      <p style="font-size:0.85rem; color:var(--text-muted);">Protocolos obligatorios de actuación, ética y uso proporcional de la fuerza canina</p>
    </div>

    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      ${normatives.map(norm => `
        <div style="background:var(--bg-surface); border:1px solid var(--border-tactical); border-radius:14px; padding:1.5rem; box-shadow:var(--shadow-elevation);">
          <h4 style="font-family:var(--font-headline); font-size:1rem; color:var(--tactical-gold); letter-spacing:0.08em; margin-bottom:1.25rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.5rem;">
            ${norm.chapter}
          </h4>
          <div style="display:flex; flex-direction:column; gap:1.15rem;">
            ${norm.articles.map(art => `
              <div style="background:rgba(0,0,0,0.3); border-left:3px solid var(--police-cyan); padding:0.85rem 1.15rem; border-radius:0 8px 8px 0;">
                <div style="font-family:var(--font-tactical); font-size:0.88rem; font-weight:700; color:#fff; margin-bottom:0.35rem;">
                  <span style="color:var(--police-cyan); margin-right:0.3rem;">${art.num}</span> - ${art.title}
                </div>
                <p style="font-size:0.88rem; color:var(--text-muted); line-height:1.6;">
                  ${art.text}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderManuals(container) {
  const manuals = window.K9Store.getManuals();

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h3 class="font-tactical" style="font-size:1.35rem; color:#fff;">MANUALES Y GUÍAS DE ADIESTRAMIENTO K9</h3>
      <p style="font-size:0.85rem; color:var(--text-muted);">Vocabulario de comandos caninos, táctica de combate y soporte veterinario de emergencia</p>
    </div>

    <div style="display:flex; flex-direction:column; gap:2rem;">
      ${manuals.map(man => `
        <div style="background:var(--bg-surface); border:1px solid var(--border-tactical); border-radius:14px; padding:1.5rem; box-shadow:var(--shadow-elevation);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="font-family:var(--font-tactical); font-size:1.1rem; color:#fff;">
              ${man.title}
            </h4>
            <span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--police-cyan); background:rgba(0,229,255,0.1); border:1px solid var(--border-tactical); padding:0.2rem 0.6rem; border-radius:20px; text-transform:uppercase;">
              ${man.category}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
            ${man.items.map(item => `
              <div style="background:rgba(10,15,29,0.8); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem; transition:border-color 0.2s;" onmouseenter="this.style.borderColor='var(--police-cyan)'" onmouseleave="this.style.borderColor='var(--border-subtle)'">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                  <span style="font-family:var(--font-tactical); font-size:1.1rem; font-weight:700; color:var(--tactical-gold);">${item.command}</span>
                  <span style="font-family:var(--font-headline); font-size:0.78rem; color:var(--text-muted); text-transform:uppercase;">[${item.trans}]</span>
                </div>
                <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.4;">${item.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCanineGallery(container) {
  const dogs = window.K9Store.getDogs();

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h3 class="font-tactical" style="font-size:1.35rem; color:#fff;">CUADRO DE HONOR Y PLANTILLA CANINA K9</h3>
      <p style="font-size:0.85rem; color:var(--text-muted);">Los héroes de cuatro patas en servicio activo para la protección ciudadana</p>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:1.5rem;">
      ${dogs.map(dog => `
        <div style="background:var(--bg-surface); border:1px solid var(--border-tactical); border-radius:14px; overflow:hidden; box-shadow:var(--shadow-elevation); transition:transform 0.2s, box-shadow 0.2s;" onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='var(--shadow-glow-cyan)'" onmouseleave="this.style.transform='none'; this.style.boxShadow='var(--shadow-elevation)'">
          <div style="height:210px; width:100%; position:relative; overflow:hidden;">
            <img src="${dog.photo}" alt="${dog.name}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.5s;" onmouseenter="this.style.transform='scale(1.08)'" onmouseleave="this.style.transform='scale(1)'">
            <span style="position:absolute; top:12px; left:12px; font-family:var(--font-tactical); font-size:0.75rem; background:rgba(0,0,0,0.8); border:1px solid var(--police-cyan); color:var(--police-cyan); padding:0.25rem 0.6rem; border-radius:6px; font-weight:700;">
              ${dog.tag}
            </span>
            <span style="position:absolute; bottom:12px; right:12px;" class="k9-status-pill ${dog.healthStatus === 'Apto Operativo' ? 'status-apto' : dog.healthStatus === 'En Recuperación' ? 'status-baja' : 'status-entrenamiento'}">
              ${dog.healthStatus}
            </span>
          </div>

          <div style="padding:1.25rem;">
            <h4 style="font-family:var(--font-tactical); font-size:1.35rem; color:#fff; margin-bottom:0.25rem;">${dog.name}</h4>
            <div style="font-family:var(--font-headline); font-size:0.85rem; color:var(--tactical-gold); letter-spacing:0.06em; margin-bottom:0.75rem;">${dog.breed}</div>

            <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; padding:0.75rem; margin-bottom:1rem; font-size:0.82rem;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
                <span style="color:var(--text-subtle); font-family:var(--font-headline);">ESPECIALIDAD:</span>
                <span style="color:var(--police-cyan); font-weight:600;">${dog.specialty}</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:var(--text-subtle); font-family:var(--font-headline);">GUÍA ASIGNADO:</span>
                <span style="color:#fff; font-weight:600;">${dog.handlerName || 'Sin asignar'}</span>
              </div>
            </div>

            <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.4;">
              ${dog.trainingNotes}
            </p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ==========================================
// VISTA DE PERFIL DE MIEMBRO
// (Insignias asignadas + Unidad K9 asignada)
// ==========================================
function renderMemberProfile() {
  const container = document.getElementById('view-perfil');
  if (!container) return;

  const user = window.K9Auth.getCurrentUser();

  if (!user) {
    container.innerHTML = `
      <div class="empty-state-box" style="margin:4rem auto; max-width:550px;">
        <div class="empty-icon">🔒</div>
        <h3 class="font-tactical" style="color:#fff; margin-bottom:0.75rem;">AUTENTICACIÓN REQUERIDA</h3>
        <p style="margin-bottom:1.5rem; color:var(--text-muted);">Debes autenticarte con tu cuenta de Discord para acceder a tu expediente policial, insignias y ficha K9.</p>
        <button class="btn-tactical btn-tactical-primary" onclick="window.K9Auth.initiateDiscordOAuth()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle; margin-right:4px;"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          Iniciar Sesión con Discord
        </button>
      </div>
    `;
    return;
  }

  // Buscar perro asignado y sus medallas
  const allDogs = window.K9Store.getDogs();
  const assignedDog = allDogs.find(d => d.id === user.assignedDogId);

  const allBadges = window.K9Store.getBadges();
  const userBadges = (user.badges || []).map(bId => allBadges.find(b => b.id === bId)).filter(Boolean);

  container.innerHTML = `
    <!-- Cabecera de la sección -->
    <div class="section-header-block">
      <div class="section-header-left">
        <span class="section-pre-title">EXPEDIENTE DEL MIEMBRO OPERATIVO</span>
        <h2 class="section-main-title">
          <span>PORTAL DEL AGENTE</span>
          <span style="font-size:0.95rem; color:var(--police-cyan); background:rgba(0,229,255,0.1); border:1px solid var(--border-tactical); padding:0.2rem 0.6rem; border-radius:20px;">[PLACA ${user.placa}]</span>
        </h2>
      </div>
      <div class="section-header-actions">
        <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.print()">
          <span>🖨️</span> Imprimir Credencial
        </button>
      </div>
    </div>

    <!-- Grid Principal del Perfil -->
    <div class="member-profile-grid">
      <!-- Columna Izquierda: Credencial Táctica Oficial -->
      <div class="tactical-id-card">
        <div class="id-card-body">
          <div class="id-card-avatar-wrap">
            <img src="${user.avatar}" alt="${user.name}" class="id-card-avatar-img" onerror="this.src='assets/images/emblem.jpg'">
            <div class="id-card-badge-chip">#${user.placa}</div>
          </div>
          <h3 class="id-card-name">${user.name}</h3>
          <div class="id-card-rank">${user.rank}</div>
          <div class="id-discord-tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028z"/></svg>
            ${user.discordUsername}
          </div>

          <div class="id-specs-list">
            <div class="id-spec-row">
              <span class="id-spec-label">ESTADO DE SERVICIO:</span>
              <span class="id-spec-value" style="color:var(--tactical-green);">${user.serviceStatus}</span>
            </div>
            <div class="id-spec-row">
              <span class="id-spec-label">BINOMIO K9:</span>
              <span class="id-spec-value" style="color:${assignedDog ? 'var(--police-cyan)' : 'var(--text-muted)'};">
                ${assignedDog ? `${assignedDog.name} [${assignedDog.tag}]` : 'Sin asignar'}
              </span>
            </div>
            <div class="id-spec-row">
              <span class="id-spec-label">FECHA DE INGRESO:</span>
              <span class="id-spec-value">${user.joinedDate || '2024'}</span>
            </div>
            <div class="id-spec-row">
              <span class="id-spec-label">HORAS DE PATRULLA:</span>
              <span class="id-spec-value">${user.patrolHoursTotal || 0} hrs</span>
            </div>
            <div class="id-spec-row">
              <span class="id-spec-label">INTERVENCIONES CANINAS:</span>
              <span class="id-spec-value">${user.interventionsTotal || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Can Asignado e Insignias -->
      <div class="member-details-column">
        <!-- Tarjeta de Unidad K9 Asignada -->
        <div class="assigned-k9-card">
          <div class="assigned-k9-header">
            <div class="assigned-k9-badge-title">
              <span style="font-size:1.3rem;">🐕</span>
              <div>
                <h3 class="font-tactical" style="font-size:1.15rem; color:#fff;">UNIDAD K9 ASIGNADA (BINOMIO)</h3>
                <span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--text-muted); letter-spacing:0.06em;">COMPAÑERO CANINO DE SERVICIO</span>
              </div>
            </div>
            ${assignedDog ? `
              <span class="k9-status-pill ${assignedDog.healthStatus === 'Apto Operativo' ? 'status-apto' : 'status-entrenamiento'}">
                ${assignedDog.healthStatus}
              </span>
            ` : ''}
          </div>

          ${assignedDog ? `
            <div class="assigned-k9-details-row">
              <div class="assigned-k9-photo-wrap">
                <img src="${assignedDog.photo}" alt="${assignedDog.name}" class="assigned-k9-photo">
              </div>
              <div class="assigned-k9-specs">
                <div class="k9-dog-name">${assignedDog.name} <small style="font-size:0.9rem; color:var(--police-cyan);">[${assignedDog.tag}]</small></div>
                <div class="k9-dog-breed-specialty">${assignedDog.breed} — ${assignedDog.specialty}</div>
                <div class="k9-sync-bar-wrap">
                  <div class="k9-sync-label-row">
                    <span>NIVEL DE SINCRONIZACIÓN Y ADIESTRAMIENTO TÁCTICO:</span>
                    <span class="k9-sync-val">${assignedDog.syncLevel}%</span>
                  </div>
                  <div class="k9-progress-track">
                    <div class="k9-progress-fill" style="width:${assignedDog.syncLevel}%"></div>
                  </div>
                </div>
                <div class="k9-quick-attributes">
                  <div class="k9-attr-box"><span class="k9-attr-name">EDAD</span><span class="k9-attr-val">${assignedDog.age}</span></div>
                  <div class="k9-attr-box"><span class="k9-attr-name">INDICATIVO RADIAL</span><span class="k9-attr-val">${assignedDog.emergencyCallsign}</span></div>
                  <div class="k9-attr-box"><span class="k9-attr-name">GRUPO SANGUÍNEO</span><span class="k9-attr-val">${assignedDog.bloodType}</span></div>
                </div>
              </div>
            </div>
            <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <span style="font-size:0.8rem; color:var(--text-muted);"><strong style="color:#fff;">Notas de Adiestramiento:</strong> ${assignedDog.trainingNotes}</span>
              <span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--tactical-gold); letter-spacing:0.06em;">CARTILLA SANITARIA Y CHIP VERIFICADOS ✓</span>
            </div>
          ` : (() => {
      // Comprobar si hay solicitud pendiente del usuario actual
      const reqs = window.K9Store.getDogRequests ? window.K9Store.getDogRequests() : [];
      const pendingReq = reqs.find(r => r.agentId === user.id && r.status === 'pendiente');
      const availableDogs = allDogs.filter(d => !d.handlerId);
      if (pendingReq) {
        const reqDog = allDogs.find(d => d.id === pendingReq.dogId);
        return `
                <div class="empty-state-box" style="padding:2rem 1rem; border-color: rgba(255,183,3,0.3);">
                  <div class="empty-icon">⏳</div>
                  <h4 class="font-tactical" style="color:var(--tactical-gold); margin-bottom:0.4rem;">SOLICITUD EN REVISIÓN</h4>
                  <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.8rem;">
                    Tu solicitud de binomio con <strong style="color:#fff;">${reqDog ? reqDog.name + ' [' + reqDog.tag + ']' : 'can seleccionado'}</strong> está siendo revisada por la Jefatura K9.
                  </p>
                  <button class="btn-tactical btn-tactical-outline btn-tactical-sm" style="color:#ff6b6b; border-color:#ff6b6b44;" onclick="cancelDogRequest('${pendingReq.id}')">
                    🗑️ Cancelar solicitud
                  </button>
                </div>
              `;
      }
      if (availableDogs.length === 0) {
        return `
                <div class="empty-state-box" style="padding:2rem 1rem;">
                  <div class="empty-icon">🐾</div>
                  <h4 class="font-tactical" style="color:#fff; margin-bottom:0.4rem;">SIN UNIDAD K9 ASIGNADA</h4>
                  <p style="font-size:0.85rem; color:var(--text-muted);">No hay canes disponibles en este momento. Todos están asignados a binomio activo.</p>
                </div>
              `;
      }
      return `
              <div class="empty-state-box" style="padding:1.5rem 1rem;">
                <div class="empty-icon">🐾</div>
                <h4 class="font-tactical" style="color:#fff; margin-bottom:0.5rem;">SIN UNIDAD K9 ASIGNADA</h4>
                <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">Solicita la asignación de un can disponible. La Jefatura aprobará o denegará la petición.</p>
                <div style="display:flex; flex-wrap:wrap; gap:0.6rem; justify-content:center; margin-bottom:1rem;">
                  ${availableDogs.map(d => `
                    <button class="btn-tactical btn-tactical-outline btn-tactical-sm dog-request-btn"
                      data-dogid="${d.id}"
                      style="display:flex; align-items:center; gap:0.4rem; padding:0.4rem 0.8rem;">
                      🐕 ${d.name} <small style="color:var(--text-muted); font-size:0.72rem;">[${d.tag}] ${d.specialty}</small>
                    </button>
                  `).join('')}
                </div>
                <p style="font-size:0.75rem; color:var(--text-subtle);">Selecciona un can para enviar la solicitud formal de binomio</p>
              </div>
            `;
    })()}
        </div>

        <!-- Vitrina de Insignias y Condecoraciones Otorgadas -->
        <div class="member-badges-container">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <h3 class="font-tactical" style="font-size:1.15rem; color:#fff;">INSIGNIAS Y CONDECORACIONES OTORGADAS</h3>
              <span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--tactical-gold); letter-spacing:0.06em;">DISTINCIONES POR MÉRITO POLICIAL CANINO</span>
            </div>
            <span style="font-family:var(--font-tactical); font-size:0.85rem; color:var(--tactical-gold); background:rgba(255,183,3,0.15); border:1px solid var(--border-gold); padding:0.25rem 0.75rem; border-radius:20px;">
              ${userBadges.length} CONDECORACIONES
            </span>
          </div>

          ${userBadges.length > 0 ? `
            <div class="badges-grid-showcase">
              ${userBadges.map(badge => `
                <div class="tactical-badge-card" onclick="openBadgeInspection('${badge.id}', '${user.name}')">
                  <div class="badge-icon-frame">
                    <img src="${badge.image}" alt="${badge.name}" class="badge-icon-img">
                  </div>
                  <div class="badge-name">${badge.name}</div>
                  <div class="badge-date-awarded">${badge.category}</div>
                  <div class="badge-brief">${badge.desc}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state-box" style="margin-top:1.25rem; padding:2rem 1rem;">
              <div class="empty-icon">🎖️</div>
              <h4 class="font-tactical" style="color:#fff; margin-bottom:0.4rem;">SIN CONDECORACIONES REGISTRADAS</h4>
              <p style="font-size:0.85rem; color:var(--text-muted);">
                Aún no se te han otorgado insignias oficiales. Las condecoraciones son concedidas por la Jefatura K9 tras actuaciones meritorias y cumplimiento de hitos en servicio.
              </p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  // Conectar botones de solicitud de can
  container.querySelectorAll('.dog-request-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dogId = btn.dataset.dogid;
      submitDogRequest(user, dogId);
    });
  });
}

// ==========================================
// VISTA DE JEFATURA (ADMIN COMMAND CENTER)
// (Control de acceso estricto según requerimiento)
// ==========================================
function checkJefaturaAccessAndRender() {
  const container = document.getElementById('view-jefatura');
  if (!container) return;

  const user = window.K9Auth.getCurrentUser();

  // Si no está logueado o NO tiene permisos de jefatura:
  if (!user || !window.K9Auth.isJefaturaMember()) {
    if (window.K9Audio) window.K9Audio.playAlert();
    container.innerHTML = `
      <div class="access-denied-card">
        <div class="denied-icon-wrap">${user ? '⚠️' : '🔒'}</div>
        <h2 class="denied-title font-tactical">ACCESO RESTRINGIDO A JEFATURA</h2>
        <p class="denied-desc">
          ${user
        ? `Nivel de seguridad insuficiente. Tu cuenta actual de Discord <strong>(${user.name} - ${user.discordUsername})</strong> no dispone de permisos de Jefatura K9.`
        : 'Se requiere iniciar sesión con tu cuenta de <strong>Discord</strong> y contar con acreditación de mando o permisos de Jefatura K9 para acceder a este panel de administración.'}
        </p>
        <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
          ${!user ? `
            <button class="btn-tactical btn-tactical-primary" onclick="window.K9Auth.initiateDiscordOAuth()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle; margin-right:4px;"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              ✦ Iniciar Sesión con Discord
            </button>
          ` : `
            <button class="btn-tactical btn-tactical-outline" onclick="switchMainView('perfil')">
              ← Volver a Mi Perfil
            </button>
          `}
          <button class="btn-tactical btn-tactical-outline" onclick="switchGeneralSubtab('normativas')">
            ← Ver Normativas Oficiales
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Tiene acceso concedido a Jefatura
  container.innerHTML = `
    <!-- Barra de Autorización Oficial -->
    <div class="jefatura-security-clearance-bar">
      <div style="display:flex; align-items:center; gap:0.6rem;">
        <span style="font-size:1.1rem;">★</span>
        <span>CENTRO DE MANDO Y JEFATURA K9 — SESIÓN AUTORIZADA: <strong>${user.name}</strong> (${user.rank})</span>
      </div>
      <span style="font-family:var(--font-headline); letter-spacing:0.1em; color:var(--tactical-gold);">NIVEL DE SEGURIDAD MÁXIMO</span>
    </div>

    <!-- Cabecera de Jefatura -->
    <div class="section-header-block">
      <div class="section-header-left">
        <span class="section-pre-title">ADMINISTRACIÓN & SUPERVISIÓN OPERATIVA</span>
        <h2 class="section-main-title">
          <span>CENTRO DE MANDO K9</span>
          <span class="jefatura-lock-badge">JEFATURA</span>
        </h2>
      </div>
      <div class="section-header-actions">
        <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="exportDataDossier()">
          <span>📄</span> Exportar Registro Completo (JSON)
        </button>
        <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.print()">
          <span>🖨️</span> Imprimir Informe de Mando
        </button>
      </div>
    </div>

    <!-- Sub-Navegación de Jefatura -->
    <div class="subnav-tabs-row">
      <button class="subnav-pill-btn jefatura-subnav ${currentJefaturaSubtab === 'informes' ? 'active' : ''}" data-subtab="informes">
        📑 Informes Semanales
      </button>
      <button class="subnav-pill-btn jefatura-subnav ${currentJefaturaSubtab === 'agentes' ? 'active' : ''}" data-subtab="agentes">
        👮 Apartado de Agentes
      </button>
      <button class="subnav-pill-btn jefatura-subnav ${currentJefaturaSubtab === 'canes' ? 'active' : ''}" data-subtab="canes">
        🐕 Apartado de K9 (Canes)
      </button>
      <button class="subnav-pill-btn jefatura-subnav ${currentJefaturaSubtab === 'disciplinario' ? 'active' : ''}" data-subtab="disciplinario">
        ⚠️ Faltas & Sanciones
      </button>
      <button class="subnav-pill-btn jefatura-subnav ${currentJefaturaSubtab === 'insignias' ? 'active' : ''}" data-subtab="insignias">
        🎖️ Gestor de Insignias
      </button>
      <button class="subnav-pill-btn jefatura-subnav ${currentJefaturaSubtab === 'permisos' ? 'active' : ''}" data-subtab="permisos">
        🔐 Control de Permisos
      </button>
    </div>

    <!-- Contenedor dinámico del subtab -->
    <div id="jefaturaSubtabContent"></div>
  `;

  // Re-enlazar eventos a los botones de subtab recién generados
  container.querySelectorAll('.subnav-pill-btn.jefatura-subnav').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.subnav-pill-btn.jefatura-subnav').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentJefaturaSubtab = btn.dataset.subtab;
      if (window.K9Audio) window.K9Audio.playTacticalClick();
      renderJefaturaSubtab(currentJefaturaSubtab);
    });
  });

  renderJefaturaSubtab(currentJefaturaSubtab);
}

// -------------------------------------------------------------
// SUBTAB 1: INFORMES SEMANALES DE AGENTES
// -------------------------------------------------------------
function renderReportsSection(container) {
  const reports = window.K9Store.getReports();

  container.innerHTML = `
    <div class="tactical-table-wrapper">
      <div class="table-toolbar-row">
        <div class="table-search-box">
          <span>🔍</span>
          <input type="text" id="searchReportsInput" placeholder="Buscar informe por agente, período o estado...">
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn-tactical btn-tactical-gold btn-tactical-sm" id="btnCreateReport">
            <span>+</span> Redactar Informe Semanal
          </button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="tactical-table-element">
          <thead>
            <tr>
              <th>Período / Semana</th>
              <th>Agente Operativo</th>
              <th>Can K9</th>
              <th>Horas Patrulla</th>
              <th>Intervenciones / Incautaciones</th>
              <th>Calificación</th>
              <th>Estado Jefatura</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="reportsTableBody">
            ${renderReportsTableRows(reports)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnCreateReport').addEventListener('click', () => {
    openModal('modalNewReport');
  });

  document.getElementById('searchReportsInput').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = reports.filter(r =>
      r.agentName.toLowerCase().includes(q) ||
      r.week.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
    document.getElementById('reportsTableBody').innerHTML = renderReportsTableRows(filtered);
  });
}

function renderReportsTableRows(reports) {
  if (!reports || reports.length === 0) {
    return `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">No hay informes semanales registrados.</td></tr>`;
  }
  return reports.map(r => `
    <tr>
      <td>
        <strong style="color:#fff;">${r.week}</strong>
        <div style="font-size:0.75rem; color:var(--text-muted);">${r.date}</div>
      </td>
      <td>
        <span style="font-family:var(--font-tactical); font-weight:600; color:var(--police-cyan);">${r.agentName}</span>
      </td>
      <td>${r.dogName}</td>
      <td><span style="font-family:var(--font-tactical); font-weight:700;">${r.patrolHours} hrs</span></td>
      <td>
        <div><strong>${r.canineInterventions}</strong> intervenciones (${r.canineAlerts} alertas)</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${r.seizures}</div>
      </td>
      <td>
        <span style="font-family:var(--font-tactical); color:var(--tactical-gold);">${r.rating}</span>
      </td>
      <td>
        <span style="font-family:var(--font-tactical); font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:20px; ${r.status.includes('Aprobado') ? 'background:rgba(0,230,118,0.15); color:var(--tactical-green); border:1px solid rgba(0,230,118,0.3);' : 'background:rgba(255,183,3,0.15); color:var(--tactical-gold); border:1px solid rgba(255,183,3,0.3);'}">
          ${r.status}
        </span>
      </td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="approveReport('${r.id}')" title="Aprobar Informe">
            ✓ Aprobar
          </button>
          <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="viewReportDetails('${r.id}')" title="Ver detalles">
            👁️
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.approveReport = function (reportId) {
  const reports = window.K9Store.getReports();
  const rep = reports.find(r => r.id === reportId);
  if (rep) {
    const user = window.K9Auth.getCurrentUser();
    rep.status = 'Aprobado por Jefatura';
    rep.signedBy = `${user.name} (${user.placa})`;
    window.K9Store.save(STORAGE_KEYS.REPORTS, reports);
    if (window.K9Audio) window.K9Audio.playTacticalBeep(1200, 0.1);
    showToast(`Informe de ${rep.agentName} aprobado oficialmente`, 'success');
    renderJefaturaSubtab('informes');
  }
};

window.viewReportDetails = function (reportId) {
  const reports = window.K9Store.getReports();
  const rep = reports.find(r => r.id === reportId);
  if (rep) {
    alert(`INFORME SEMANAL DETALLADO\n\nPeríodo: ${rep.week}\nAgente: ${rep.agentName}\nCan: ${rep.dogName}\nHoras: ${rep.patrolHours} hrs\nIntervenciones: ${rep.canineInterventions}\nIncautaciones: ${rep.seizures}\n\nObservaciones:\n${rep.notes}\n\nFirma Jefatura: ${rep.signedBy}`);
  }
};

// ─────────────────────────────────────────────────────────────────
// SISTEMA DE SOLICITUD DE CAN K9
// ─────────────────────────────────────────────────────────────────
function submitDogRequest(user, dogId) {
  const dogs = window.K9Store.getDogs();
  const dog = dogs.find(d => d.id === dogId);
  if (!dog) return;
  const reqs = window.K9Store.getDogRequests();
  // Verificar que no tenga ya una solicitud pendiente
  const existing = reqs.find(r => r.agentId === user.id && r.status === 'pendiente');
  if (existing) {
    showToast('Ya tienes una solicitud de binomio pendiente.', 'warning');
    return;
  }
  const newReq = {
    id: 'req_' + Date.now(),
    agentId: user.id,
    agentName: user.name + ' [' + user.placa + ']',
    dogId: dog.id,
    dogName: dog.name + ' [' + dog.tag + ']',
    specialty: dog.specialty,
    status: 'pendiente',
    date: new Date().toLocaleDateString('es-ES'),
    ts: Date.now()
  };
  reqs.push(newReq);
  window.K9Store.save(STORAGE_KEYS.DOG_REQUESTS, reqs);
  if (window.K9Webhook) window.K9Webhook.onDogRequest(user, dog);
  showToast('✅ Solicitud enviada a Jefatura. Espera la aprobación.', 'success');
  if (window.K9Audio) window.K9Audio.playTacticalBeep(880, 0.1);
  renderMemberProfile();
}

window.cancelDogRequest = function (reqId) {
  const reqs = window.K9Store.getDogRequests();
  const updated = reqs.map(r => r.id === reqId ? { ...r, status: 'cancelada' } : r);
  window.K9Store.save(STORAGE_KEYS.DOG_REQUESTS, updated);
  showToast('Solicitud cancelada.', 'info');
  renderMemberProfile();
};

window.approveDogRequest = function (reqId) {
  const reqs = window.K9Store.getDogRequests();
  const req = reqs.find(r => r.id === reqId);
  if (!req) return;
  const users = window.K9Store.getUsers();
  const dogs = window.K9Store.getDogs();
  const agent = users.find(u => u.id === req.agentId);
  const dog = dogs.find(d => d.id === req.dogId);
  if (!agent || !dog) { showToast('Agente o can no encontrado.', 'warning'); return; }
  if (dog.handlerId && dog.handlerId !== req.agentId) {
    showToast('Este can ya fue asignado a otro agente.', 'warning');
    return;
  }
  agent.assignedDogId = dog.id;
  dog.handlerId = agent.id;
  dog.handlerName = agent.name;
  window.K9Store.save(STORAGE_KEYS.USERS, users);
  window.K9Store.save(STORAGE_KEYS.DOGS, dogs);
  const updated = reqs.map(r => r.id === reqId ? { ...r, status: 'aprobada' } : r);
  window.K9Store.save(STORAGE_KEYS.DOG_REQUESTS, updated);
  if (window.K9Audio) window.K9Audio.playTacticalBeep(1200, 0.15);
  if (window.K9Webhook) {
    const admin = window.K9Auth.getCurrentUser();
    if (admin) window.K9Webhook.onDogAssignment(admin, dog, agent.name, false);
  }
  showToast('🐕 Binomio ' + agent.name + ' + ' + dog.name + ' aprobado y activo.', 'success');
  renderJefaturaSubtab('agentes');
};

window.denyDogRequest = function (reqId) {
  const reqs = window.K9Store.getDogRequests();
  const req = reqs.find(r => r.id === reqId);
  const updated = reqs.map(r => r.id === reqId ? { ...r, status: 'denegada' } : r);
  window.K9Store.save(STORAGE_KEYS.DOG_REQUESTS, updated);
  if (window.K9Webhook && req) {
    const admin = window.K9Auth.getCurrentUser();
    window.K9Webhook.log('dog', 'Solicitud de Binomio Denegada',
      'Jefatura ha denegado la solicitud de can para **' + req.agentName + '** (' + req.dogName + ').', [
      { name: 'Mando', value: admin ? admin.name : 'Jefatura', inline: true },
      { name: 'Agente', value: req.agentName, inline: true },
      { name: 'Can', value: req.dogName, inline: true }
    ]);
  }
  if (window.K9Audio) window.K9Audio.playAlert();
  showToast('Solicitud de binomio denegada.', 'warning');
  renderJefaturaSubtab('agentes');
};

// ─────────────────────────────────────────────────────────────────
// SUBTAB 2: APARTADO DE AGENTES
// ─────────────────────────────────────────────────────────────────
function renderAgentsSection(container) {
  const users = window.K9Store.getUsers();
  const dogs = window.K9Store.getDogs();
  const pendingReqs = (window.K9Store.getDogRequests ? window.K9Store.getDogRequests() : []).filter(r => r.status === 'pendiente');
  const presets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];

  container.innerHTML = `
    <!-- 1. SOLICITUDES DE CAN PENDIENTES DE APROBACIÓN -->
    <div style="margin-bottom:1.5rem; background:rgba(18,24,38,0.9); border:1px solid ${pendingReqs.length > 0 ? 'var(--tactical-gold)' : 'var(--border-subtle)'}; border-radius:8px; padding:1.25rem; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="font-size:1.3rem;">${pendingReqs.length > 0 ? '🔔' : '🐾'}</span>
          <div>
            <h3 class="font-tactical" style="font-size:1.05rem; margin:0; color:${pendingReqs.length > 0 ? 'var(--tactical-gold)' : '#fff'};">
              SOLICITUDES FORMALES DE ASIGNACIÓN DE CAN K9
            </h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">
              Aprobación o denegación de binomios caninos solicitados desde Mi Perfil K9
            </span>
          </div>
        </div>
        <span style="font-family:var(--font-tactical); font-size:0.8rem; padding:0.2rem 0.6rem; border-radius:12px; background:${pendingReqs.length > 0 ? 'rgba(255,183,3,0.2)' : 'rgba(255,255,255,0.05)'}; color:${pendingReqs.length > 0 ? 'var(--tactical-gold)' : 'var(--text-muted)'}; border:1px solid ${pendingReqs.length > 0 ? 'var(--tactical-gold)' : 'transparent'};">
          ${pendingReqs.length} PENDIENTES
        </span>
      </div>

      ${pendingReqs.length === 0 ? `
        <div style="padding:0.75rem 1rem; background:rgba(0,0,0,0.2); border-radius:6px; font-size:0.85rem; color:var(--text-muted); text-align:center;">
          ✓ No hay solicitudes de binomio pendientes de revisión en este momento.
        </div>
      ` : `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:0.75rem;">
          ${pendingReqs.map(req => {
    const dog = dogs.find(d => d.id === req.dogId);
    return `
              <div style="background:rgba(255,183,3,0.05); border:1px solid rgba(255,183,3,0.3); border-radius:6px; padding:0.85rem; display:flex; flex-direction:column; justify-content:space-between; gap:0.75rem;">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.4rem;">
                    <strong style="color:#fff; font-family:var(--font-tactical); font-size:0.95rem;">👮 ${req.agentName}</strong>
                    <span style="font-size:0.7rem; color:var(--text-subtle);">${req.date}</span>
                  </div>
                  <div style="font-size:0.85rem; color:var(--police-cyan); margin-bottom:0.25rem;">
                    🐕 Can solicitado: <strong>${req.dogName}</strong>
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">
                    Especialidad: ${req.specialty || (dog ? dog.specialty : 'Seguridad')}
                  </div>
                </div>
                <div style="display:flex; gap:0.5rem;">
                  <button class="btn-tactical btn-tactical-primary btn-tactical-sm" style="flex:1; justify-content:center; background:#00e676; border-color:#00e676; color:#0b0f19; font-weight:700;" onclick="window.approveDogRequest('${req.id}')">
                    ✓ Aprobar Binomio
                  </button>
                  <button class="btn-tactical btn-tactical-outline btn-tactical-sm" style="flex:1; justify-content:center; color:#ff5252; border-color:rgba(255,82,82,0.4);" onclick="window.denyDogRequest('${req.id}')">
                    ✕ Denegar
                  </button>
                </div>
              </div>
            `;
  }).join('')}
        </div>
      `}
    </div>

    <!-- 2. PANEL DE PRE-REGISTRO Y ASIGNACIÓN DE RANGOS POR DISCORD ID -->
    <div style="margin-bottom:1.5rem; background:rgba(18,24,38,0.9); border:1px solid var(--border-subtle); border-radius:8px; padding:1.25rem; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
      <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.5rem;">
        <span style="font-size:1.3rem;">🛡️</span>
        <div>
          <h3 class="font-tactical" style="font-size:1.05rem; margin:0; color:#fff;">
            ASIGNACIÓN DE RANGO POR DISCORD ID
          </h3>
          <span style="font-size:0.75rem; color:var(--text-muted);">
            Configura el rango oficial de un agente mediante su ID de Discord para que al iniciar sesión tenga asignado dicho rango automáticamente
          </span>
        </div>
      </div>

      <form id="formAgentPreset" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem; align-items:end; background:rgba(0,0,0,0.25); padding:1rem; border-radius:6px; border:1px solid rgba(255,255,255,0.05); margin-top:0.75rem;">
        <div>
          <label style="display:block; font-family:var(--font-headline); font-size:0.7rem; color:var(--police-cyan); letter-spacing:0.05em; margin-bottom:0.3rem;">DISCORD ID / USERNAME *</label>
          <input type="text" id="presetDiscordId" required placeholder="Ej: 1406448851153326131 o usuario" style="width:100%; padding:0.5rem 0.75rem; background:rgba(10,14,23,0.8); border:1px solid var(--border-tactical); border-radius:4px; color:#fff; font-family:var(--font-mono); font-size:0.85rem;">
        </div>

        <div>
          <label style="display:block; font-family:var(--font-headline); font-size:0.7rem; color:var(--police-cyan); letter-spacing:0.05em; margin-bottom:0.3rem;">PLACA OFICIAL *</label>
          <input type="text" id="presetPlaca" required placeholder="Ej: K-14" style="width:100%; padding:0.5rem 0.75rem; background:rgba(10,14,23,0.8); border:1px solid var(--border-tactical); border-radius:4px; color:#fff; font-family:var(--font-headline); font-size:0.85rem;">
        </div>

        <div>
          <label style="display:block; font-family:var(--font-headline); font-size:0.7rem; color:var(--police-cyan); letter-spacing:0.05em; margin-bottom:0.3rem;">RANGO OFICIAL ASIGNADO *</label>
          <select id="presetRank" required style="width:100%; padding:0.5rem 0.75rem; background:rgba(10,14,23,0.8); border:1px solid var(--border-tactical); border-radius:4px; color:#fff; font-family:var(--font-headline); font-size:0.85rem;">
            <option value="Aspirante K9">Aspirante K9</option>
            <option value="Oficial Guía K9" selected>Oficial Guía K9</option>
            <option value="Oficial Mayor K9">Oficial Mayor K9</option>
            <option value="Instructor Guía K9">Instructor Guía K9</option>
            <option value="Subinspector K9">Subinspector K9</option>
            <option value="Inspector K9">Inspector K9</option>
            <option value="Jefe de División K9">Jefe de División K9</option>
          </select>
        </div>

        <div>
          <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:#fff; cursor:pointer; height:38px;">
            <input type="checkbox" id="presetIsJefatura" style="accent-color:var(--tactical-gold); width:16px; height:16px;">
            <span>¿Permisos de Jefatura?</span>
          </label>
        </div>

        <div>
          <button type="submit" class="btn-tactical btn-tactical-gold" style="width:100%; justify-content:center; height:38px;">
            💾 Guardar / Asignar Rango
          </button>
        </div>
      </form>

      ${presets.length > 0 ? `
        <div style="margin-top:1rem;">
          <div style="font-family:var(--font-headline); font-size:0.75rem; color:var(--tactical-gold); letter-spacing:0.06em; margin-bottom:0.5rem;">
            PRE-CONFIGURACIONES ACTIVAS EN ESPERA DE LOGIN (${presets.length}):
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
            ${presets.map((p, idx) => `
              <div style="display:inline-flex; align-items:center; gap:0.6rem; background:rgba(0,229,255,0.08); border:1px solid rgba(0,229,255,0.25); border-radius:4px; padding:0.35rem 0.75rem; font-size:0.8rem;">
                <span style="color:#a5b4fc; font-family:var(--font-mono);">${p.discordId}</span>
                <span style="color:#fff; font-weight:600;">[${p.placa}]</span>
                <span style="color:var(--police-cyan);">${p.rank}</span>
                ${p.isJefatura ? '<span style="color:var(--tactical-gold); font-size:0.7rem;">★ MANDO</span>' : ''}
                <button onclick="window.removeAgentPreset(${idx})" style="background:none; border:none; color:#ff5252; cursor:pointer; font-size:0.9rem; padding:0 0.2rem;" title="Eliminar pre-configuración">✕</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 3. TABLA GENERAL DE AGENTES REGISTRADOS -->
    <div class="tactical-table-wrapper">
      <div class="table-toolbar-row">
        <div class="table-search-box">
          <span>🔍</span>
          <input type="text" id="searchAgentsInput" placeholder="Buscar agente por nombre, placa o rango...">
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn-tactical btn-tactical-primary btn-tactical-sm" id="btnNewAgent">
            <span>+</span> Dar de Alta Agente
          </button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="tactical-table-element">
          <thead>
            <tr>
              <th>Placa & Agente</th>
              <th>Rango Oficial</th>
              <th>Discord ID</th>
              <th>Can K9 Asignado</th>
              <th>Insignias</th>
              <th>Estado de Servicio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="agentsTableBody">
            ${renderAgentsTableRows(users, dogs)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Listener para el formulario de pre-registro por Discord ID
  const formPreset = document.getElementById('formAgentPreset');
  if (formPreset) {
    formPreset.addEventListener('submit', (e) => {
      e.preventDefault();
      const discordIdVal = document.getElementById('presetDiscordId').value.trim();
      const placaVal = document.getElementById('presetPlaca').value.trim();
      const rankVal = document.getElementById('presetRank').value;
      const isJefaturaVal = document.getElementById('presetIsJefatura').checked;

      if (!discordIdVal || !placaVal) {
        showToast('Completa el Discord ID y la placa.', 'warning');
        return;
      }

      // 1. Guardar preset
      const currentPresets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];
      const updatedPresets = currentPresets.filter(p => p.discordId !== discordIdVal);
      updatedPresets.push({
        discordId: discordIdVal,
        discordUsername: discordIdVal,
        placa: placaVal,
        rank: rankVal,
        isJefatura: isJefaturaVal,
        permissions: isJefaturaVal ? ['*'] : [],
        serviceStatus: isJefaturaVal ? 'En Activo / Mando' : 'En Activo',
        createdAt: new Date().toLocaleDateString('es-ES')
      });
      window.K9Store.save(STORAGE_KEYS.AGENT_PRESETS, updatedPresets);

      // 2. Si el agente ya había iniciado sesión antes, actualizar directamente su perfil actual
      const currentUsers = window.K9Store.getUsers();
      const existingUser = currentUsers.find(u =>
        (u.discordId && u.discordId === discordIdVal) ||
        (u.discordUsername && u.discordUsername.toLowerCase() === discordIdVal.toLowerCase())
      );
      if (existingUser) {
        existingUser.rank = rankVal;
        existingUser.placa = placaVal;
        existingUser.isJefatura = isJefaturaVal;
        if (isJefaturaVal) {
          existingUser.permissions = ['*'];
          existingUser.serviceStatus = 'En Activo / Mando';
        }
        window.K9Store.save(STORAGE_KEYS.USERS, currentUsers);
      }

      // Log al webhook si está configurado
      if (window.K9Webhook) {
        const admin = window.K9Auth.getCurrentUser();
        if (admin) {
          window.K9Webhook.sendLog({
            title: '🎖️ Rango de Agente Asignado por Jefatura',
            color: 0x00e5ff,
            fields: [
              { name: 'Mando', value: admin.name + ' (' + admin.placa + ')', inline: true },
              { name: 'Discord ID Agente', value: discordIdVal, inline: true },
              { name: 'Rango Oficial', value: rankVal + ' [' + placaVal + ']', inline: true },
              { name: '¿Jefatura?', value: isJefaturaVal ? 'Sí (Acceso Total)' : 'No', inline: true }
            ]
          });
        }
      }

      if (window.K9Audio) window.K9Audio.playTacticalBeep(1000, 0.12);
      showToast('✅ Rango guardado para Discord ID: ' + discordIdVal + (existingUser ? ' (Perfil de usuario actualizado)' : ' (Se aplicará en su próximo login)'), 'success');
      renderJefaturaSubtab('agentes');
    });
  }

  // Listener para alta manual tradicional
  const btnNewAgent = document.getElementById('btnNewAgent');
  if (btnNewAgent) {
    btnNewAgent.addEventListener('click', () => {
      openModal('modalNewAgent');
    });
  }

  // Buscador de agentes
  const searchInput = document.getElementById('searchAgentsInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.placa.toLowerCase().includes(q) ||
        u.rank.toLowerCase().includes(q)
      );
      document.getElementById('agentsTableBody').innerHTML = renderAgentsTableRows(filtered, dogs);
    });
  }
}

window.removeAgentPreset = function (index) {
  const presets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];
  if (index >= 0 && index < presets.length) {
    presets.splice(index, 1);
    window.K9Store.save(STORAGE_KEYS.AGENT_PRESETS, presets);
    showToast('Pre-configuración eliminada.', 'info');
    renderJefaturaSubtab('agentes');
  }
};

function renderAgentsTableRows(users, dogs) {
  if (!users || users.length === 0) return '';
  return users.map(u => {
    const dog = dogs.find(d => d.id === u.assignedDogId);
    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <img src="${u.avatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid var(--border-tactical);" alt="${u.name}" onerror="this.src='assets/images/emblem.jpg'">
            <div>
              <strong style="color:#fff; font-family:var(--font-tactical);">${u.name}</strong>
              <div style="font-family:var(--font-headline); font-size:0.75rem; color:var(--police-cyan);">PLACA #${u.placa}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-family:var(--font-headline); letter-spacing:0.05em; color:${u.isJefatura ? 'var(--tactical-gold)' : 'var(--text-main)'}; font-size:0.85rem;">
            ${u.rank}
          </span>
        </td>
        <td>
          <span style="font-size:0.8rem; color:#a5b4fc; background:rgba(88,101,242,0.15); padding:0.2rem 0.5rem; border-radius:4px;">
            ${u.discordUsername}
          </span>
        </td>
        <td>
          ${dog ? `
            <span style="color:var(--police-cyan); font-weight:600;">🐕 ${dog.name}</span>
            <small style="color:var(--text-muted); font-size:0.72rem;">[${dog.tag}]</small>
          ` : `<span style="color:var(--text-subtle);">Sin asignar</span>`}
        </td>
        <td>
          <span style="font-family:var(--font-tactical); color:var(--tactical-gold);">${(u.badges || []).length} 🎖️</span>
        </td>
        <td>
          <span style="font-family:var(--font-tactical); font-size:0.75rem; color:var(--tactical-green); background:rgba(0,230,118,0.1); border:1px solid rgba(0,230,118,0.3); padding:0.2rem 0.5rem; border-radius:15px;">
            ${u.serviceStatus}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="editAgentDogAssignment('${u.id}')" title="Asignar o cambiar can">
              🐕 Asignar Can
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.editAgentDogAssignment = function (userId) {
  const users = window.K9Store.getUsers();
  const user = users.find(u => u.id === userId);
  const dogs = window.K9Store.getDogs();

  if (!user) return;

  const dogOptions = dogs.map(d => `${d.name} (${d.tag})`).join(', ');
  const selectedName = prompt(`Asignar perro K9 para ${user.name}.\n\nCanes disponibles en la unidad:\n${dogOptions}\n\nEscribe el nombre del can (o 'ninguno' para desasignar):`, user.assignedDogId ? dogs.find(d => d.id === user.assignedDogId)?.name : '');

  if (selectedName === null) return;

  if (selectedName.toLowerCase().trim() === 'ninguno' || selectedName.trim() === '') {
    user.assignedDogId = null;
  } else {
    const matchedDog = dogs.find(d => d.name.toLowerCase() === selectedName.toLowerCase().trim());
    if (matchedDog) {
      user.assignedDogId = matchedDog.id;
      matchedDog.handlerId = user.id;
      matchedDog.handlerName = user.name;
      window.K9Store.save(STORAGE_KEYS.DOGS, dogs);
    } else {
      alert('Can no encontrado. Asegúrate de escribir el nombre exacto.');
      return;
    }
  }

  window.K9Store.save(STORAGE_KEYS.USERS, users);
  showToast(`Asignación de binomio actualizada para ${user.name}`, 'success');
  renderJefaturaSubtab('agentes');
};

// -------------------------------------------------------------
// SUBTAB 3: APARTADO DE K9 (CANES)
// -------------------------------------------------------------
function renderDogsSection(container) {
  const dogs = window.K9Store.getDogs();

  container.innerHTML = `
    <div class="tactical-table-wrapper">
      <div class="table-toolbar-row">
        <div class="table-search-box">
          <span>🔍</span>
          <input type="text" id="searchDogsInput" placeholder="Buscar can por nombre, placa o especialidad...">
        </div>
        <div style="display:flex; gap:0.75rem;">
          <button class="btn-tactical btn-tactical-gold btn-tactical-sm" id="btnNewDog">
            <span>+</span> Registrar Nuevo Can K9
          </button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="tactical-table-element">
          <thead>
            <tr>
              <th>Can & Placa</th>
              <th>Raza</th>
              <th>Especialidad</th>
              <th>Guía Asignado</th>
              <th>Nivel Adiestramiento</th>
              <th>Estado de Salud</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="dogsTableBody">
            ${renderDogsTableRows(dogs)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnNewDog').addEventListener('click', () => {
    openModal('modalNewDog');
  });

  document.getElementById('searchDogsInput').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = dogs.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.tag.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q)
    );
    document.getElementById('dogsTableBody').innerHTML = renderDogsTableRows(filtered);
  });
}

function renderDogsTableRows(dogs) {
  if (!dogs || dogs.length === 0) return '';
  return dogs.map(d => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <img src="${d.photo}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid var(--border-tactical);" alt="${d.name}">
          <div>
            <strong style="color:#fff; font-family:var(--font-tactical); font-size:1rem;">${d.name}</strong>
            <div style="font-family:var(--font-headline); font-size:0.75rem; color:var(--police-cyan);">${d.tag}</div>
          </div>
        </div>
      </td>
      <td>${d.breed}</td>
      <td><span style="color:var(--police-cyan); font-weight:600;">${d.specialty}</span></td>
      <td>${d.handlerName || '<span style="color:var(--text-subtle);">Sin asignar</span>'}</td>
      <td>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <div class="k9-progress-track" style="width:70px; height:6px;">
            <div class="k9-progress-fill" style="width:${d.syncLevel}%"></div>
          </div>
          <span style="font-family:var(--font-tactical); font-size:0.75rem; font-weight:700;">${d.syncLevel}%</span>
        </div>
      </td>
      <td>
        <span class="k9-status-pill ${d.healthStatus === 'Apto Operativo' ? 'status-apto' : d.healthStatus === 'En Recuperación' ? 'status-baja' : 'status-entrenamiento'}">
          ${d.healthStatus}
        </span>
      </td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="editDogTraining('${d.id}')">
            ⚡ Adiestramiento
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.editDogTraining = function (dogId) {
  const dogs = window.K9Store.getDogs();
  const dog = dogs.find(d => d.id === dogId);
  if (!dog) return;

  const newLevel = prompt(`Actualizar porcentaje de adiestramiento de ${dog.name} (0 - 100):`, dog.syncLevel);
  if (newLevel !== null) {
    const parsed = parseInt(newLevel, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      dog.syncLevel = parsed;
      window.K9Store.save(STORAGE_KEYS.DOGS, dogs);
      showToast(`Adiestramiento de ${dog.name} actualizado a ${parsed}%`, 'success');
      renderJefaturaSubtab('canes');
    } else {
      alert('Por favor introduce un número válido entre 0 y 100.');
    }
  }
};

// -------------------------------------------------------------
// SUBTAB 4: FALTAS & RÉGIMEN DISCIPLINARIO
// -------------------------------------------------------------
function renderDisciplinarySection(container) {
  const records = window.K9Store.getDisciplinary();

  container.innerHTML = `
    <div class="tactical-table-wrapper">
      <div class="table-toolbar-row">
        <div>
          <h4 class="font-tactical" style="color:#fff; font-size:1.05rem;">EXPEDIENTES DISCIPLINARIOS K9</h4>
          <span style="font-size:0.75rem; color:var(--text-muted);">Registro de infracciones, negligencias y sanciones impuestas</span>
        </div>
        <div>
          <button class="btn-tactical btn-tactical-danger btn-tactical-sm" id="btnNewDisciplinary">
            <span>+</span> Abrir Expediente de Falta
          </button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="tactical-table-element">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Agente Sancionado</th>
              <th>Gravedad</th>
              <th>Motivo de la Falta</th>
              <th>Sanción Aplicada</th>
              <th>Oficial Sancionador</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(rec => `
              <tr>
                <td style="font-family:var(--font-tactical); font-size:0.8rem;">${rec.date}</td>
                <td><strong style="color:#fff;">${rec.agentName}</strong></td>
                <td>
                  <span style="font-family:var(--font-tactical); font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:4px; font-weight:700; background:${rec.type === 'Muy Grave' ? 'rgba(255,42,95,0.25)' : rec.type === 'Grave' ? 'rgba(251,133,0,0.2)' : 'rgba(255,183,3,0.15)'}; color:${rec.type === 'Muy Grave' ? 'var(--tactical-red)' : rec.type === 'Grave' ? 'var(--tactical-amber)' : 'var(--tactical-gold)'}; border:1px solid currentColor;">
                    ${rec.type}
                  </span>
                </td>
                <td style="max-width:280px; font-size:0.82rem; color:var(--text-main);">${rec.reason}</td>
                <td style="font-size:0.82rem; color:var(--text-muted);">${rec.sanction}</td>
                <td style="font-size:0.82rem; color:var(--text-subtle);">${rec.issuedBy}</td>
                <td>
                  <span style="font-family:var(--font-tactical); font-size:0.75rem; color:${rec.status === 'Cumplida' ? 'var(--tactical-green)' : 'var(--tactical-red)'};">
                    ${rec.status}
                  </span>
                </td>
                <td>
                  ${rec.status !== 'Cumplida' ? `
                    <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="markSanctionFulfilled('${rec.id}')">
                      Dar Cumplida
                    </button>
                  ` : '<span style="color:var(--text-subtle); font-size:0.75rem;">Archivado</span>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnNewDisciplinary').addEventListener('click', () => {
    openModal('modalNewDisciplinary');
  });
}

window.markSanctionFulfilled = function (id) {
  const records = window.K9Store.getDisciplinary();
  const rec = records.find(r => r.id === id);
  if (rec) {
    rec.status = 'Cumplida';
    window.K9Store.save(STORAGE_KEYS.DISCIPLINARY, records);
    showToast('Falta marcada como cumplida y archivada en expediente', 'info');
    renderJefaturaSubtab('disciplinario');
  }
};

// -------------------------------------------------------------
// SUBTAB 5: GESTOR DE INSIGNIAS Y CONDECORACIONES
// -------------------------------------------------------------
function renderBadgesSection(container) {
  const badges = window.K9Store.getBadges();
  const users = window.K9Store.getUsers();

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h4 class="font-tactical" style="font-size:1.15rem; color:#fff;">CATÁLOGO DE CONDECORACIONES K9</h4>
        <p style="font-size:0.85rem; color:var(--text-muted);">Otorga medallas e insignias oficiales al valor y especialidad a los miembros de la división</p>
      </div>
      <div>
        <button class="btn-tactical btn-tactical-gold btn-tactical-sm" id="btnAwardBadge">
          <span>🎖️</span> Otorgar Condecoración a Miembro
        </button>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1.25rem;">
      ${badges.map(b => {
    // Contar cuántos miembros la tienen
    const awardedCount = users.filter(u => u.badges && u.badges.includes(b.id)).length;
    return `
          <div style="background:var(--bg-surface); border:1px solid var(--border-tactical); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; box-shadow:var(--shadow-elevation);">
            <div>
              <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                <div style="width:52px; height:52px; border-radius:8px; overflow:hidden; border:1px solid var(--border-gold); background:#000;">
                  <img src="${b.image}" alt="${b.name}" style="width:100%; height:100%; object-fit:contain;">
                </div>
                <div>
                  <h5 style="font-family:var(--font-tactical); font-size:0.95rem; color:#fff; line-height:1.2;">${b.name}</h5>
                  <span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--tactical-gold);">${b.category}</span>
                </div>
              </div>
              <p style="font-size:0.82rem; color:var(--text-muted); line-height:1.4; margin-bottom:1rem;">
                ${b.desc}
              </p>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:0.75rem; font-size:0.78rem;">
              <span style="color:var(--text-subtle);">Otorgada a: <strong style="color:var(--police-cyan);">${awardedCount} miembros</strong></span>
              <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="openAwardBadgePrefilled('${b.id}')">
                Otorgar
              </button>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;

  document.getElementById('btnAwardBadge').addEventListener('click', () => {
    openModal('modalAwardBadge');
  });
}

window.openAwardBadgePrefilled = function (badgeId) {
  openModal('modalAwardBadge');
  const sel = document.getElementById('awardBadgeSelect');
  if (sel) sel.value = badgeId;
};

// -------------------------------------------------------------
// SUBTAB 6: CONTROL DE PERMISOS
// ("que jefatura eliga que permisos se les pueda dar")
// -------------------------------------------------------------
function renderPermissionsSection(container) {
  const users = window.K9Store.getUsers();

  container.innerHTML = `
    <div style="background:var(--bg-surface); border:1px solid var(--border-tactical); border-radius:14px; padding:1.75rem; box-shadow:var(--shadow-elevation);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h4 class="font-tactical" style="font-size:1.2rem; color:#fff;">MATRIZ DE PERMISOS DE LA JEFATURA K9</h4>
          <p style="font-size:0.85rem; color:var(--text-muted);">
            Configura individualmente qué agentes tienen acceso a los módulos de administración y jefatura.
          </p>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <label style="font-family:var(--font-headline); font-size:0.78rem; color:var(--text-muted);">SELECCIONAR AGENTE:</label>
          <select id="permUserSelect" class="form-select-tactical" style="min-width:260px;">
            ${users.map(u => `
              <option value="${u.id}">${u.name} [Placa ${u.placa}] - ${u.rank}</option>
            `).join('')}
          </select>
        </div>
      </div>

      <div id="permissionsMatrixContainer"></div>

      <div style="margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--border-subtle); display:flex; justify-content:flex-end; gap:1rem;">
        <button class="btn-tactical btn-tactical-gold" id="btnSavePermissions">
          💾 Guardar Permisos del Agente
        </button>
      </div>
    </div>
  `;

  const sel = document.getElementById('permUserSelect');
  sel.addEventListener('change', () => {
    renderUserPermissionsMatrix(sel.value);
  });

  renderUserPermissionsMatrix(sel.value);

  document.getElementById('btnSavePermissions').addEventListener('click', () => {
    saveUserPermissions(sel.value);
  });
}

function renderUserPermissionsMatrix(userId) {
  const users = window.K9Store.getUsers();
  const user = users.find(u => u.id === userId);
  const container = document.getElementById('permissionsMatrixContainer');
  if (!user || !container) return;

  const userPerms = user.permissions || [];
  const isSupreme = user.rank === 'Jefe de División K9';

  container.innerHTML = `
    ${isSupreme ? `
      <div style="background:rgba(255,183,3,0.1); border:1px solid var(--border-gold); padding:0.75rem 1rem; border-radius:8px; margin-bottom:1.25rem; font-size:0.85rem; color:var(--tactical-gold);">
        👑 <strong>Rango Supremo:</strong> Este usuario posee el mando absoluto de la División K9 y dispone de todos los permisos de forma automática.
      </div>
    ` : ''}

    <div class="permissions-grid">
      ${window.SYSTEM_PERMISSIONS.map(perm => {
    const isChecked = isSupreme || userPerms.includes(perm.id);
    return `
          <label class="perm-toggle-card ${isChecked ? 'checked' : ''}">
            <input type="checkbox" class="perm-checkbox" data-permid="${perm.id}" ${isChecked ? 'checked' : ''} ${isSupreme ? 'disabled' : ''}>
            <div class="perm-details">
              <span class="perm-title">${perm.label}</span>
              <span class="perm-desc">${perm.desc}</span>
            </div>
          </label>
        `;
  }).join('')}
    </div>
  `;

  // Cambiar estilo visual del label al marcar
  container.querySelectorAll('.perm-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      cb.closest('.perm-toggle-card').classList.toggle('checked', cb.checked);
    });
  });
}

function saveUserPermissions(userId) {
  const users = window.K9Store.getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;

  const checkboxes = document.querySelectorAll('#permissionsMatrixContainer .perm-checkbox');
  const selected = [];
  checkboxes.forEach(cb => {
    if (cb.checked) selected.push(cb.dataset.permid);
  });

  user.permissions = selected;
  // Si tiene al menos un permiso de jefatura, marcar isJefatura como true
  user.isJefatura = selected.length > 0;

  window.K9Store.save(STORAGE_KEYS.USERS, users);
  if (window.K9Audio) window.K9Audio.playTacticalBeep(1100, 0.12);
  showToast(`Permisos actualizados para el agente ${user.name}`, 'success');
}

// -------------------------------------------------------------
// RENDERIZADOR GENERAL DE SUBTABS DE JEFATURA
// -------------------------------------------------------------
function renderJefaturaSubtab(subtab) {
  const container = document.getElementById('jefaturaSubtabContent');
  if (!container) return;

  if (subtab === 'informes') renderReportsSection(container);
  else if (subtab === 'agentes') renderAgentsSection(container);
  else if (subtab === 'canes') renderDogsSection(container);
  else if (subtab === 'disciplinario') renderDisciplinarySection(container);
  else if (subtab === 'insignias') renderBadgesSection(container);
  else if (subtab === 'permisos') renderPermissionsSection(container);
}

// ==========================================
// MODALES TÁCTICOS Y FORMULARIOS
// ==========================================
function setupModals() {
  // Cerrar modales con la 'X' o haciendo clic en el fondo
  document.querySelectorAll('.tactical-modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-close-btn')) {
        closeModal(modal.id);
      }
    });
  });

  // Formulario: Nuevo Informe Semanal
  const formReport = document.getElementById('formNewReport');
  if (formReport) {
    formReport.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = window.K9Auth.getCurrentUser();
      const reports = window.K9Store.getReports();

      const newRep = {
        id: 'rep_' + Date.now(),
        week: document.getElementById('repWeek').value,
        agentId: user.id,
        agentName: `${user.name} (${user.placa})`,
        dogName: document.getElementById('repDog').value,
        patrolHours: parseInt(document.getElementById('repHours').value, 10) || 0,
        seizures: document.getElementById('repSeizures').value,
        canineAlerts: parseInt(document.getElementById('repAlerts').value, 10) || 0,
        canineInterventions: parseInt(document.getElementById('repInterventions').value, 10) || 0,
        rating: document.getElementById('repRating').value,
        notes: document.getElementById('repNotes').value,
        status: 'En Revisión por Jefatura',
        signedBy: 'Pendiente de Validación',
        date: new Date().toLocaleDateString('es-ES')
      };

      reports.unshift(newRep);
      window.K9Store.save(STORAGE_KEYS.REPORTS, reports);
      closeModal('modalNewReport');
      formReport.reset();
      showToast('Informe semanal registrado correctamente', 'success');
      if (window.K9Webhook) window.K9Webhook.onReportSubmit(user, {
        weekLabel: newRep.week,
        hours: newRep.patrolHours,
        interventions: newRep.canineInterventions,
        notes: newRep.notes
      });
      if (currentView === 'jefatura') renderJefaturaSubtab('informes');
    });
  }

  // Formulario: Dar de Alta Agente
  const formAgent = document.getElementById('formNewAgent');
  if (formAgent) {
    formAgent.addEventListener('submit', (e) => {
      e.preventDefault();
      const users = window.K9Store.getUsers();

      const newAgent = {
        id: 'user_' + Date.now(),
        name: document.getElementById('agentName').value,
        placa: document.getElementById('agentPlaca').value,
        rank: document.getElementById('agentRank').value,
        discordUsername: document.getElementById('agentDiscord').value,
        discordId: 'manual_' + Math.random().toString(36).substring(2, 8),
        avatar: document.getElementById('agentAvatar').value || 'assets/images/emblem.jpg',
        isJefatura: document.getElementById('agentIsJefatura').checked,
        assignedDogId: null,
        badges: [],
        permissions: document.getElementById('agentIsJefatura').checked ? ['view_jefatura', 'manage_reports'] : [],
        serviceStatus: 'En Activo',
        joinedDate: new Date().toLocaleDateString('es-ES'),
        patrolHoursTotal: 0,
        interventionsTotal: 0
      };

      users.push(newAgent);
      window.K9Store.save(STORAGE_KEYS.USERS, users);
      closeModal('modalNewAgent');
      formAgent.reset();
      showToast(`Agente ${newAgent.name} dado de alta en la unidad K9`, 'success');
      if (window.K9Webhook) {
        const _admin = window.K9Auth.getCurrentUser();
        if (_admin) window.K9Webhook.onProfileUpdate(_admin, newAgent, {
          'Acción': 'Alta manual de agente',
          'Rango asignado': newAgent.rank,
          'Discord': newAgent.discordUsername || '—'
        });
      }
      renderJefaturaSubtab('agentes');
    });
  }

  // Formulario: Registrar Nuevo Can K9
  const formDog = document.getElementById('formNewDog');
  if (formDog) {
    formDog.addEventListener('submit', (e) => {
      e.preventDefault();
      const dogs = window.K9Store.getDogs();

      const newDog = {
        id: 'k9_' + Date.now(),
        name: document.getElementById('dogNameInput').value,
        breed: document.getElementById('dogBreedInput').value,
        tag: document.getElementById('dogTagInput').value,
        specialty: document.getElementById('dogSpecialtyInput').value,
        handlerId: null,
        handlerName: 'Sin asignar',
        age: document.getElementById('dogAgeInput').value,
        healthStatus: document.getElementById('dogHealthInput').value,
        syncLevel: parseInt(document.getElementById('dogSyncInput').value, 10) || 85,
        photo: document.getElementById('dogPhotoInput').value || 'assets/images/k9_thor.jpg',
        weight: '32 kg',
        bloodType: 'Universal',
        emergencyCallsign: 'K9-' + Math.floor(10 + Math.random() * 80),
        trainingNotes: document.getElementById('dogNotesInput').value
      };

      dogs.push(newDog);
      window.K9Store.save(STORAGE_KEYS.DOGS, dogs);
      closeModal('modalNewDog');
      formDog.reset();
      showToast(`Can ${newDog.name} [${newDog.tag}] incorporado al servicio K9`, 'success');
      if (window.K9Webhook) {
        const _admin = window.K9Auth.getCurrentUser();
        if (_admin) window.K9Webhook.onDogAssignment(_admin, newDog, 'Sin asignar', false);
      }
      renderJefaturaSubtab('canes');
      updateLiveCounters();
    });
  }

  // Formulario: Registrar Falta Disciplinaria
  const formDisc = document.getElementById('formNewDisciplinary');
  if (formDisc) {
    // Rellenar select de agentes
    const fillDiscAgents = () => {
      const sel = document.getElementById('discAgentSelect');
      if (sel) {
        const users = window.K9Store.getUsers();
        sel.innerHTML = users.map(u => `<option value="${u.id}">${u.name} (Placa ${u.placa})</option>`).join('');
      }
    };
    fillDiscAgents();

    formDisc.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = window.K9Auth.getCurrentUser();
      const users = window.K9Store.getUsers();
      const targetUserId = document.getElementById('discAgentSelect').value;
      const targetUser = users.find(u => u.id === targetUserId);
      const records = window.K9Store.getDisciplinary();

      const newDisc = {
        id: 'disc_' + Date.now(),
        agentId: targetUserId,
        agentName: targetUser ? `${targetUser.name} (${targetUser.placa})` : 'Agente',
        type: document.getElementById('discTypeSelect').value,
        reason: document.getElementById('discReasonInput').value,
        sanction: document.getElementById('discSanctionInput').value,
        status: 'Vigente',
        issuedBy: `${user.name} (${user.placa})`,
        date: new Date().toLocaleDateString('es-ES')
      };

      records.unshift(newDisc);
      window.K9Store.save(STORAGE_KEYS.DISCIPLINARY, records);
      closeModal('modalNewDisciplinary');
      formDisc.reset();
      if (window.K9Audio) window.K9Audio.playAlert();
      showToast(`Falta ${newDisc.type} impuesta y registrada en expediente`, 'warning');
      if (window.K9Webhook) window.K9Webhook.onDisciplinaryCreate(user,
        targetUser ? targetUser.name : 'Desconocido',
        { type: newDisc.type, penalty: newDisc.sanction, reason: newDisc.reason }
      );
      renderJefaturaSubtab('disciplinario');
    });
  }

  // Formulario: Otorgar Insignia
  const formAward = document.getElementById('formAwardBadge');
  if (formAward) {
    const fillAwardSelects = () => {
      const userSel = document.getElementById('awardUserSelect');
      const badgeSel = document.getElementById('awardBadgeSelect');
      if (userSel) {
        const users = window.K9Store.getUsers();
        userSel.innerHTML = users.map(u => `<option value="${u.id}">${u.name} [Placa ${u.placa}] - ${u.rank}</option>`).join('');
      }
      if (badgeSel) {
        const badges = window.K9Store.getBadges();
        badgeSel.innerHTML = badges.map(b => `<option value="${b.id}">${b.name} (${b.category})</option>`).join('');
      }
    };
    fillAwardSelects();

    formAward.addEventListener('submit', (e) => {
      e.preventDefault();
      const users = window.K9Store.getUsers();
      const badges = window.K9Store.getBadges();
      const targetUserId = document.getElementById('awardUserSelect').value;
      const targetBadgeId = document.getElementById('awardBadgeSelect').value;
      const reason = document.getElementById('awardReasonInput').value;

      const user = users.find(u => u.id === targetUserId);
      const badge = badges.find(b => b.id === targetBadgeId);

      if (user && badge) {
        if (!user.badges) user.badges = [];
        if (!user.badges.includes(targetBadgeId)) {
          user.badges.push(targetBadgeId);
          window.K9Store.save(STORAGE_KEYS.USERS, users);
          closeModal('modalAwardBadge');
          formAward.reset();
          if (window.K9Audio) window.K9Audio.playTacticalBeep(1400, 0.15);
          showToast(`¡Condecoración '${badge.name}' otorgada a ${user.name}!`, 'success');
          if (window.K9Webhook) {
            const _admin = window.K9Auth.getCurrentUser();
            if (_admin) window.K9Webhook.onBadgeAwarded(_admin, user, badge, false);
          }
          renderJefaturaSubtab('insignias');
        } else {
          alert('Este agente ya posee esta condecoración.');
        }
      }
    });
  }

  // Formulario: Publicar Comunicado
  const formAnn = document.getElementById('formNewAnnouncement');
  if (formAnn) {
    formAnn.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = window.K9Auth.getCurrentUser();
      const announcements = window.K9Store.getAnnouncements();

      const newAnn = {
        id: 'ann_' + Date.now(),
        title: document.getElementById('annTitleInput').value.toUpperCase(),
        priority: document.getElementById('annPrioritySelect').value,
        date: new Date().toLocaleDateString('es-ES'),
        author: `${user.rank} - ${user.name}`,
        pinned: document.getElementById('annPinnedInput').checked,
        content: document.getElementById('annContentInput').value
      };

      if (newAnn.pinned) {
        announcements.unshift(newAnn);
      } else {
        announcements.push(newAnn);
      }

      window.K9Store.save(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
      closeModal('modalNewAnnouncement');
      formAnn.reset();
      showToast('Comunicado oficial publicado con éxito', 'success');
      if (window.K9Webhook) window.K9Webhook.onAnnouncementPublish(user, {
        title: newAnn.title,
        category: newAnn.priority,
        pinned: newAnn.pinned,
        content: newAnn.content
      });
      renderGeneralSubtab('anuncios');
    });
  }

  // Configuración de Discord OAuth2
  const formDiscordCfg = document.getElementById('formDiscordConfig');
  if (formDiscordCfg) {
    const cfg = window.K9Auth.getDiscordConfig();
    document.getElementById('cfgClientId').value = cfg.clientId;
    document.getElementById('cfgRedirectUri').value = cfg.redirectUri;

    // Pre-rellenar URL del webhook con la guardada (o la por defecto visible)
    const cfgWebhookInput = document.getElementById('cfgWebhookUrl');
    if (cfgWebhookInput && window.K9Webhook) {
      cfgWebhookInput.value = window.K9Webhook.getWebhookUrl();
    }

    formDiscordCfg.addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        clientId: '1406448851153326131',
        redirectUri: (document.getElementById('cfgRedirectUri').value || '').trim(),
        scope: 'identify'
      };
      window.K9Auth.saveDiscordConfig(updated);
      closeModal('modalDiscordConfig');
      showToast('Configuración de Discord OAuth2 actualizada', 'success');
    });

    // Guardar webhook
    const btnSaveWebhook = document.getElementById('btnSaveWebhook');
    if (btnSaveWebhook) {
      btnSaveWebhook.addEventListener('click', () => {
        const url = (document.getElementById('cfgWebhookUrl').value || '').trim();
        if (!url) { showToast('Introduce una URL de webhook válida', 'warning'); return; }
        if (window.K9Webhook) {
          const ok = window.K9Webhook.setWebhookUrl(url);
          if (ok) showToast('✅ Webhook guardado correctamente', 'success');
          else showToast('URL inválida — debe comenzar por discord.com/api/webhooks/', 'warning');
        }
      });
    }

    // Enviar mensaje de test al webhook
    const btnTestWebhook = document.getElementById('btnTestWebhook');
    if (btnTestWebhook) {
      btnTestWebhook.addEventListener('click', async () => {
        if (window.K9Webhook) {
          showToast('Enviando mensaje de test al webhook…', 'info');
          await window.K9Webhook.testWebhook();
          showToast('🔔 Mensaje de test enviado. Comprueba tu canal de Discord.', 'success');
        }
      });
    }

    // Borrar URL guardada (vuelve al webhook por defecto)
    const btnClearWebhook = document.getElementById('btnClearWebhook');
    if (btnClearWebhook) {
      btnClearWebhook.addEventListener('click', () => {
        if (window.K9Webhook) {
          window.K9Webhook.clearWebhookUrl();
          const cfgWH = document.getElementById('cfgWebhookUrl');
          if (cfgWH) cfgWH.value = window.K9Webhook.getWebhookUrl();
          showToast('Webhook personalizado borrado. Usando el por defecto.', 'info');
        }
      });
    }

    const btnLiveDiscord = document.getElementById('btnLaunchLiveDiscord');
    if (btnLiveDiscord) {
      btnLiveDiscord.addEventListener('click', () => {
        window.K9Auth.initiateDiscordOAuth();
      });
    }
  }

  // Botón directo OAuth2 de Discord en el modal de login
  const btnModalOAuth = document.getElementById('btnModalDiscordOAuth');
  if (btnModalOAuth) {
    btnModalOAuth.addEventListener('click', () => {
      window.K9Auth.initiateDiscordOAuth();
    });
  }
}

// Abrir y cerrar modales
window.openModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (modalId === 'modalDiscordConfig' && window.K9Auth) {
      const cfg = window.K9Auth.getDiscordConfig();
      const clientInput = document.getElementById('cfgClientId');
      const redirectInput = document.getElementById('cfgRedirectUri');
      if (clientInput) clientInput.value = cfg.clientId;
      if (redirectInput) redirectInput.value = cfg.redirectUri;
    }
    modal.classList.add('show');
    if (window.K9Audio) window.K9Audio.playTacticalClick();
  }
};

window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
};

// Inspeccionar insignia en modal de condecoración
window.openBadgeInspection = function (badgeId, recipientName) {
  const badges = window.K9Store.getBadges();
  const badge = badges.find(b => b.id === badgeId);
  if (!badge) return;

  const modal = document.getElementById('modalBadgeInspect');
  if (modal) {
    document.getElementById('inspectBadgeImg').src = badge.image;
    document.getElementById('inspectBadgeTitle').textContent = badge.name;
    document.getElementById('inspectBadgeCategory').textContent = badge.category;
    document.getElementById('inspectBadgeDesc').textContent = badge.desc;
    document.getElementById('inspectBadgeRecipient').textContent = recipientName || 'Agente Operativo';
    openModal('modalBadgeInspect');
  }
};

// ==========================================
// TOASTS Y CONTADORES EN VIVO
// ==========================================
function updateLiveCounters() {
  const agents = window.K9Store.getUsers();
  const dogs = window.K9Store.getDogs();
  const reports = window.K9Store.getReports();

  const countAgentsEl = document.getElementById('heroCountAgents');
  const countDogsEl = document.getElementById('heroCountDogs');
  const countReportsEl = document.getElementById('heroCountReports');
  const countPatrolEl = document.getElementById('heroCountPatrol');

  if (countAgentsEl) countAgentsEl.textContent = agents.length;
  if (countDogsEl) countDogsEl.textContent = dogs.length;
  if (countReportsEl) countReportsEl.textContent = reports.length;
  if (countPatrolEl) {
    const totalHours = agents.reduce((acc, u) => acc + (u.patrolHoursTotal || 0), 0);
    countPatrolEl.textContent = `${totalHours}h`;
  }
}

function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('tacticalToastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'tacticalToastContainer';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const borderColor = type === 'success' ? 'var(--tactical-green)' : type === 'warning' ? 'var(--tactical-amber)' : 'var(--police-cyan)';
  toast.style.cssText = `
    background: rgba(16, 24, 43, 0.95);
    border: 1px solid ${borderColor};
    color: #fff;
    padding: 0.85rem 1.25rem;
    border-radius: 10px;
    font-family: var(--font-tactical);
    font-size: 0.82rem;
    box-shadow: 0 10px 25px rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    gap: 0.6rem;
    pointer-events: auto;
    animation: fadeInDown 0.25s ease-out;
  `;

  toast.innerHTML = `
    <span style="color:${borderColor};">●</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Exportar registro completo en formato JSON
window.exportDataDossier = function () {
  const dossier = {
    exportDate: new Date().toISOString(),
    department: 'División Canina K9 - Jefatura Central',
    users: window.K9Store.getUsers(),
    dogs: window.K9Store.getDogs(),
    reports: window.K9Store.getReports(),
    disciplinary: window.K9Store.getDisciplinary(),
    announcements: window.K9Store.getAnnouncements()
  };

  const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EXPEDIENTE_K9_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Expediente completo descargado en JSON', 'success');
};

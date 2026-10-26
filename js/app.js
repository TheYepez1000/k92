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
let currentProfileSubtab = 'ficha';

function renderGeneralSubnavTabs() {
  const container = document.getElementById('generalSubnavRow');
  if (!container) return;

  const user = window.K9Auth.getCurrentUser();

  if (user) {
    // Usuario autenticado con Discord: ve normativas, manuales, canes y anuncios de jefatura
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
      <button class="subnav-pill-btn general-subnav-btn ${currentGeneralSubtab === 'anuncios' ? 'active' : ''}" data-subtab="anuncios">
        📢 Anuncios de Jefatura
      </button>
    `;
  } else {
    // Usuario no autenticado: ve normativas, manuales y canes
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
  // Tabs principales del HUD superior
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
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

  // Renderizar la vista correspondiente
  if (viewName === 'inicio' || viewName === 'normativas') {
    renderGeneralSubnavTabs();
    renderGeneralSubtab(currentGeneralSubtab);
    updateLiveCounters();
  } else if (viewName === 'miembros') {
    const cont = document.getElementById('view-miembros');
    if (cont) renderMembersDirectory(cont);
  } else if (viewName === 'ascensos') {
    const cont = document.getElementById('view-ascensos');
    if (cont) renderPromotionsSection(cont);
  } else if (viewName === 'condecoraciones') {
    const cont = document.getElementById('view-condecoraciones');
    if (cont) renderDecorationsSection(cont);
  } else if (viewName === 'perfil') {
    renderMemberProfile();
  } else if (viewName === 'jefatura') {
    checkJefaturaAccessAndRender();
  }
}

window.switchMainView = switchMainView;

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
    perfilLockBadge.style.display = (user && user.isVerified) ? 'none' : 'inline-block';
  }

  if (heroActions) {
    if (user) {
      if (user.isVerified) {
        heroActions.innerHTML = `
          <button class="btn-tactical btn-tactical-primary" onclick="switchMainView('perfil')">
            <span>🐕</span> Ver Mi Perfil Canino
          </button>
          ${user.isJefatura ? `
            <button class="btn-tactical btn-tactical-gold" onclick="switchMainView('jefatura')">
              <span>👑</span> Panel de Jefatura K9
            </button>
          ` : ''}
          <button class="btn-tactical btn-tactical-outline" onclick="switchGeneralSubtab('normativas')">
            <span>⚖️</span> Normativas Oficiales
          </button>
        `;
      } else {
        heroActions.innerHTML = `
          <button class="btn-tactical btn-tactical-primary" onclick="switchMainView('perfil')">
            <span>🔒</span> Estado de Mi Cuenta (Pendiente de Alta)
          </button>
          <button class="btn-tactical btn-tactical-gold" onclick="switchGeneralSubtab('galeria')">
            <span>🐕</span> Plantilla de Canes K9
          </button>
          <button class="btn-tactical btn-tactical-outline" onclick="switchGeneralSubtab('normativas')">
            <span>⚖️</span> Ver Normativas Oficiales
          </button>
        `;
      }
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
    if (!user || !user.isVerified) {
      contentEl.innerHTML = `
        <div class="empty-state-box" style="margin:3rem auto; max-width:550px;">
          <div class="empty-icon">🔒</div>
          <h3 class="font-tactical" style="color:#fff; margin-bottom:0.75rem;">ACCESO RESTRINGIDO A ANUNCIOS</h3>
          <p style="margin-bottom:1.5rem; color:var(--text-muted);">${user ? 'Tu cuenta está pendiente de asignación de rango por Jefatura. Los comunicados internos son de acceso restringido a agentes acreditados.' : 'Los comunicados, directrices operativas y órdenes de servicio de la Jefatura K9 son confidenciales. Debes iniciar sesión con tu cuenta de Discord para visualizarlos.'}</p>
          ${!user ? `
            <button class="btn-tactical btn-tactical-primary" onclick="window.K9Auth.initiateDiscordOAuth()">
              ✦ Iniciar Sesión con Discord
            </button>
          ` : `
            <button class="btn-tactical btn-tactical-primary btn-tactical-sm" onclick="switchGeneralSubtab('normativas')">
              ⚖️ Ver Normativas Oficiales
            </button>
          `}
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
  } else if (subtab === 'chat') {
    renderChatSection(contentEl);
  } else if (subtab === 'miembros') {
    renderMembersDirectory(contentEl);
  } else if (subtab === 'ascensos') {
    renderPromotionsSection(contentEl);
  } else if (subtab === 'condecoraciones') {
    renderDecorationsSection(contentEl);
  }
}

function getPriorityBadgeHtml(priority) {
  const p = (priority || 'OFICIAL').toUpperCase();
  if (p === 'URGENTE') {
    return `<span class="ann-priority-badge ann-priority-urgente">🚨 URGENTE</span>`;
  } else if (p === 'IMPORTANTE') {
    return `<span class="ann-priority-badge ann-priority-importante">⚠️ IMPORTANTE</span>`;
  } else if (p === 'INFORMATIVO') {
    return `<span class="ann-priority-badge ann-priority-informativo">ℹ️ INFORMATIVO</span>`;
  } else {
    return `<span class="ann-priority-badge ann-priority-oficial">🛡️ COMUNICADO OFICIAL</span>`;
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
        <div style="background:var(--bg-surface); border:1px solid ${a.priority === 'URGENTE' ? 'var(--tactical-red)' : a.priority === 'IMPORTANTE' ? 'var(--border-gold)' : a.pinned ? 'var(--police-cyan)' : 'var(--border-subtle)'}; border-radius:14px; padding:1.5rem; position:relative; box-shadow:var(--shadow-elevation);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
              ${getPriorityBadgeHtml(a.priority)}
              ${a.pinned ? '<span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--tactical-gold); letter-spacing:0.06em;">📌 FIJADO POR JEFATURA</span>' : ''}
              <span style="font-family:var(--font-tactical); font-size:0.78rem; color:var(--text-muted);">${a.date}</span>
            </div>
            ${canPublish ? `
              <div style="display:flex; gap:0.4rem; align-items:center;">
                <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.togglePinAnnouncement('${a.id}')" title="${a.pinned ? 'Desfijar del inicio' : 'Fijar al inicio'}" style="font-size:0.75rem; padding:0.2rem 0.5rem;">
                  ${a.pinned ? '📌 Desfijar' : '📌 Fijar'}
                </button>
                <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.editAnnouncement('${a.id}')" title="Editar comunicado" style="font-size:0.75rem; padding:0.2rem 0.5rem;">
                  ✏️ Editar
                </button>
                <button class="btn-tactical btn-tactical-sm" onclick="window.deleteAnnouncement('${a.id}')" style="background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.4); color:#ff5252; font-size:0.75rem; padding:0.2rem 0.5rem;" title="Eliminar comunicado">
                  🗑️
                </button>
              </div>
            ` : ''}
          </div>

          <h4 style="font-family:var(--font-tactical); font-size:1.15rem; color:#fff; margin-bottom:0.75rem; line-height:1.3;">
            ${a.title}
          </h4>

          ${a.imageUrl ? `
            <div class="announcement-photo-wrap">
              <img src="${a.imageUrl}" class="announcement-photo-img" alt="${a.title}" onerror="this.parentElement.style.display='none'">
            </div>
          ` : ''}

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

window.editAnnouncement = function (id) {
  const anns = window.K9Store.getAnnouncements();
  const a = anns.find(x => x.id === id);
  if (!a) return;
  document.getElementById('editAnnId').value = a.id;
  document.getElementById('editAnnTitle').value = a.title;
  document.getElementById('editAnnPriority').value = a.priority || 'OFICIAL';
  document.getElementById('editAnnImage').value = a.imageUrl || '';
  document.getElementById('editAnnPinned').checked = !!a.pinned;
  document.getElementById('editAnnContent').value = a.content;
  openModal('modalEditAnnouncement');
};

window.deleteAnnouncement = function (id) {
  const anns = window.K9Store.getAnnouncements();
  const a = anns.find(x => x.id === id);
  if (!a) return;
  window._pendingDeleteAnnId = id;
  const titleEl = document.getElementById('delAnnTitle');
  const authorEl = document.getElementById('delAnnAuthor');
  if (titleEl) titleEl.textContent = a.title;
  if (authorEl) authorEl.textContent = 'Emitido por: ' + a.author + ' (' + a.date + ')';
  openModal('modalDeleteAnnouncement');
};

window._confirmDeleteAnnouncement = function () {
  const id = window._pendingDeleteAnnId;
  if (!id) return;
  closeModal('modalDeleteAnnouncement');
  const anns = window.K9Store.getAnnouncements().filter(x => x.id !== id);
  window.K9Store.save(STORAGE_KEYS.ANNOUNCEMENTS, anns);
  if (window.K9CloudSync) window.K9CloudSync.push();
  if (window.K9Webhook) {
    window.K9Webhook.log('announcement', 'Comunicado Eliminado', `Se ha eliminado un comunicado del tablón.`);
  }
  showToast('Comunicado retirado y eliminado del tablón', 'info');
  renderAnnouncements(document.getElementById('generalSubtabContent'));
};

window.togglePinAnnouncement = function (id) {
  const anns = window.K9Store.getAnnouncements();
  const a = anns.find(x => x.id === id);
  if (!a) return;
  a.pinned = !a.pinned;
  anns.sort((x, y) => (y.pinned ? 1 : 0) - (x.pinned ? 1 : 0));
  window.K9Store.save(STORAGE_KEYS.ANNOUNCEMENTS, anns);
  if (window.K9CloudSync) window.K9CloudSync.push();
  showToast(a.pinned ? 'Comunicado fijado al inicio' : 'Comunicado desfijado', 'info');
  renderAnnouncements(document.getElementById('generalSubtabContent'));
};

function renderNormatives(container) {
  const normatives = window.K9Store.getNormatives();
  const isJef = window.K9Auth.isJefaturaMember();

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h3 class="font-tactical" style="font-size:1.35rem; color:#fff;">REGLAMENTO Y MARCO NORMATIVO K9</h3>
        <p style="font-size:0.85rem; color:var(--text-muted);">Protocolos obligatorios de actuación, ética y uso proporcional de la fuerza canina</p>
      </div>
      ${isJef ? `
        <button class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="window.openNewNormativeModal()">
          <span>+</span> Añadir Capítulo Normativo
        </button>
      ` : ''}
    </div>

    <div style="display:flex; flex-direction:column; gap:1.5rem;">
      ${normatives.map(norm => `
        <div style="background:var(--bg-surface); border:1px solid var(--border-tactical); border-radius:14px; padding:1.5rem; box-shadow:var(--shadow-elevation);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
            <h4 style="font-family:var(--font-headline); font-size:1.05rem; color:var(--tactical-gold); letter-spacing:0.08em; margin:0;">
              ${norm.chapter}
            </h4>
            ${isJef ? `
              <div style="display:flex; gap:0.4rem;">
                <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.editNormative('${norm.id}')" title="Editar capítulo">
                  ✏️ Editar
                </button>
                <button class="btn-tactical btn-tactical-sm" onclick="window.deleteNormative('${norm.id}')" style="background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.4); color:#ff5252;" title="Eliminar capítulo">
                  🗑️
                </button>
              </div>
            ` : ''}
          </div>
          <div style="display:flex; flex-direction:column; gap:1.15rem;">
            ${(norm.articles || []).map(art => `
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

window.openNewNormativeModal = function () {
  document.getElementById('normId').value = '';
  document.getElementById('modalNormativeTitle').innerHTML = '<span>⚖️</span> AÑADIR NUEVO CAPÍTULO NORMATIVO';
  document.getElementById('normChapter').value = '';
  document.getElementById('normArticlesRaw').value = 'Art. 1 | Objeto | El presente reglamento establece las bases operativas de la unidad...';
  openModal('modalEditNormative');
};

window.editNormative = function (id) {
  const norms = window.K9Store.getNormatives();
  const n = norms.find(x => x.id === id);
  if (!n) return;
  document.getElementById('normId').value = n.id;
  document.getElementById('modalNormativeTitle').innerHTML = '<span>✏️</span> EDITAR NORMATIVA OFICIAL';
  document.getElementById('normChapter').value = n.chapter;
  document.getElementById('normArticlesRaw').value = (n.articles || []).map(a => `${a.num} | ${a.title} | ${a.text}`).join('\n');
  openModal('modalEditNormative');
};

window.deleteNormative = function (id) {
  const norms = window.K9Store.getNormatives();
  const n = norms.find(x => x.id === id);
  if (!n) return;
  window._pendingDeleteNormId = id;
  const chEl = document.getElementById('delNormChapter');
  if (chEl) chEl.textContent = n.chapter;
  openModal('modalDeleteNormative');
};

window._confirmDeleteNormative = function () {
  const id = window._pendingDeleteNormId;
  if (!id) return;
  closeModal('modalDeleteNormative');
  const norms = window.K9Store.getNormatives().filter(x => x.id !== id);
  window.K9Store.save(STORAGE_KEYS.NORMATIVES, norms);
  if (window.K9CloudSync) window.K9CloudSync.push();
  showToast('Capítulo normativo eliminado', 'info');
  renderNormatives(document.getElementById('generalSubtabContent'));
};

function renderManuals(container) {
  const manuals = window.K9Store.getManuals();
  const isJef = window.K9Auth.isJefaturaMember();

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h3 class="font-tactical" style="font-size:1.35rem; color:#fff;">MANUALES Y GUÍAS DE ADIESTRAMIENTO K9</h3>
        <p style="font-size:0.85rem; color:var(--text-muted);">Vocabulario de comandos caninos, táctica de combate y soporte veterinario de emergencia</p>
      </div>
      ${isJef ? `
        <button class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="window.openNewManualModal()">
          <span>+</span> Añadir Manual de Instrucción
        </button>
      ` : ''}
    </div>

    <div style="display:flex; flex-direction:column; gap:2rem;">
      ${manuals.map(man => `
        <div style="background:var(--bg-surface); border:1px solid var(--border-tactical); border-radius:14px; padding:1.5rem; box-shadow:var(--shadow-elevation);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <h4 style="font-family:var(--font-tactical); font-size:1.1rem; color:#fff;">
                ${man.title}
              </h4>
              <span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--police-cyan); background:rgba(0,229,255,0.1); border:1px solid var(--border-tactical); padding:0.2rem 0.6rem; border-radius:20px; text-transform:uppercase;">
                ${man.category}
              </span>
            </div>
            ${isJef ? `
              <div style="display:flex; gap:0.4rem;">
                <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.editManual('${man.id}')" title="Editar manual">
                  ✏️ Editar
                </button>
                <button class="btn-tactical btn-tactical-sm" onclick="window.deleteManual('${man.id}')" style="background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.4); color:#ff5252;" title="Eliminar manual">
                  🗑️
                </button>
              </div>
            ` : ''}
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
            ${(man.items || []).map(item => `
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

window.openNewManualModal = function () {
  document.getElementById('manId').value = '';
  document.getElementById('modalManualTitle').innerHTML = '<span>📖</span> AÑADIR MANUAL DE ADIESTRAMIENTO';
  document.getElementById('manTitle').value = '';
  document.getElementById('manCategory').value = 'COMANDOS / TÁCTICA';
  document.getElementById('manItemsRaw').value = 'Fass | Ataque | Neutralización directa del sospechoso';
  openModal('modalEditManual');
};

window.editManual = function (id) {
  const mans = window.K9Store.getManuals();
  const m = mans.find(x => x.id === id);
  if (!m) return;
  document.getElementById('manId').value = m.id;
  document.getElementById('modalManualTitle').innerHTML = '<span>✏️</span> EDITAR MANUAL DE INSTRUCCIÓN';
  document.getElementById('manTitle').value = m.title;
  document.getElementById('manCategory').value = m.category;
  document.getElementById('manItemsRaw').value = (m.items || []).map(item => `${item.command} | ${item.trans} | ${item.desc}`).join('\n');
  openModal('modalEditManual');
};

window.deleteManual = function (id) {
  const mans = window.K9Store.getManuals();
  const m = mans.find(x => x.id === id);
  if (!m) return;
  window._pendingDeleteManId = id;
  const titEl = document.getElementById('delManTitle');
  if (titEl) titEl.textContent = m.title;
  openModal('modalDeleteManual');
};

window._confirmDeleteManual = function () {
  const id = window._pendingDeleteManId;
  if (!id) return;
  closeModal('modalDeleteManual');
  const mans = window.K9Store.getManuals().filter(x => x.id !== id);
  window.K9Store.save(STORAGE_KEYS.MANUALS, mans);
  if (window.K9CloudSync) window.K9CloudSync.push();
  showToast('Manual de adiestramiento eliminado', 'info');
  renderManuals(document.getElementById('generalSubtabContent'));
};

function renderMembersDirectory(container) {
  const users = window.K9Store.getUsers();
  const dogs = window.K9Store.getDogs();
  const badges = window.K9Store.getBadges();
  const isJef = window.K9Auth.isJefaturaMember();

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h3 class="font-tactical" style="font-size:1.35rem; color:#fff;">DIRECTORIO DE PERSONAL · UNIDAD CANINA K9</h3>
        <p style="font-size:0.85rem; color:var(--text-muted);">Listado oficial de mandos, instructores y guías caninos en activo</p>
      </div>
      <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
        <div class="table-search-box" style="margin:0;">
          <span>🔍</span>
          <input type="text" id="searchMembersInput" placeholder="Buscar por agente, rango, placa...">
        </div>
        ${isJef ? `
          <button class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="openModal('modalNewAgent')">
            <span>+</span> Registrar Nuevo Miembro
          </button>
        ` : ''}
      </div>
    </div>

    <div class="members-directory-grid" id="membersGridBody">
      ${renderMemberCardsHtml(users, dogs, badges, isJef)}
    </div>
  `;

  const searchInput = document.getElementById('searchMembersInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = users.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.placa || '').toLowerCase().includes(q) ||
        (u.rank || '').toLowerCase().includes(q)
      );
      document.getElementById('membersGridBody').innerHTML = renderMemberCardsHtml(filtered, dogs, badges, isJef);
    });
  }
}

function renderMemberCardsHtml(users, dogs, allBadges, isJef) {
  if (!users || users.length === 0) {
    return `<div class="empty-state-box" style="grid-column: 1 / -1;"><p style="color:var(--text-muted);">No hay miembros registrados en la unidad todavía.</p></div>`;
  }
  return users.map(u => {
    const assignedDog = u.assignedDogId ? dogs.find(d => d.id === u.assignedDogId) : null;
    const userBadges = (u.badges || []).map(bId => allBadges.find(b => b.id === bId)).filter(Boolean);

    return `
      <div class="member-tactical-card">
        <div class="member-card-header">
          <img src="${u.avatar || 'assets/images/emblem.jpg'}" class="member-card-avatar" alt="${u.name}" onerror="this.src='assets/images/emblem.jpg'">
          <div class="member-card-info">
            <span class="member-card-placa">PLACA #${u.placa || 'PENDIENTE'}</span>
            <h4 class="font-gobold">${u.name}</h4>
            <span class="member-card-rank-badge ${u.isJefatura ? 'chat-badge-jefatura' : ''}">${u.rank || 'Aspirante K9'}</span>
          </div>
        </div>

        <div class="member-dog-assignment">
          ${assignedDog ? `
            <img src="${assignedDog.photo || 'assets/images/k9_rex.jpg'}" class="member-dog-thumb" alt="${assignedDog.name}" onerror="this.src='assets/images/emblem.jpg'">
            <div>
              <div style="font-size:0.72rem; color:var(--text-muted);">BINOMIO CANINO ASIGNADO</div>
              <strong style="color:#fff; font-size:0.95rem; font-family:var(--font-tactical);">${assignedDog.name}</strong>
              <span style="font-size:0.75rem; color:var(--police-cyan);"> [${assignedDog.tag || 'K9'}]</span>
              <div style="font-size:0.72rem; color:var(--text-subtle);">${assignedDog.breed || 'Pastor Belga'}</div>
            </div>
          ` : `
            <span style="font-size:1.5rem; opacity:0.5;">🐕</span>
            <div>
              <div style="font-size:0.72rem; color:var(--text-muted);">ESTADO CANINO</div>
              <span style="font-size:0.82rem; color:var(--text-subtle); font-style:italic;">Sin can K9 asignado</span>
            </div>
          `}
        </div>

        <div>
          <div style="font-size:0.72rem; color:var(--tactical-gold); letter-spacing:0.06em; margin-bottom:0.4rem; font-weight:700;">CONDECORACIONES (${userBadges.length}):</div>
          <div class="member-badges-row">
            ${userBadges.length > 0 ? userBadges.map(b => `
              <img src="${b.image || 'assets/images/medal_valor.jpg'}" class="member-badge-chip" title="${b.name} (${b.category})" alt="${b.name}" onclick="window.inspectBadgeModal('${b.id}', '${u.name}')">
            `).join('') : '<span style="font-size:0.78rem; color:var(--text-subtle);">Sin condecoraciones otorgadas</span>'}
          </div>
        </div>

        ${isJef ? `
          <div style="margin-top:auto; padding-top:1rem; border-top:1px solid var(--border-subtle); display:flex; gap:0.5rem;">
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" style="flex:1;" onclick="window.editMember('${u.id}')" title="Editar expediente completo">
              ✏️ Editar Todo
            </button>
            <button class="btn-tactical btn-tactical-sm" style="background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.4); color:#ff5252;" onclick="window.deleteMember('${u.id}')" title="Dar de baja de la unidad">
              🗑️
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

window.editMember = function (id) {
  const users = window.K9Store.getUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;
  document.getElementById('editMemberId').value = u.id;
  document.getElementById('editMemberName').value = u.name;
  document.getElementById('editMemberPlaca').value = u.placa;
  document.getElementById('editMemberRank').value = u.rank || 'Oficial Guía Canino';
  document.getElementById('editMemberAvatar').value = u.avatar || '';
  document.getElementById('editMemberDiscordId').value = u.discordId || '';
  document.getElementById('editMemberIsJefatura').checked = !!u.isJefatura;

  const dogSelect = document.getElementById('editMemberDogSelect');
  if (dogSelect) {
    const dogs = window.K9Store.getDogs();
    dogSelect.innerHTML = `<option value="">Sin can asignado</option>` + dogs.map(d => `
      <option value="${d.id}" ${u.assignedDogId === d.id ? 'selected' : ''}>${d.name} (${d.tag} - ${d.breed})</option>
    `).join('');
  }

  openModal('modalEditMember');
};

window.deleteMember = function (id) {
  const users = window.K9Store.getUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;
  window._pendingDeleteMemberId = id;
  const nameEl = document.getElementById('delMemberName');
  const rankEl = document.getElementById('delMemberRank');
  const placaEl = document.getElementById('delMemberPlaca');
  if (nameEl) nameEl.textContent = u.name;
  if (rankEl) rankEl.textContent = u.rank || 'Agente';
  if (placaEl) placaEl.textContent = 'Placa: #' + (u.placa || '—');
  openModal('modalDeleteMember');
};

window._confirmDeleteMember = function () {
  const id = window._pendingDeleteMemberId;
  if (!id) return;
  closeModal('modalDeleteMember');
  const users = window.K9Store.getUsers();
  const target = users.find(u => u.id === id);
  const remaining = users.filter(u => u.id !== id);

  if (target && target.assignedDogId) {
    const dogs = window.K9Store.getDogs();
    const dog = dogs.find(d => d.id === target.assignedDogId);
    if (dog) {
      dog.handlerId = null;
      dog.handlerName = 'Pendiente de Asignación';
      window.K9Store.save(STORAGE_KEYS.DOGS, dogs);
    }
  }

  if (target && target.discordId) {
    const presets = (window.K9Store.get(STORAGE_KEYS.AGENT_PRESETS) || []).filter(p => p.discordId !== target.discordId);
    window.K9Store.save(STORAGE_KEYS.AGENT_PRESETS, presets);
  }

  window.K9Store.save(STORAGE_KEYS.USERS, remaining);
  if (window.K9CloudSync) window.K9CloudSync.push();
  if (window.K9Webhook) {
    window.K9Webhook.log('logout', 'Miembro Dado de Baja', `Se ha retirado de la plantilla al agente ${target ? target.name : id}.`);
  }
  showToast('Miembro retirado de la unidad K9', 'info');
  if (currentGeneralSubtab === 'miembros') {
    renderMembersDirectory(document.getElementById('generalSubtabContent'));
  }
  if (currentJefaturaSubtab === 'agentes') {
    renderAgentsSection(document.getElementById('jefaturaSubtabContent'));
  }
};

function renderPromotionsSection(container) {
  const promotions = window.K9Store.getPromotions();
  const isJef = window.K9Auth.isJefaturaMember();

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h3 class="font-tactical" style="font-size:1.35rem; color:#fff;">ÓRDENES OFICIALES DE ASCENSO · JEFATURA K9</h3>
        <p style="font-size:0.85rem; color:var(--text-muted);">Decretos de mérito, promociones de rango y escalafón operativo canino</p>
      </div>
      ${isJef ? `
        <button class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="window.openNewPromotionModal()">
          <span>+</span> Publicar Orden de Ascenso
        </button>
      ` : ''}
    </div>

    <div>
      ${promotions.length > 0 ? promotions.map(p => `
        <div class="promotion-decree-card">
          <img src="assets/images/emblem.jpg" class="promotion-seal" alt="Sello K9">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-family:var(--font-tactical); font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:4px; background:rgba(255,183,3,0.2); color:var(--tactical-gold); border:1px solid var(--tactical-gold); font-weight:700;">
                🎖️ ORDEN DE ASCENSO OFICIAL
              </span>
              <span style="font-size:0.8rem; color:var(--text-muted);">${p.date}</span>
            </div>
            ${isJef ? `
              <button class="btn-tactical btn-tactical-sm" onclick="window.deletePromotion('${p.id}')" style="background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.4); color:#ff5252; font-size:0.75rem; padding:0.2rem 0.5rem;" title="Retirar orden de ascenso">
                🗑️ Retirar
              </button>
            ` : ''}
          </div>

          <h3 class="font-gobold" style="font-size:1.4rem; color:#fff; margin-bottom:0.25rem;">
            ${p.agentName} <span style="font-size:0.85rem; color:var(--police-cyan); font-family:var(--font-tactical);">[PLACA #${p.placa || 'K9'}]</span>
          </h3>

          <div class="promotion-ranks-flow">
            <span class="rank-flow-pill rank-flow-old">${p.oldRank}</span>
            <span class="rank-flow-arrow">➔</span>
            <span class="rank-flow-pill rank-flow-new">★ ${p.newRank}</span>
          </div>

          <div class="promotion-citation-box">
            "${p.citation}"
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:0.75rem; font-size:0.8rem; color:var(--text-subtle);">
            <span>Promovido por: <strong style="color:var(--tactical-gold);">${p.publishedBy || 'Jefatura de División K9'}</strong></span>
            <span style="font-family:var(--font-headline); letter-spacing:0.05em; color:var(--police-cyan);">CERTIFICADO DE MANDO & ESCALAFÓN</span>
          </div>
        </div>
      `).join('') : `
        <div class="empty-state-box">
          <div class="empty-icon">🎖️</div>
          <h3 class="font-tactical" style="color:#fff; margin-bottom:0.5rem;">SIN ASCENSOS RECIENTES</h3>
          <p style="color:var(--text-muted);">No se han emitido órdenes de ascenso en este período.</p>
        </div>
      `}
    </div>
  `;
}

window.openNewPromotionModal = function () {
  const users = window.K9Store.getUsers();
  const select = document.getElementById('promoAgentSelect');
  if (select) {
    select.innerHTML = '<option value="">Selecciona un agente...</option>' + users.map(u => `
      <option value="${u.id}" data-rank="${u.rank || 'Aspirante K9'}">${u.name} (${u.rank || 'Aspirante'} - #${u.placa || 'K'})</option>
    `).join('');

    select.onchange = function () {
      const opt = select.options[select.selectedIndex];
      const r = opt ? opt.getAttribute('data-rank') || '' : '';
      document.getElementById('promoOldRank').value = r;
    };
  }
  document.getElementById('promoCitation').value = '';
  openModal('modalNewPromotion');
};

window.deletePromotion = function (id) {
  const promos = window.K9Store.getPromotions();
  const p = promos.find(x => x.id === id);
  if (!p) return;
  window._pendingDeletePromoId = id;
  const agEl = document.getElementById('delPromoAgent');
  const rkEl = document.getElementById('delPromoRanks');
  if (agEl) agEl.textContent = p.agentName;
  if (rkEl) rkEl.textContent = p.oldRank + ' ➔ ' + p.newRank;
  openModal('modalDeletePromotion');
};

window._confirmDeletePromotion = function () {
  const id = window._pendingDeletePromoId;
  if (!id) return;
  closeModal('modalDeletePromotion');
  const promos = window.K9Store.getPromotions().filter(x => x.id !== id);
  window.K9Store.save(STORAGE_KEYS.PROMOTIONS, promos);
  if (window.K9CloudSync) window.K9CloudSync.push();
  showToast('Publicación de ascenso retirada', 'info');
  renderPromotionsSection(document.getElementById('generalSubtabContent'));
};

function renderDecorationsSection(container) {
  const badges = window.K9Store.getBadges();
  const users = window.K9Store.getUsers();

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h3 class="font-tactical" style="font-size:1.35rem; color:#fff;">MEDALLERO DE HONOR & CONDECORACIONES K9</h3>
      <p style="font-size:0.85rem; color:var(--text-muted);">Registro de condecoraciones, cruces al mérito y distintivos concedidos a los agentes de la unidad</p>
    </div>

    <div style="display:flex; flex-direction:column; gap:1.75rem;">
      ${badges.map(b => {
        const recipients = users.filter(u => (u.badges || []).includes(b.id));
        return `
          <div style="background:var(--bg-surface); border:1px solid var(--border-gold); border-radius:14px; padding:1.5rem; box-shadow:var(--shadow-elevation);">
            <div style="display:flex; gap:1.25rem; align-items:flex-start; flex-wrap:wrap; margin-bottom:1.25rem;">
              <img src="${b.image || 'assets/images/medal_valor.jpg'}" style="width:75px; height:75px; object-fit:contain; filter:drop-shadow(0 4px 12px rgba(255,183,3,0.3)); cursor:pointer;" alt="${b.name}" onclick="window.inspectBadgeModal('${b.id}', 'Honores K9')">
              <div style="flex:1; min-width:260px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.3rem;">
                  <h4 class="font-gobold" style="font-size:1.25rem; color:#fff;">${b.name}</h4>
                  <span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--tactical-gold); background:rgba(255,183,3,0.15); border:1px solid var(--tactical-gold); padding:0.2rem 0.6rem; border-radius:20px; text-transform:uppercase;">${b.category}</span>
                </div>
                <p style="font-size:0.88rem; color:var(--text-muted); line-height:1.5;">${b.desc}</p>
              </div>
            </div>

            <div style="background:rgba(0,0,0,0.35); border-radius:10px; padding:1rem;">
              <div style="font-size:0.78rem; font-family:var(--font-tactical); color:var(--police-cyan); letter-spacing:0.06em; margin-bottom:0.75rem;">
                AGENTES QUE PORTAN ESTA CONDECORACIÓN (${recipients.length}):
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:0.75rem;">
                ${recipients.length > 0 ? recipients.map(r => `
                  <div style="display:flex; align-items:center; gap:0.75rem; background:rgba(16,24,43,0.8); border:1px solid var(--border-subtle); border-radius:8px; padding:0.6rem 0.85rem;">
                    <img src="${r.avatar || 'assets/images/emblem.jpg'}" style="width:36px; height:36px; border-radius:8px; object-fit:cover; border:1px solid var(--police-cyan);" alt="${r.name}" onerror="this.src='assets/images/emblem.jpg'">
                    <div>
                      <strong style="color:#fff; font-size:0.88rem; display:block;">${r.name}</strong>
                      <span style="font-size:0.75rem; color:var(--police-cyan); font-family:var(--font-tactical);">${r.rank} [#${r.placa}]</span>
                    </div>
                  </div>
                `).join('') : '<span style="font-size:0.82rem; color:var(--text-subtle); font-style:italic;">Ningún agente ha recibido esta distinción todavía.</span>'}
              </div>
            </div>
          </div>
        `;
      }).join('')}
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

  // Si el usuario no tiene rango asignado por Jefatura, bloquear Mi Perfil
  if (!user.isVerified || user.rank === 'Sin Rango Asignado' || (typeof user.rank === 'string' && user.rank.includes('Pendiente'))) {
    container.innerHTML = `
      <div class="empty-state-box" style="margin:3rem auto; max-width:620px; border:1px solid rgba(255,183,3,0.35); background:rgba(18,24,38,0.95); padding:2.5rem 2rem; box-shadow:0 10px 40px rgba(0,0,0,0.5);">
        <div class="empty-icon" style="font-size:3rem; margin-bottom:0.75rem;">🔒</div>
        <h3 class="font-tactical" style="color:var(--tactical-gold); margin-bottom:0.5rem; font-size:1.35rem;">EXPEDIENTE EN ESPERA DE ASIGNACIÓN</h3>
        <p style="color:#fff; font-size:0.95rem; margin-bottom:0.5rem;">
          Bienvenido, <strong>${user.name}</strong> (@${user.discordUsername}).
        </p>
        <p style="color:var(--text-muted); font-size:0.86rem; line-height:1.6; margin-bottom:1.5rem;">
          Has verificado tu cuenta con Discord correctamente, pero tu ficha policial <strong>aún no tiene un rango oficial ni placa asignada por la Jefatura K9</strong>.<br>
          Hasta que un mando registre tu alta en el cuerpo, tu perfil operativo permanecerá bloqueado.
        </p>
        <div style="background:rgba(0,0,0,0.4); border:1px dashed var(--border-tactical); border-radius:8px; padding:1.2rem; margin-bottom:1.5rem; text-align:center;">
          <div style="font-size:0.72rem; color:var(--text-subtle); letter-spacing:0.08em; margin-bottom:0.4rem;">TU DISCORD ID OFICIAL (ENTREGA ESTE CÓDIGO A JEFATURA):</div>
          <div style="display:flex; align-items:center; justify-content:center; gap:0.6rem; flex-wrap:wrap; margin-bottom:0.4rem;">
            <code style="font-family:var(--font-mono); font-size:1.25rem; color:var(--police-cyan); font-weight:700; background:rgba(0,229,255,0.1); padding:0.3rem 0.8rem; border-radius:6px; letter-spacing:0.05em;">${user.discordId}</code>
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="navigator.clipboard.writeText('${user.discordId}'); showToast('Discord ID copiado al portapapeles', 'success');">
              📋 Copiar ID
            </button>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">
            Jefatura entrará en "Apartado Agentes" y asignará este ID con tu rango oficial y placa.
          </span>
        </div>
        <div style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap;">
          <button class="btn-tactical btn-tactical-primary btn-tactical-sm" onclick="switchGeneralSubtab('normativas')">
            ⚖️ Ver Normativas Oficiales
          </button>
          <button class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="switchGeneralSubtab('galeria')">
            🐕 Plantilla de Canes K9
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Buscar perro asignado y sus medallas
  const allDogs = window.K9Store.getDogs();
  const assignedDog = allDogs.find(d => d.id === user.assignedDogId);

  const allBadges = window.K9Store.getBadges();
  const userBadges = (user.badges || []).map(bId => allBadges.find(b => b.id === bId)).filter(Boolean);

  // Expedientes disciplinarios del miembro (ÚNICAMENTE faltas públicas/notificadas; expedientes internos son confidenciales de Jefatura y NO le saldrán al miembro)
  const allDisciplinary = window.K9Store.getDisciplinary();
  const userSanctions = allDisciplinary.filter(d =>
    d.agentId === user.id &&
    d.category !== 'expediente_interno' &&
    !d.isInternal
  );

  if (currentProfileSubtab === 'despacho') {
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

      <!-- Sub-Navegación Interna de Mi Perfil -->
      <div class="subnav-tabs-row" style="margin-bottom: 1.5rem;">
        <button class="subnav-pill-btn" onclick="window.switchProfileSubtab('ficha')">
          🪪 Mi Ficha Policial & Binomio
        </button>
        <button class="subnav-pill-btn active" onclick="window.switchProfileSubtab('despacho')">
          💬 Despacho con Jefatura
        </button>
      </div>

      <div id="profileDispatchContainer" style="margin-top: 1rem;"></div>
    `;
    const dispatchEl = document.getElementById('profileDispatchContainer');
    if (dispatchEl) renderChatSection(dispatchEl);
    return;
  }

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

    <!-- Sub-Navegación Interna de Mi Perfil -->
    <div class="subnav-tabs-row" style="margin-bottom: 1.5rem;">
      <button class="subnav-pill-btn active" onclick="window.switchProfileSubtab('ficha')">
        🪪 Mi Ficha Policial & Binomio
      </button>
      <button class="subnav-pill-btn" onclick="window.switchProfileSubtab('despacho')">
        💬 Despacho con Jefatura
      </button>
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

        <!-- Historial Disciplinario del Miembro (Solo faltas notificadas; los expedientes internos NO se muestran aquí) -->
        <div class="member-badges-container" style="margin-top:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
            <div>
              <h3 class="font-tactical" style="font-size:1.15rem; color:#fff;">⚖️ RÉGIMEN DISCIPLINARIO Y FALTAS</h3>
              <span style="font-family:var(--font-headline); font-size:0.75rem; color:var(--text-muted); letter-spacing:0.06em;">HISTORIAL DISCIPLINARIO OFICIAL NOTIFICADO</span>
            </div>
            <span style="font-family:var(--font-tactical); font-size:0.85rem; color:${userSanctions.length > 0 ? 'var(--tactical-red)' : 'var(--tactical-green)'}; background:${userSanctions.length > 0 ? 'rgba(255,42,95,0.15)' : 'rgba(0,230,118,0.1)'}; border:1px solid currentColor; padding:0.25rem 0.75rem; border-radius:20px;">
              ${userSanctions.length > 0 ? `${userSanctions.length} FALTAS NOTIFICADAS` : 'EXPEDIENTE LIMPIO ✓'}
            </span>
          </div>

          ${userSanctions.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              ${userSanctions.map(s => `
                <div style="background:rgba(18,24,38,0.85); border:1px solid ${s.type === 'Muy Grave' ? 'rgba(255,42,95,0.4)' : 'rgba(255,183,3,0.3)'}; border-left:4px solid ${s.type === 'Muy Grave' ? 'var(--tactical-red)' : s.type === 'Grave' ? 'var(--tactical-amber)' : 'var(--tactical-gold)'}; border-radius:8px; padding:1rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; flex-wrap:wrap; gap:0.5rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                      <span style="font-family:var(--font-tactical); font-weight:700; color:#fff; font-size:0.9rem;">Falta ${s.type}</span>
                      <span style="font-size:0.75rem; color:var(--text-subtle);">${s.date}</span>
                    </div>
                    <span style="font-family:var(--font-tactical); font-size:0.75rem; color:${s.status === 'Cumplida' ? 'var(--tactical-green)' : 'var(--tactical-red)'}; background:${s.status === 'Cumplida' ? 'rgba(0,230,118,0.1)' : 'rgba(255,42,95,0.1)'}; padding:0.15rem 0.5rem; border-radius:4px; border:1px solid currentColor;">
                      ${s.status}
                    </span>
                  </div>
                  <div style="font-size:0.85rem; color:var(--text-main); margin-bottom:0.5rem; line-height:1.4;">
                    <strong>Hechos:</strong> ${s.reason}
                  </div>
                  <div style="font-size:0.8rem; color:var(--police-cyan); background:rgba(0,229,255,0.06); padding:0.4rem 0.6rem; border-radius:4px; border:1px solid rgba(0,229,255,0.15);">
                    ⚖️ <strong>Sanción impuesta:</strong> ${s.sanction} · <span style="color:var(--text-subtle);">Oficial sancionador: ${s.issuedBy}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state-box" style="margin-top:0.75rem; padding:1.5rem 1rem; border-color:rgba(0,230,118,0.25);">
              <div class="empty-icon" style="color:var(--tactical-green); font-size:2rem;">🛡️</div>
              <h4 class="font-tactical" style="color:#fff; margin-bottom:0.3rem;">EXPEDIENTE DISCIPLINARIO INMACULADO</h4>
              <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">
                No constan infracciones ni faltas disciplinarias registradas en tu historial policial K9.
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

window.switchProfileSubtab = function (tab) {
  currentProfileSubtab = tab;
  if (window.K9Audio) window.K9Audio.playTacticalClick();
  renderMemberProfile();
};

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
            <button class="btn-tactical btn-tactical-gold" onclick="window.promptClaimJefatura()">
              🔑 Reclamar Jefatura (Mando Fundador)
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

  // Función para reclamar Jefatura con clave maestra
  window.promptClaimJefatura = function () {
    const code = prompt('Introduce la Clave Maestra de Mando para acreditar esta cuenta como Jefe de División K9:\n\n(Clave oficial: K9-MANDO-2026)');
    if (!code) return;
    const res = window.K9Auth.claimMasterJefatura(code);
    if (res.ok) {
      if (window.K9Audio) window.K9Audio.playRadioChirp();
      showToast(res.msg, 'success');
      setupAuthUI();
      checkJefaturaAccessAndRender();
    } else {
      if (window.K9Audio) window.K9Audio.playAlert();
      showToast(res.msg, 'warning');
    }
  };

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
      <button class="subnav-pill-btn jefatura-subnav ${currentJefaturaSubtab === 'logs' ? 'active' : ''}" data-subtab="logs">
        📋 Registro de Logs
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
  const isJef = window.K9Auth.isJefaturaMember();
  return reports.map(r => `
    <tr style="${r.isConfidential ? 'background:rgba(255,42,95,0.03);' : ''}">
      <td>
        <strong style="color:#fff;">${r.week}</strong>
        <div style="font-size:0.75rem; color:var(--text-muted);">${r.date}</div>
        ${r.isConfidential ? '<div style="margin-top:0.25rem;"><span style="font-family:var(--font-tactical); font-size:0.68rem; padding:0.15rem 0.4rem; border-radius:4px; background:rgba(255,42,95,0.18); color:var(--tactical-red); border:1px solid rgba(255,42,95,0.4); font-weight:700;">🔒 CONFIDENCIAL</span></div>' : ''}
      </td>
      <td>
        <span style="font-family:var(--font-tactical); font-weight:600; color:var(--police-cyan);">${r.agentName}</span>
      </td>
      <td>${r.dogName}</td>
      <td><span style="font-family:var(--font-tactical); font-weight:700;">${r.patrolHours} hrs</span></td>
      <td>
        <div><strong>${r.canineInterventions}</strong> intervenciones (${r.canineAlerts} alertas)</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${r.seizures || '—'}</div>
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
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
          ${!r.status.includes('Aprobado') ? `
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="approveReport('${r.id}')" title="Aprobar Informe">
              ✓ Aprobar
            </button>
          ` : ''}
          <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="viewReportDetails('${r.id}')" title="Ver detalles tácticos">
            👁️
          </button>
          ${isJef ? `
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="toggleReportConfidential('${r.id}')" title="${r.isConfidential ? 'Desmarcar confidencial' : 'Marcar confidencial para jefatura'}" style="font-size:0.75rem;">
              ${r.isConfidential ? '🔓 Público' : '🔒 Confidencial'}
            </button>
            <button class="btn-tactical btn-tactical-sm" onclick="deleteReport('${r.id}')" style="background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.4); color:#ff5252;" title="Eliminar informe semanal">
              🗑️
            </button>
          ` : ''}
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
  if (!rep) return;
  const body = document.getElementById('modalViewReportBody');
  if (body) {
    body.innerHTML = `
      <div style="background:rgba(16,24,43,0.85); border:1px solid var(--border-tactical); border-radius:12px; padding:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem; border-bottom:1px solid var(--border-subtle); padding-bottom:0.75rem;">
          <div>
            <h3 style="font-family:var(--font-headline); font-size:1.2rem; color:#fff; margin-bottom:0.2rem;">${rep.agentName}</h3>
            <span style="font-family:var(--font-tactical); font-size:0.8rem; color:var(--police-cyan);">${rep.week} · Fecha: ${rep.date}</span>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            ${rep.isConfidential ? '<span style="font-family:var(--font-tactical); font-size:0.72rem; padding:0.2rem 0.5rem; border-radius:4px; background:rgba(255,42,95,0.2); color:var(--tactical-red); border:1px solid var(--tactical-red); font-weight:700;">🔒 CONFIDENCIAL JEFATURA</span>' : '<span style="font-family:var(--font-tactical); font-size:0.72rem; padding:0.2rem 0.5rem; border-radius:4px; background:rgba(0,230,118,0.15); color:var(--tactical-green); border:1px solid rgba(0,230,118,0.3);">🌐 PÚBLICO</span>'}
            <span style="font-family:var(--font-tactical); font-size:0.72rem; padding:0.2rem 0.5rem; border-radius:4px; background:rgba(255,183,3,0.15); color:var(--tactical-gold); border:1px solid rgba(255,183,3,0.3); font-weight:700;">${rep.status}</span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:0.75rem; background:rgba(0,0,0,0.35); padding:0.85rem; border-radius:8px; margin-bottom:1.25rem;">
          <div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">CAN OPERATIVO</span><strong style="color:#fff; font-size:0.9rem;">${rep.dogName || '—'}</strong></div>
          <div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">HORAS PATRULLA</span><strong style="color:var(--police-cyan); font-size:0.9rem;">${rep.patrolHours} hrs</strong></div>
          <div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">ALERTAS CANINAS</span><strong style="color:#fff; font-size:0.9rem;">${rep.canineAlerts || 0}</strong></div>
          <div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">INTERVENCIONES</span><strong style="color:#fff; font-size:0.9rem;">${rep.canineInterventions || 0}</strong></div>
          <div><span style="font-size:0.72rem; color:var(--text-muted); display:block;">EVALUACIÓN</span><strong style="color:var(--tactical-gold); font-size:0.85rem;">${rep.rating || '—'}</strong></div>
        </div>

        <div style="margin-bottom:1rem;">
          <div style="font-size:0.75rem; color:var(--tactical-gold); font-weight:700; letter-spacing:0.06em; margin-bottom:0.35rem;">INCAUTACIONES O SUSTANCIAS LOCALIZADAS</div>
          <div style="font-size:0.88rem; color:var(--text-main); background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); padding:0.6rem 0.85rem; border-radius:6px;">${rep.seizures || 'Sin incautaciones registradas en este período.'}</div>
        </div>

        <div style="margin-bottom:1rem;">
          <div style="font-size:0.75rem; color:var(--police-cyan); font-weight:700; letter-spacing:0.06em; margin-bottom:0.35rem;">DETALLE DE ACTUACIONES OPERATIVAS & CONDUCTA</div>
          <div style="font-size:0.88rem; color:var(--text-main); line-height:1.5; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); padding:0.75rem 0.85rem; border-radius:6px; white-space:pre-line;">${rep.notes || '—'}</div>
        </div>

        <div style="border-top:1px solid var(--border-subtle); padding-top:0.75rem; display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-subtle);">
          <span>Firma de Validación: <strong style="color:var(--text-muted);">${rep.signedBy || 'Pendiente'}</strong></span>
          <span>Unidad K9 LSPD</span>
        </div>
      </div>
    `;
  }
  openModal('modalViewReport');
};

window.deleteReport = function (reportId) {
  const reports = window.K9Store.getReports();
  const rep = reports.find(r => r.id === reportId);
  if (!rep) return;
  window._pendingDeleteReportId = reportId;
  const agEl = document.getElementById('delReportAgent');
  const wkEl = document.getElementById('delReportWeek');
  const dgEl = document.getElementById('delReportDog');
  const ptEl = document.getElementById('delReportPatrol');
  if (agEl) agEl.textContent = rep.agentName;
  if (wkEl) wkEl.textContent = rep.week;
  if (dgEl) dgEl.textContent = 'Can K9: ' + rep.dogName;
  if (ptEl) ptEl.textContent = 'Horas patrulladas: ' + rep.patrolHours + ' hrs';
  openModal('modalDeleteReport');
};

window._confirmDeleteReport = function () {
  const id = window._pendingDeleteReportId;
  if (!id) return;
  closeModal('modalDeleteReport');
  const reports = window.K9Store.getReports().filter(r => r.id !== id);
  window.K9Store.save(STORAGE_KEYS.REPORTS, reports);
  if (window.K9CloudSync) window.K9CloudSync.push();
  if (window.K9Webhook) {
    const user = window.K9Auth.getCurrentUser();
    window.K9Webhook.log('report', 'Informe Semanal Eliminado', `Jefatura retiró el informe ${id}.`, [
      { name: 'Mando', value: user ? user.name : 'Jefatura K9', inline: true }
    ]);
  }
  showToast('Informe semanal eliminado definitivamente', 'info');
  renderJefaturaSubtab('informes');
};

window.toggleReportConfidential = function (reportId) {
  const reports = window.K9Store.getReports();
  const rep = reports.find(r => r.id === reportId);
  if (!rep) return;
  rep.isConfidential = !rep.isConfidential;
  window.K9Store.save(STORAGE_KEYS.REPORTS, reports);
  if (window.K9CloudSync) window.K9CloudSync.push();
  showToast(rep.isConfidential ? 'Informe marcado como CONFIDENCIAL para Jefatura' : 'Informe marcado como PÚBLICO', 'info');
  renderJefaturaSubtab('informes');
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
  const pendingDiscordUsers = users.filter(u => !u.isVerified || u.rank === 'Sin Rango Asignado' || (typeof u.rank === 'string' && u.rank.includes('Pendiente')));

  container.innerHTML = `
    <!-- 0. LISTA DE USUARIOS AUTENTICADOS CON DISCORD EN ESPERA DE ASIGNACIÓN DE RANGO -->
    <div style="margin-bottom:1.5rem; background:rgba(18,24,38,0.95); border:1px solid ${pendingDiscordUsers.length > 0 ? 'var(--tactical-gold)' : 'var(--border-subtle)'}; border-radius:10px; padding:1.25rem; box-shadow:0 4px 20px rgba(0,0,0,0.35);">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="font-size:1.4rem;">👥</span>
          <div>
            <h3 class="font-tactical" style="font-size:1.05rem; margin:0; color:${pendingDiscordUsers.length > 0 ? 'var(--tactical-gold)' : '#fff'};">
              USUARIOS AUTENTICADOS CON DISCORD (${users.length} TOTAL / ${pendingDiscordUsers.length} PENDIENTES DE RANGO)
            </h3>
            <span style="font-size:0.75rem; color:var(--text-muted);">
              Listado en tiempo real de todos los agentes que han iniciado sesión con su cuenta de Discord en el portal K9
            </span>
          </div>
        </div>
        <span style="font-family:var(--font-tactical); font-size:0.8rem; padding:0.25rem 0.75rem; border-radius:12px; background:${pendingDiscordUsers.length > 0 ? 'rgba(255,183,3,0.2)' : 'rgba(0,230,118,0.15)'}; color:${pendingDiscordUsers.length > 0 ? 'var(--tactical-gold)' : 'var(--tactical-green)'}; border:1px solid currentColor; font-weight:700;">
          ${pendingDiscordUsers.length > 0 ? `⚠️ ${pendingDiscordUsers.length} EN ESPERA DE RANGO` : '✓ TODOS ASIGNADOS'}
        </span>
      </div>

      ${pendingDiscordUsers.length > 0 ? `
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:0.75rem; margin-top:0.75rem;">
          ${pendingDiscordUsers.map(u => `
            <div style="background:rgba(255,183,3,0.06); border:1px solid rgba(255,183,3,0.35); border-radius:8px; padding:0.9rem; display:flex; justify-content:space-between; align-items:center; gap:0.75rem;">
              <div style="display:flex; align-items:center; gap:0.75rem; min-width:0;">
                <img src="${u.avatar}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid var(--tactical-gold);" alt="${u.name}" onerror="this.src='assets/images/emblem.jpg'">
                <div style="min-width:0;">
                  <strong style="color:#fff; font-family:var(--font-tactical); font-size:0.95rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${u.name}</strong>
                  <div style="font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:0.3rem;">
                    <span>@${u.discordUsername || '—'}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:0.4rem; margin-top:0.2rem;">
                    <code style="font-size:0.72rem; color:#a5b4fc; background:rgba(88,101,242,0.15); padding:0.1rem 0.35rem; border-radius:4px; font-family:var(--font-mono);">${u.discordId || '—'}</code>
                    <button class="btn-tactical btn-tactical-outline btn-tactical-sm" style="font-size:0.65rem; padding:0.1rem 0.35rem;" onclick="navigator.clipboard.writeText('${u.discordId}'); showToast('Discord ID copiado', 'info');" title="Copiar Discord ID">📋</button>
                  </div>
                </div>
              </div>
              <button class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="window.editAgentRank('${u.id}')" style="white-space:nowrap; font-weight:700; padding:0.45rem 0.75rem;">
                🎖️ Dar Rango
              </button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div style="padding:0.75rem 1rem; background:rgba(0,0,0,0.2); border-radius:6px; font-size:0.85rem; color:var(--text-muted); text-align:center;">
          ✓ Todos los usuarios que han entrado con Discord disponen actualmente de un rango oficial y placa asignados.
        </div>
      `}
    </div>

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
        existingUser.isVerified = true;
        existingUser.permissions = isJefaturaVal ? ['*'] : [];
        existingUser.serviceStatus = isJefaturaVal ? 'En Activo / Mando' : 'En Activo';
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

      // Limpiar el formulario sin re-renderizar toda la pestaña (evita el "flash")
      formPreset.reset();

      // Actualizar únicamente la tabla de agentes y la lista de presets en el DOM
      const tbodyEl = document.getElementById('agentsTableBody');
      if (tbodyEl) {
        const freshUsers = window.K9Store.getUsers();
        const freshDogs  = window.K9Store.getDogs();
        tbodyEl.innerHTML = renderAgentsTableRows(freshUsers, freshDogs);
      }
      // Re-renderizar solo si hay cambio visual importante (presets añadidos)
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
          ${(!u.isVerified || u.rank === 'Sin Rango Asignado') ? `
            <span style="font-family:var(--font-headline); letter-spacing:0.05em; color:var(--tactical-gold); background:rgba(255,183,3,0.15); border:1px solid var(--border-gold); padding:0.2rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:700; display:inline-block;">
              ⚠️ PENDIENTE DE RANGO
            </span>
          ` : `
            <span style="font-family:var(--font-headline); letter-spacing:0.05em; color:${u.isJefatura ? 'var(--tactical-gold)' : 'var(--text-main)'}; font-size:0.85rem;">
              ${u.rank}
            </span>
          `}
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            <span style="font-size:0.78rem; color:#a5b4fc; background:rgba(88,101,242,0.15); padding:0.15rem 0.4rem; border-radius:4px; font-family:var(--font-mono);">
              ${u.discordId || '—'}
            </span>
            <small style="color:var(--text-muted); font-size:0.7rem;">@${u.discordUsername || '—'}</small>
          </div>
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
          <span style="font-family:var(--font-tactical); font-size:0.75rem; color:${(!u.isVerified || u.rank === 'Sin Rango Asignado') ? 'var(--tactical-gold)' : 'var(--tactical-green)'}; background:${(!u.isVerified || u.rank === 'Sin Rango Asignado') ? 'rgba(255,183,3,0.12)' : 'rgba(0,230,118,0.1)'}; border:1px solid currentColor; padding:0.2rem 0.5rem; border-radius:15px;">
            ${u.serviceStatus || 'En Espera'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <button class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="editAgentRank('${u.id}')" title="Modificar rango y permisos">
              ${(!u.isVerified || u.rank === 'Sin Rango Asignado') ? '🎖️ Asignar Rango' : '🎖️ Rango'}
            </button>
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="editAgentDogAssignment('${u.id}')" title="Asignar o cambiar can">
              🐕 Can
            </button>
            <button class="btn-tactical btn-tactical-sm" onclick="removeAgentFromRoster('${u.id}')" title="Expulsar agente de la unidad" style="background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.4); color:#ff5252; font-weight:700;">
              🚫 Expulsar
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.editAgentRank = function (userId) {
  const users = window.K9Store.getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;

  const RANKS = [
    { value: 'Aspirante K9',        label: '🔰 Aspirante K9',         color: '#94a3b8' },
    { value: 'Oficial Guía K9',     label: '🐾 Oficial Guía K9',      color: '#38bdf8' },
    { value: 'Oficial Mayor K9',    label: '🐾 Oficial Mayor K9',     color: '#22d3ee' },
    { value: 'Instructor Guía K9',  label: '🎓 Instructor Guía K9',   color: '#34d399' },
    { value: 'Subinspector K9',     label: '⭐ Subinspector K9',      color: '#a78bfa' },
    { value: 'Inspector K9',        label: '⭐⭐ Inspector K9',        color: '#f59e0b' },
    { value: 'Jefe de División K9', label: '🦅 Jefe de División K9',  color: '#fbbf24' }
  ];

  // Crear modal inline de cambio de rango
  const existing = document.getElementById('modalEditRank');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modalEditRank';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(5,9,20,0.85);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn 0.18s ease';

  overlay.innerHTML = `
    <div style="background:linear-gradient(135deg,#0d1424,#111827);border:1px solid rgba(0,229,255,0.25);border-radius:14px;padding:2rem;width:100%;max-width:480px;box-shadow:0 25px 60px rgba(0,0,0,0.7);position:relative;">
      <button id="closeEditRankModal" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:#64748b;font-size:1.4rem;cursor:pointer;line-height:1;">&times;</button>
      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#00e5ff22,#7c3aed22);border:1px solid rgba(0,229,255,0.3);display:flex;align-items:center;justify-content:center;font-size:1.4rem;">🎖️</div>
        <div>
          <h3 style="margin:0;color:#fff;font-family:var(--font-tactical);font-size:1.05rem;letter-spacing:0.04em;">CAMBIAR RANGO OFICIAL</h3>
          <p style="margin:0;font-size:0.78rem;color:var(--text-muted);">Agente: <span style="color:var(--police-cyan);font-weight:600;">${user.name}</span> · <span style="color:#a5b4fc;font-family:var(--font-mono);">${user.discordId || user.discordUsername || ''}</span></p>
        </div>
      </div>

      <div style="margin-bottom:1rem;">
        <label style="display:block;font-family:var(--font-headline);font-size:0.7rem;color:var(--police-cyan);letter-spacing:0.06em;margin-bottom:0.5rem;">RANGO OFICIAL</label>
        <div id="rankPickerGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;">
          ${RANKS.map(r => `
            <button type="button" class="rank-pick-btn" data-rank="${r.value}" style="
              display:flex;align-items:center;gap:0.5rem;padding:0.55rem 0.75rem;
              background:${user.rank === r.value ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.04)'};
              border:1px solid ${user.rank === r.value ? 'var(--police-cyan)' : 'rgba(255,255,255,0.1)'};
              border-radius:8px;color:${r.color};font-size:0.82rem;cursor:pointer;
              font-family:var(--font-headline);text-align:left;transition:all 0.15s;
            ">${r.label}</button>
          `).join('')}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
        <div>
          <label style="display:block;font-family:var(--font-headline);font-size:0.7rem;color:var(--police-cyan);letter-spacing:0.06em;margin-bottom:0.35rem;">PLACA OFICIAL</label>
          <input type="text" id="editRankPlaca" value="${user.placa || ''}" placeholder="Ej: K-07" style="width:100%;padding:0.5rem 0.75rem;background:rgba(10,14,23,0.8);border:1px solid var(--border-tactical);border-radius:6px;color:#fff;font-family:var(--font-headline);font-size:0.85rem;box-sizing:border-box;">
        </div>
        <div style="display:flex;align-items:flex-end;">
          <label style="display:flex;align-items:center;gap:0.5rem;font-size:0.82rem;color:#fff;cursor:pointer;padding-bottom:0.5rem;">
            <input type="checkbox" id="editRankIsJef" ${user.isJefatura ? 'checked' : ''} style="accent-color:var(--tactical-gold);width:16px;height:16px;">
            <span>Permisos de Jefatura</span>
          </label>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;">
        <button id="cancelEditRank" type="button" class="btn-tactical btn-tactical-outline" style="flex:1;justify-content:center;">Cancelar</button>
        <button id="confirmEditRank" type="button" class="btn-tactical btn-tactical-gold" style="flex:1;justify-content:center;">💾 Guardar Rango</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Estado de selección de rango
  let selectedRank = user.rank || 'Oficial Guía K9';

  // Click en tarjetas de rango
  overlay.querySelectorAll('.rank-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedRank = btn.dataset.rank;
      overlay.querySelectorAll('.rank-pick-btn').forEach(b => {
        b.style.background = 'rgba(255,255,255,0.04)';
        b.style.border = '1px solid rgba(255,255,255,0.1)';
      });
      btn.style.background = 'rgba(0,229,255,0.15)';
      btn.style.border = '1px solid var(--police-cyan)';
      if (window.K9Audio) window.K9Audio.playTacticalClick();
    });
  });

  // Cerrar modal
  const closeModal = () => overlay.remove();
  document.getElementById('closeEditRankModal').addEventListener('click', closeModal);
  document.getElementById('cancelEditRank').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  // Confirmar cambio
  document.getElementById('confirmEditRank').addEventListener('click', () => {
    const newPlaca = document.getElementById('editRankPlaca').value.trim();
    const isJef   = document.getElementById('editRankIsJef').checked;

    if (!newPlaca) { showToast('Introduce una placa válida.', 'warning'); return; }

    user.rank          = selectedRank;
    user.placa         = newPlaca;
    user.isJefatura    = isJef;
    user.isVerified    = true;
    user.permissions   = isJef ? ['*'] : [];
    user.serviceStatus = isJef ? 'En Activo / Mando' : 'En Activo';
    window.K9Store.save(STORAGE_KEYS.USERS, users);

    // Persistir preset para futuros logins
    if (user.discordId) {
      const presets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];
      const cleanPresets = presets.filter(p => p.discordId !== user.discordId);
      cleanPresets.push({
        discordId: user.discordId,
        discordUsername: user.discordUsername,
        placa: user.placa,
        rank: user.rank,
        isJefatura: user.isJefatura,
        permissions: user.permissions,
        serviceStatus: user.serviceStatus,
        createdAt: new Date().toLocaleDateString('es-ES')
      });
      window.K9Store.save(STORAGE_KEYS.AGENT_PRESETS, cleanPresets);
    }

    // Log webhook
    if (window.K9Webhook) {
      const admin = window.K9Auth.getCurrentUser();
      if (admin) {
        window.K9Webhook.sendLog({
          title: '🎖️ Rango de Agente Modificado',
          color: 0xfbbf24,
          fields: [
            { name: 'Mando', value: admin.name + ' (' + admin.placa + ')', inline: true },
            { name: 'Agente', value: user.name, inline: true },
            { name: 'Nuevo Rango', value: selectedRank + ' [' + newPlaca + ']', inline: true },
            { name: 'Jefatura', value: isJef ? 'Sí ✅' : 'No', inline: true }
          ]
        });
      }
    }

    if (window.K9Audio) window.K9Audio.playTacticalBeep(1000, 0.12);
    showToast(`✅ Rango actualizado para ${user.name}: ${selectedRank} [${newPlaca}]`, 'success');
    closeModal();
    renderJefaturaSubtab('agentes');
  });
};

// ─── Expulsar agente de la unidad (revocar rango y eliminar de la lista) ───
window.removeAgentFromRoster = function (userId) {
  const users = window.K9Store.getUsers();
  const user  = users.find(u => u.id === userId);
  if (!user) return;

  // Confirmación rápida con modal inline
  const existing = document.getElementById('modalKickAgent');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'modalKickAgent';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(5,9,20,0.85);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
  overlay.innerHTML = `
    <div style="background:linear-gradient(135deg,#0d1424,#1a0a0a);border:1px solid rgba(255,59,48,0.35);border-radius:14px;padding:2rem;width:100%;max-width:420px;box-shadow:0 25px 60px rgba(0,0,0,0.7);text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:0.75rem;">⚠️</div>
      <h3 style="margin:0 0 0.5rem;color:#ff5252;font-family:var(--font-tactical);font-size:1.1rem;">EXPULSAR AGENTE</h3>
      <p style="color:var(--text-muted);font-size:0.88rem;margin-bottom:1.5rem;line-height:1.5;">
        ¿Estás seguro de que quieres <strong style="color:#ff5252;">expulsar</strong> a
        <strong style="color:#fff;">${user.name}</strong> [${user.placa}] de la Unidad K9?<br>
        <small style="color:#64748b;">Se revocará su rango y dejará de tener acceso.</small>
      </p>
      <div style="display:flex;gap:0.75rem;">
        <button id="cancelKick" class="btn-tactical btn-tactical-outline" style="flex:1;justify-content:center;">Cancelar</button>
        <button id="confirmKick" class="btn-tactical btn-tactical-sm" style="flex:1;justify-content:center;background:rgba(255,59,48,0.15);border:1px solid rgba(255,59,48,0.5);color:#ff5252;font-weight:700;">🚫 Expulsar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeK = () => overlay.remove();
  document.getElementById('cancelKick').addEventListener('click', closeK);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeK(); });

  document.getElementById('confirmKick').addEventListener('click', () => {
    // 0. Registrar permanentemente como expulsado (tombstone para que la sincronización en la nube nunca lo resucite)
    window.K9Store.addExpelledUserId(user.id, user.discordId);

    // 1. Quitar de la lista de usuarios
    const remainingUsers = window.K9Store.getUsers().filter(u => u.id !== user.id && (!user.discordId || u.discordId !== user.discordId));
    window.K9Store.save(STORAGE_KEYS.USERS, remainingUsers);

    // 2. Eliminar su preset para que no pueda recuperar el rango en el próximo login
    if (user.discordId) {
      const presets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];
      const cleaned = presets.filter(p => p.discordId !== user.discordId);
      window.K9Store.save(STORAGE_KEYS.AGENT_PRESETS, cleaned);
    }

    // 3. Si tenía un can asignado, liberarlo
    if (user.assignedDogId) {
      const dogs = window.K9Store.getDogs();
      const dog  = dogs.find(d => d.id === user.assignedDogId);
      if (dog) {
        dog.handlerId   = null;
        dog.handlerName = 'Pendiente de Asignación';
        window.K9Store.save(STORAGE_KEYS.DOGS, dogs);
      }
    }

    // 4. Si el usuario actual es el expulsado, cerrar sesión
    const curr = window.K9Store.getCurrentUser();
    if (curr && (curr.id === user.id || (user.discordId && curr.discordId === user.discordId))) {
      window.K9Store.setCurrentUser(null);
    }

    // 5. Sincronizar inmediatamente con la nube
    if (window.K9CloudSync) {
      window.K9CloudSync.push();
    }

    // 4. Log webhook
    if (window.K9Webhook) {
      const admin = window.K9Auth.getCurrentUser();
      if (admin) {
        window.K9Webhook.sendLog({
          title: '🚫 Agente Expulsado de la Unidad K9',
          color: 0xff3b30,
          fields: [
            { name: 'Mando', value: admin.name + ' (' + admin.placa + ')', inline: true },
            { name: 'Agente Expulsado', value: user.name + ' [' + user.placa + ']', inline: true },
            { name: 'Discord', value: user.discordId || user.discordUsername || '—', inline: true }
          ]
        });
      }
    }

    if (window.K9Audio) window.K9Audio.playTacticalBeep(300, 0.15);
    showToast(`🚫 ${user.name} ha sido expulsado de la Unidad K9.`, 'error');
    closeK();
    renderJefaturaSubtab('agentes');
  });
};

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
      showToast('Can no encontrado. Asegúrate de escribir el nombre exacto.', 'warning');
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
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
          <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="editDogTraining('${d.id}')" title="Modificar nivel de adiestramiento">
            ⚡ Adiestramiento
          </button>
          <button class="btn-tactical btn-tactical-sm" onclick="window.deleteDog('${d.id}')" style="background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.4); color:#ff5252; font-weight:700;" title="Dar de baja y eliminar can">
            🗑️ Eliminar
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.deleteDog = function (dogId) {
  const dogs = window.K9Store.getDogs();
  const dog = dogs.find(d => d.id === dogId);
  if (!dog) return;

  // Abrir modal táctico de confirmación de baja de can
  window._pendingDeleteDogId = dogId;
  const delName = document.getElementById('delDogName');
  const delTag  = document.getElementById('delDogTag');
  const delBreed = document.getElementById('delDogBreed');
  const delPhoto = document.getElementById('delDogPhoto');
  if (delName) delName.textContent = dog.name;
  if (delTag) delTag.textContent = dog.tag;
  if (delBreed) delBreed.textContent = dog.breed + ' · ' + dog.specialty;
  if (delPhoto) delPhoto.src = dog.photo || 'assets/images/k9_thor.jpg';
  openModal('modalDeleteDog');
  return;
}

// Función interna ejecutada tras confirmación
window._confirmDeleteDog = function () {
  const dogId = window._pendingDeleteDogId;
  if (!dogId) return;
  const dogs = window.K9Store.getDogs();
  const dog = dogs.find(d => d.id === dogId);
  if (!dog) return;
  closeModal('modalDeleteDog');

  // Desasignar de cualquier guía
  const users = window.K9Store.getUsers();
  let usersChanged = false;
  users.forEach(u => {
    if (u.assignedDogId === dogId) {
      u.assignedDogId = null;
      usersChanged = true;
    }
  });
  if (usersChanged) {
    window.K9Store.save(STORAGE_KEYS.USERS, users);
  }

  const updatedDogs = dogs.filter(d => d.id !== dogId);
  window.K9Store.save(STORAGE_KEYS.DOGS, updatedDogs);
  if (window.K9CloudSync) window.K9CloudSync.push();

  if (window.K9Webhook) {
    const admin = window.K9Auth.getCurrentUser();
    if (admin) {
      window.K9Webhook.sendLog({
        title: '🗑️ Can K9 Dado de Baja / Eliminado',
        color: 0xff3b30,
        fields: [
          { name: 'Mando', value: `${admin.name} (${admin.placa})`, inline: true },
          { name: 'Can Eliminado', value: `${dog.name} [${dog.tag}]`, inline: true },
          { name: 'Raza / Especialidad', value: `${dog.breed} - ${dog.specialty}`, inline: true }
        ]
      });
    }
  }

  if (window.K9Audio) window.K9Audio.playTacticalBeep(350, 0.15);
  showToast(`Can ${dog.name} [${dog.tag}] eliminado del registro K9`, 'info');
  renderJefaturaSubtab('canes');
  if (typeof updateLiveCounters === 'function') updateLiveCounters();
};

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
      if (window.K9CloudSync) window.K9CloudSync.push();
      showToast(`Adiestramiento de ${dog.name} actualizado a ${parsed}%`, 'success');
      renderJefaturaSubtab('canes');
    } else {
      showToast('Por favor introduce un número válido entre 0 y 100.', 'warning');
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
          <button class="btn-tactical btn-tactical-danger btn-tactical-sm" id="btnNewDisciplinary" onclick="openModal('modalNewDisciplinary')">
            <span>+</span> Abrir Expediente de Falta
          </button>
        </div>
      </div>

      <div style="overflow-x:auto;">
        <table class="tactical-table-element">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Agente Implicado</th>
              <th>Tipo / Visibilidad</th>
              <th>Gravedad</th>
              <th>Motivo de la Falta / Hechos</th>
              <th>Sanción / Medida</th>
              <th>Oficial Sancionador</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(rec => {
              const isInternal = rec.category === 'expediente_interno' || rec.isInternal;
              return `
              <tr>
                <td style="font-family:var(--font-tactical); font-size:0.8rem;">${rec.date}</td>
                <td><strong style="color:#fff;">${rec.agentName}</strong></td>
                <td>
                  ${isInternal ? `
                    <span style="font-family:var(--font-headline); font-size:0.75rem; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700; background:rgba(124,58,237,0.2); border:1px solid #a78bfa; color:#c4b5fd;">
                      🔒 Confidencial (Jefatura)
                    </span>
                  ` : `
                    <span style="font-family:var(--font-headline); font-size:0.75rem; padding:0.2rem 0.5rem; border-radius:4px; font-weight:700; background:rgba(255,183,3,0.15); border:1px solid var(--border-gold); color:var(--tactical-gold);">
                      ⚠️ Falta Notificada
                    </span>
                  `}
                </td>
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
                  <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                    ${rec.status !== 'Cumplida' ? `
                      <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="markSanctionFulfilled('${rec.id}')" title="Marcar sanción como cumplida">
                        ✓ Cumplida
                      </button>
                    ` : '<span style="color:var(--text-subtle); font-size:0.75rem; padding:0.2rem 0.4rem;">Archivado</span>'}
                    <button class="btn-tactical btn-tactical-sm" onclick="deleteDisciplinaryRecord('${rec.id}')" style="background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.4); color:#ff5252;" title="Eliminar registro">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            `;}).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btnNewDisciplinary').addEventListener('click', () => {
    openModal('modalNewDisciplinary');
  });
}

window.deleteDisciplinaryRecord = function (id) {
  const records = window.K9Store.getDisciplinary();
  const rec = records.find(r => r.id === id);
  if (!rec) return;

  // Abrir modal táctico de confirmación de baja de disciplinario
  window._pendingDeleteDiscId = id;
  const delAgent    = document.getElementById('delDiscAgent');
  const delSeverity = document.getElementById('delDiscSeverity');
  const delReason   = document.getElementById('delDiscReason');
  const delSanction = document.getElementById('delDiscSanction');
  if (delAgent)    delAgent.textContent    = rec.agentName || 'Agente';
  if (delSeverity) delSeverity.textContent = rec.type || 'Falta';
  if (delReason)   delReason.textContent   = rec.reason || '—';
  if (delSanction) delSanction.textContent = rec.sanction || '—';
  openModal('modalDeleteDisciplinary');
};

// Función interna ejecutada tras confirmación
window._confirmDeleteDisc = function () {
  const id = window._pendingDeleteDiscId;
  if (!id) return;
  closeModal('modalDeleteDisciplinary');
  const records = window.K9Store.getDisciplinary().filter(r => r.id !== id);
  window.K9Store.save(STORAGE_KEYS.DISCIPLINARY, records);
  if (window.K9CloudSync) window.K9CloudSync.push();
  showToast('Registro disciplinario eliminado', 'info');
  renderJefaturaSubtab('disciplinario');
};

window.markSanctionFulfilled = function (id) {
  const records = window.K9Store.getDisciplinary();
  const rec = records.find(r => r.id === id);
  if (rec) {
    rec.status = 'Cumplida';
    window.K9Store.save(STORAGE_KEYS.DISCIPLINARY, records);
    if (window.K9CloudSync) window.K9CloudSync.push();
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
    <!-- 1. GESTIÓN Y REVOCACIÓN DE INSIGNIAS POR AGENTE -->
    <div style="background:var(--bg-surface); border:1px solid var(--border-tactical); border-radius:14px; padding:1.5rem; margin-bottom:2rem; box-shadow:var(--shadow-elevation);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h4 class="font-tactical" style="font-size:1.15rem; color:#fff; display:flex; align-items:center; gap:0.5rem; margin:0 0 0.3rem 0;">
            <span>🛡️</span> GESTOR DE INSIGNIAS POR AGENTE (OTORGAR & QUITAR)
          </h4>
          <span style="font-size:0.8rem; color:var(--text-muted);">
            Consulta las condecoraciones de cada miembro, retira insignias concedidas (botón ✕) o añade nuevas condecoraciones
          </span>
        </div>
        <button class="btn-tactical btn-tactical-gold btn-tactical-sm" id="btnAwardBadge" onclick="window.openModal('modalAwardBadge')">
          <span>🎖️</span> + Otorgar Condecoración
        </button>
      </div>

      <div style="overflow-x:auto;">
        <table class="tactical-table-element">
          <thead>
            <tr>
              <th>Agente & Placa</th>
              <th>Rango Oficial</th>
              <th>Condecoraciones Concedidas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const uBadges = (u.badges || []).map(bid => badges.find(b => b.id === bid)).filter(Boolean);
              return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                      <img src="${u.avatar}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid var(--border-tactical);" alt="${u.name}" onerror="this.src='assets/images/emblem.jpg'">
                      <div>
                        <strong style="color:#fff;">${u.name}</strong>
                        <div style="font-size:0.72rem; color:var(--police-cyan); font-family:var(--font-headline);">PLACA #${u.placa}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style="font-size:0.82rem; color:var(--text-main); font-family:var(--font-headline);">${u.rank}</span>
                  </td>
                  <td>
                    <div style="display:flex; flex-wrap:wrap; gap:0.4rem; align-items:center;">
                      ${uBadges.length > 0 ? uBadges.map(b => `
                        <span style="display:inline-flex; align-items:center; gap:0.35rem; background:rgba(255,183,3,0.1); border:1px solid rgba(255,183,3,0.3); border-radius:4px; padding:0.25rem 0.55rem; font-size:0.78rem; color:#fff;">
                          <img src="${b.image}" style="width:18px; height:18px; object-fit:contain;">
                          <span>${b.name}</span>
                          <button onclick="window.removeBadgeFromAgent('${u.id}', '${b.id}')" style="background:none; border:none; color:#ff5252; cursor:pointer; font-weight:700; margin-left:0.25rem; padding:0 0.15rem; font-size:0.85rem;" title="Quitar condecoración ${b.name}">✕</button>
                        </span>
                      `).join('') : '<span style="color:var(--text-subtle); font-size:0.75rem;">Sin condecoraciones asignadas</span>'}
                    </div>
                  </td>
                  <td>
                    <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.openAwardBadgeForAgent('${u.id}')" title="Conceder medalla a ${u.name}">
                      + Otorgar
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2. CATÁLOGO GENERAL DE MEDALLAS E INSIGNIAS -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h4 class="font-tactical" style="font-size:1.15rem; color:#fff;">CATÁLOGO DE CONDECORACIONES K9</h4>
        <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">Medallas e insignias oficiales al valor, peritaje y especialidad táctica</p>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1.25rem;">
      ${badges.map(b => {
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
              <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.openAwardBadgePrefilled('${b.id}')">
                Otorgar
              </button>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;

  const btnAward = document.getElementById('btnAwardBadge');
  if (btnAward) {
    btnAward.addEventListener('click', () => {
      openModal('modalAwardBadge');
    });
  }
}

window.removeBadgeFromAgent = function (userId, badgeId) {
  const users = window.K9Store.getUsers();
  const user = users.find(u => u.id === userId);
  const badges = window.K9Store.getBadges();
  const badge = badges.find(b => b.id === badgeId);
  if (!user) return;

  const bName = badge ? badge.name : 'Insignia';

  user.badges = (user.badges || []).filter(id => id !== badgeId);
  window.K9Store.save(STORAGE_KEYS.USERS, users);
  if (window.K9CloudSync) window.K9CloudSync.push();

  if (window.K9Webhook) {
    const admin = window.K9Auth.getCurrentUser();
    if (admin) {
      window.K9Webhook.sendLog({
        title: '🎖️ Condecoración K9 Revocada',
        color: 0xff6b6b,
        fields: [
          { name: 'Mando', value: `${admin.name} (${admin.placa})`, inline: true },
          { name: 'Agente', value: `${user.name} (${user.placa})`, inline: true },
          { name: 'Insignia Retirada', value: bName, inline: true }
        ]
      });
    }
  }

  if (window.K9Audio) window.K9Audio.playTacticalBeep(400, 0.12);
  showToast(`Insignia "${bName}" retirada de ${user.name}`, 'info');
  renderJefaturaSubtab('insignias');
};

window.openAwardBadgeForAgent = function (userId) {
  openModal('modalAwardBadge');
  const sel = document.getElementById('awardUserSelect');
  if (sel) sel.value = userId;
};

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
  if (!user) {
    showToast('Selecciona un agente válido.', 'warning');
    return;
  }

  const checkboxes = document.querySelectorAll('#permissionsMatrixContainer .perm-checkbox');
  const selected = [];
  checkboxes.forEach(cb => {
    if (cb.checked) selected.push(cb.dataset.permid);
  });

  user.permissions = selected;
  user.isJefatura = selected.length > 0 || user.rank === 'Jefe de División K9';

  window.K9Store.save(STORAGE_KEYS.USERS, users);

  // Persistir también en AGENT_PRESETS para que en próximos logins se mantengan intactos
  if (user.discordId) {
    const presets = window.K9Store.getAgentPresets ? window.K9Store.getAgentPresets() : [];
    const p = presets.find(x => x.discordId === user.discordId);
    if (p) {
      p.permissions = selected;
      p.isJefatura = user.isJefatura;
    } else {
      presets.push({
        discordId: user.discordId,
        discordUsername: user.discordUsername || user.name,
        placa: user.placa || 'S/P',
        rank: user.rank || 'Oficial Guía K9',
        isJefatura: user.isJefatura,
        permissions: selected,
        serviceStatus: user.serviceStatus || 'En Activo',
        createdAt: new Date().toLocaleDateString('es-ES')
      });
    }
    window.K9Store.save(STORAGE_KEYS.AGENT_PRESETS, presets);
  }

  // Sincronizar cambios a la nube en tiempo real
  if (window.K9CloudSync) {
    window.K9CloudSync.push();
  }

  // Si el usuario actualizado es el usuario logueado en este navegador, recargar sesión
  if (window.K9Auth) {
    const current = window.K9Auth.getCurrentUser();
    if (current && current.id === user.id) {
      window.K9Auth.loadUser();
      if (typeof window.setupAuthUI === 'function') window.setupAuthUI();
    }
  }

  if (window.K9Audio) window.K9Audio.playTacticalBeep(1100, 0.12);
  showToast(`✅ Permisos actualizados para el agente ${user.name} (${selected.length} módulos)`, 'success');
  renderUserPermissionsMatrix(user.id);
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
  else if (subtab === 'logs') renderLogsSection(container);
}

// -------------------------------------------------------------
// SUBTAB 7: REGISTRO DE AUDITORÍA & LOGS (EXCLUSIVO JEFATURA)
// -------------------------------------------------------------
function renderLogsSection(container) {
  const logs = window.K9Store.getLogs();

  container.innerHTML = `
    <div class="tactical-table-wrapper">
      <div class="table-toolbar-row">
        <div>
          <h4 class="font-tactical" style="color:#fff; font-size:1.05rem;">📋 REGISTRO TÁCTICO DE ACTIVIDAD & AUDITORÍA</h4>
          <span style="font-size:0.75rem; color:var(--text-muted);">Historial de eventos de mando, accesos, sanciones, informes y sincronización (Exclusivo Jefatura)</span>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="renderJefaturaSubtab('logs')">
            🔄 Refrescar
          </button>
          <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="exportLogsDossier()">
            📄 Exportar JSON
          </button>
          <button class="btn-tactical btn-tactical-danger btn-tactical-sm" onclick="clearLogsTactical()">
            🗑️ Purgar Registro
          </button>
        </div>
      </div>

      <!-- Filtros y buscador de logs -->
      <div style="display:flex; gap:0.75rem; padding: 0.75rem 1rem; background:rgba(0,0,0,0.25); border-bottom:1px solid var(--border-color); flex-wrap:wrap;">
        <div class="table-search-box" style="flex:1; min-width:240px;">
          <span>🔍</span>
          <input type="text" id="searchLogsInput" placeholder="Filtrar por evento, autor, detalle o fecha...">
        </div>
        <select id="filterLogTypeSelect" class="form-select-tactical" style="max-width:200px; padding:0.4rem 0.75rem; font-size:0.8rem;">
          <option value="ALL">Todas las Categorías</option>
          <option value="auth">Autenticación / Discord</option>
          <option value="announcement">Comunicados</option>
          <option value="report">Informes Semanales</option>
          <option value="promotion">Ascensos Oficiales</option>
          <option value="disciplinary">Régimen Disciplinario</option>
          <option value="dog">Canes K9</option>
          <option value="badge">Condecoraciones</option>
          <option value="normative">Normativas & Manuales</option>
          <option value="info">Información General</option>
        </select>
      </div>

      <div class="tactical-table-scroll" style="max-height: 550px; overflow-y: auto;">
        <table class="tactical-table">
          <thead>
            <tr>
              <th style="width: 170px;">FECHA Y HORA</th>
              <th style="width: 130px;">TIPO</th>
              <th>EVENTO / TÍTULO</th>
              <th style="width: 180px;">RESPONSABLE</th>
              <th>DETALLES</th>
            </tr>
          </thead>
          <tbody id="logsTableBody">
            ${renderLogRowsHtml(logs)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Listeners de búsqueda y filtrado de logs
  const inputSearch = document.getElementById('searchLogsInput');
  const selectType = document.getElementById('filterLogTypeSelect');

  const filterHandler = () => {
    const query = (inputSearch?.value || '').toLowerCase().trim();
    const typeFilter = selectType?.value || 'ALL';
    const allLogs = window.K9Store.getLogs();

    const filtered = allLogs.filter(log => {
      const matchType = typeFilter === 'ALL' || (log.type && log.type.toLowerCase().includes(typeFilter.toLowerCase()));
      const combined = `${log.title || ''} ${log.description || ''} ${log.author || ''} ${log.displayTime || ''} ${JSON.stringify(log.fields || '')}`.toLowerCase();
      const matchQuery = !query || combined.includes(query);
      return matchType && matchQuery;
    });

    const tbody = document.getElementById('logsTableBody');
    if (tbody) tbody.innerHTML = renderLogRowsHtml(filtered);
  };

  inputSearch?.addEventListener('input', filterHandler);
  selectType?.addEventListener('change', filterHandler);
}

function renderLogRowsHtml(logs) {
  if (!logs || logs.length === 0) {
    return `
      <tr>
        <td colspan="5" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
          <span>ℹ️</span> No hay registros de auditoría almacenados actualmente
        </td>
      </tr>
    `;
  }

  return logs.map(l => {
    const typeBadge = (l.type || 'info').toLowerCase();
    let typeClass = 'log-badge-tag';
    if (typeBadge.includes('danger') || typeBadge.includes('disciplinary')) typeClass += ' log-badge-danger';
    else if (typeBadge.includes('promotion') || typeBadge.includes('gold')) typeClass += ' log-badge-gold';
    else if (typeBadge.includes('success')) typeClass += ' log-badge-success';
    else if (typeBadge.includes('auth')) typeClass += ' log-badge-auth';

    let fieldsHtml = '';
    if (l.fields && Array.isArray(l.fields) && l.fields.length > 0) {
      fieldsHtml = `<div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.3rem;">` +
        l.fields.map(f => `<span style="font-size:0.7rem; background:rgba(255,255,255,0.06); padding:0.15rem 0.4rem; border-radius:4px; border:1px solid rgba(255,255,255,0.08);"><strong>${f.name}:</strong> ${f.value}</span>`).join('') +
        `</div>`;
    }

    return `
      <tr>
        <td style="font-family:monospace; font-size:0.75rem; color:var(--text-muted); white-space:nowrap;">
          ${l.displayTime || l.timestamp || '—'}
        </td>
        <td>
          <span class="${typeClass}">
            ${l.emoji || '📌'} ${(l.type || 'INFO').toUpperCase()}
          </span>
        </td>
        <td style="font-weight:600; color:#fff;">
          ${l.title || 'Evento'}
        </td>
        <td style="font-size:0.8rem; color:var(--police-cyan);">
          ${l.author || 'Sistema'}
        </td>
        <td style="font-size:0.8rem; color:var(--text-muted);">
          ${l.description || '—'}
          ${fieldsHtml}
        </td>
      </tr>
    `;
  }).join('');
}

window.clearLogsTactical = function() {
  window.K9Store.save(STORAGE_KEYS.LOGS, []);
  if (window.K9CloudSync) window.K9CloudSync.push();
  if (window.K9Audio) window.K9Audio.playTacticalBeep(350, 0.15);
  showToast('Registro de logs purgado correctamente', 'info');
  renderJefaturaSubtab('logs');
};

window.exportLogsDossier = function() {
  const logs = window.K9Store.getLogs();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
  const dl = document.createElement('a');
  dl.setAttribute("href", dataStr);
  dl.setAttribute("download", `k9_logs_audit_${Date.now()}.json`);
  document.body.appendChild(dl);
  dl.click();
  dl.remove();
  showToast('Auditoría de logs exportada a JSON', 'success');
};

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

      const isConfidential = !!document.getElementById('repConfidentialInput')?.checked;
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
        date: new Date().toLocaleDateString('es-ES'),
        isConfidential: isConfidential
      };

      reports.unshift(newRep);
      window.K9Store.save(STORAGE_KEYS.REPORTS, reports);
      if (window.K9CloudSync) window.K9CloudSync.push();
      closeModal('modalNewReport');
      formReport.reset();
      showToast(isConfidential ? 'Informe semanal confidencial registrado (solo Jefatura)' : 'Informe semanal registrado correctamente', 'success');
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
      if (window.K9CloudSync) window.K9CloudSync.push();
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
    const fillDiscAgents = () => {
      const sel = document.getElementById('discAgentSelect');
      if (sel) {
        const users = window.K9Store.getUsers();
        sel.innerHTML = users.map(u => `<option value="${u.id}">${u.name} (Placa ${u.placa}) - ${u.rank}</option>`).join('');
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
      const categoryVal = document.getElementById('discCategorySelect') ? document.getElementById('discCategorySelect').value : 'falta_notificada';
      const isInternalVal = categoryVal === 'expediente_interno';

      const newDisc = {
        id: 'disc_' + Date.now(),
        agentId: targetUserId,
        agentName: targetUser ? `${targetUser.name} (${targetUser.placa})` : 'Agente',
        type: document.getElementById('discTypeSelect').value,
        category: categoryVal,
        isInternal: isInternalVal,
        reason: document.getElementById('discReasonInput').value,
        sanction: document.getElementById('discSanctionInput').value,
        status: 'Vigente',
        issuedBy: `${user.name} (${user.placa})`,
        date: new Date().toLocaleDateString('es-ES')
      };

      records.unshift(newDisc);
      window.K9Store.save(STORAGE_KEYS.DISCIPLINARY, records);
      if (window.K9CloudSync) window.K9CloudSync.push();
      closeModal('modalNewDisciplinary');
      formDisc.reset();
      if (window.K9Audio) window.K9Audio.playAlert();
      showToast(isInternalVal ? 'Expediente interno confidencial abierto en Jefatura (no visible para el miembro)' : `Falta ${newDisc.type} impuesta y notificada al agente`, 'warning');
      if (window.K9Webhook) window.K9Webhook.onDisciplinaryCreate(user,
        targetUser ? targetUser.name : 'Desconocido',
        { type: newDisc.type + (isInternalVal ? ' [Expediente Interno]' : ''), penalty: newDisc.sanction, reason: newDisc.reason }
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
          if (window.K9CloudSync) window.K9CloudSync.push();
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
          showToast('Este agente ya posee esta condecoración.', 'warning');
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

      const rawPriority = (document.getElementById('annPrioritySelect')?.value || 'OFICIAL').toUpperCase();
      const imageUrl = (document.getElementById('annImageInput')?.value || '').trim() || null;
      const newAnn = {
        id: 'ann_' + Date.now(),
        title: document.getElementById('annTitleInput').value.toUpperCase(),
        priority: rawPriority,
        type: rawPriority,
        imageUrl: imageUrl,
        date: new Date().toLocaleDateString('es-ES'),
        author: `${user.rank} - ${user.name}`,
        pinned: !!document.getElementById('annPinnedInput').checked,
        content: document.getElementById('annContentInput').value
      };

      if (newAnn.pinned) {
        announcements.unshift(newAnn);
      } else {
        announcements.push(newAnn);
      }

      window.K9Store.save(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
      if (window.K9CloudSync) window.K9CloudSync.push();
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
  // Sincronización en la Nube
  const btnForceSync = document.getElementById('btnForceSyncNow');
  if (btnForceSync) {
    btnForceSync.addEventListener('click', async () => {
      showToast('Sincronizando con la nube…', 'info');
      if (window.K9CloudSync) {
        await window.K9CloudSync.pull(true);
        await window.K9CloudSync.push();
        if (window.K9Audio) window.K9Audio.playTacticalBeep(1200, 0.15);
        showToast('✅ Sincronización en la nube completada', 'success');
      }
    });
  }

  const btnSaveEndpoint = document.getElementById('btnSaveSyncEndpoint');
  if (btnSaveEndpoint) {
    btnSaveEndpoint.addEventListener('click', () => {
      const val = (document.getElementById('syncEndpointInput').value || '').trim();
      if (window.K9CloudSync) {
        window.K9CloudSync.setEndpointUrl(val);
        showToast(val ? 'Servidor de nube actualizado' : 'Usando endpoint predeterminado /api/sync', 'success');
      }
    });
  }

  const btnExportSync = document.getElementById('btnExportSyncData');
  if (btnExportSync) {
    btnExportSync.addEventListener('click', () => {
      if (window.K9CloudSync) {
        const payload = window.K9CloudSync.exportPayload();
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        showToast('Respaldo JSON copiado al portapapeles', 'success');
      }
    });
  }

  // Botón Confirmar Baja de Can K9 (modal táctico, sin confirm() nativo)
  const btnConfirmDog = document.getElementById('btnConfirmDeleteDogAction');
  if (btnConfirmDog) {
    btnConfirmDog.addEventListener('click', () => {
      if (window._confirmDeleteDog) window._confirmDeleteDog();
    });
  }

  // Botón Confirmar Retirada de Expediente (modal táctico, sin confirm() nativo)
  const btnConfirmDisc = document.getElementById('btnConfirmDeleteDiscAction');
  if (btnConfirmDisc) {
    btnConfirmDisc.addEventListener('click', () => {
      if (window._confirmDeleteDisc) window._confirmDeleteDisc();
    });
  }

  // -------------------------------------------------------------
  // FORMULARIOS DE NUEVOS MODALES TÁCTICOS
  // -------------------------------------------------------------

  // Formulario: Editar Comunicado de Jefatura
  const formEditAnn = document.getElementById('formEditAnnouncement');
  if (formEditAnn) {
    formEditAnn.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editAnnId').value;
      const announcements = window.K9Store.getAnnouncements();
      const ann = announcements.find(a => a.id === id);
      if (ann) {
        ann.title = (document.getElementById('editAnnTitle').value || '').toUpperCase();
        ann.priority = document.getElementById('editAnnPriority').value;
        ann.type = ann.priority;
        ann.imageUrl = (document.getElementById('editAnnImage').value || '').trim() || null;
        ann.pinned = !!document.getElementById('editAnnPinned').checked;
        ann.content = document.getElementById('editAnnContent').value;
        window.K9Store.save(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
        if (window.K9CloudSync) window.K9CloudSync.push();
        closeModal('modalEditAnnouncement');
        showToast('Comunicado de jefatura actualizado correctamente', 'success');
        renderGeneralSubtab('anuncios');
      }
    });
  }

  // Formulario: Editar / Crear Capítulo de Normativa
  const formEditNorm = document.getElementById('formEditNormative');
  if (formEditNorm) {
    formEditNorm.addEventListener('submit', (e) => {
      e.preventDefault();
      const normId = document.getElementById('normId').value;
      const chapter = (document.getElementById('normChapter').value || '').trim();
      const rawText = document.getElementById('normArticlesRaw').value || '';
      const lines = rawText.split('\n').filter(l => l.trim().length > 0);
      const articles = lines.map((l, idx) => {
        const parts = l.split('|').map(p => p.trim());
        if (parts.length >= 3) {
          return { num: parts[0], title: parts[1], text: parts.slice(2).join(' | ') };
        } else if (parts.length === 2) {
          return { num: parts[0], title: 'Disposición', text: parts[1] };
        } else {
          return { num: `Art. ${idx + 1}`, title: 'Disposición', text: l.trim() };
        }
      });

      const normatives = window.K9Store.getNormatives();
      const existing = normatives.find(n => n.id === normId);
      if (existing) {
        existing.chapter = chapter;
        existing.articles = articles;
        showToast('Capítulo de normativa actualizado', 'success');
      } else {
        normatives.push({
          id: 'norm_' + Date.now(),
          chapter: chapter,
          articles: articles
        });
        showToast('Nuevo capítulo normativo añadido', 'success');
      }
      window.K9Store.save(STORAGE_KEYS.NORMATIVES, normatives);
      if (window.K9CloudSync) window.K9CloudSync.push();
      closeModal('modalEditNormative');
      renderGeneralSubtab('normativas');
    });
  }

  // Formulario: Editar / Crear Manual de Adiestramiento
  const formEditMan = document.getElementById('formEditManual');
  if (formEditMan) {
    formEditMan.addEventListener('submit', (e) => {
      e.preventDefault();
      const manId = document.getElementById('manId').value;
      const title = (document.getElementById('manTitle').value || '').trim();
      const category = (document.getElementById('manCategory').value || '').trim();
      const rawText = document.getElementById('manItemsRaw').value || '';
      const lines = rawText.split('\n').filter(l => l.trim().length > 0);
      const items = lines.map((l, idx) => {
        const parts = l.split('|').map(p => p.trim());
        if (parts.length >= 3) {
          return { command: parts[0], trans: parts[1], desc: parts.slice(2).join(' | ') };
        } else if (parts.length === 2) {
          return { command: parts[0], trans: 'Procedimiento', desc: parts[1] };
        } else {
          return { command: `MÓDULO ${idx + 1}`, trans: 'Instrucción', desc: l.trim() };
        }
      });

      const manuals = window.K9Store.getManuals();
      const existing = manuals.find(m => m.id === manId);
      if (existing) {
        existing.title = title;
        existing.category = category;
        existing.items = items;
        showToast('Manual de adiestramiento actualizado', 'success');
      } else {
        manuals.push({
          id: 'man_' + Date.now(),
          title: title,
          category: category,
          items: items
        });
        showToast('Nuevo manual de adiestramiento añadido', 'success');
      }
      window.K9Store.save(STORAGE_KEYS.MANUALS, manuals);
      if (window.K9CloudSync) window.K9CloudSync.push();
      closeModal('modalEditManual');
      renderGeneralSubtab('manuales');
    });
  }

  // Formulario: Editar Ficha de Miembro K9
  const formEditMem = document.getElementById('formEditMember');
  if (formEditMem) {
    formEditMem.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('editMemberId').value;
      const users = window.K9Store.getUsers();
      const member = users.find(u => u.id === id);
      if (member) {
        member.name = (document.getElementById('editMemberName').value || '').trim();
        member.placa = (document.getElementById('editMemberPlaca').value || '').trim();
        member.rank = document.getElementById('editMemberRank').value;
        const newDogId = document.getElementById('editMemberDogSelect').value || null;
        member.assignedDogId = newDogId;
        const newAvatar = (document.getElementById('editMemberAvatar').value || '').trim();
        if (newAvatar) member.avatar = newAvatar;
        const discordIdVal = (document.getElementById('editMemberDiscordId').value || '').trim();
        if (discordIdVal) member.discordId = discordIdVal;
        member.isJefatura = !!document.getElementById('editMemberIsJefatura').checked;

        // Actualizar vínculo inverso en dogs si se asignó un can
        const dogs = window.K9Store.getDogs();
        dogs.forEach(d => {
          if (d.handlerId === member.id && d.id !== newDogId) {
            d.handlerId = null;
            d.handlerName = 'Sin asignar';
          }
          if (newDogId && d.id === newDogId) {
            d.handlerId = member.id;
            d.handlerName = `${member.name} (${member.placa})`;
          }
        });
        window.K9Store.save(STORAGE_KEYS.DOGS, dogs);
        window.K9Store.save(STORAGE_KEYS.USERS, users);
        if (window.K9CloudSync) window.K9CloudSync.push();
        closeModal('modalEditMember');
        showToast(`Ficha del agente ${member.name} actualizada con éxito`, 'success');
        if (currentView === 'general') renderGeneralSubtab('miembros');
        if (currentView === 'jefatura') renderJefaturaSubtab('agentes');
      }
    });
  }

  // Formulario: Publicar Orden de Ascenso Oficial
  const formPromo = document.getElementById('formNewPromotion');
  if (formPromo) {
    const promoAgentSel = document.getElementById('promoAgentSelect');
    if (promoAgentSel) {
      promoAgentSel.addEventListener('change', () => {
        const users = window.K9Store.getUsers();
        const selUser = users.find(u => u.id === promoAgentSel.value);
        const oldRankInput = document.getElementById('promoOldRank');
        if (oldRankInput && selUser) {
          oldRankInput.value = selUser.rank;
        }
      });
    }

    formPromo.addEventListener('submit', (e) => {
      e.preventDefault();
      const users = window.K9Store.getUsers();
      const agentId = document.getElementById('promoAgentSelect').value;
      const user = users.find(u => u.id === agentId);
      if (!user) return;

      const oldRank = document.getElementById('promoOldRank').value;
      const newRank = document.getElementById('promoNewRank').value;
      const citation = (document.getElementById('promoCitation').value || '').trim();
      const currentUser = window.K9Auth.getCurrentUser();

      // 1. Actualizar rango en users
      user.rank = newRank;
      if (newRank.includes('Jefe') || newRank.includes('Subjefe') || newRank.includes('Coordinador')) {
        user.isJefatura = true;
      }
      window.K9Store.save(STORAGE_KEYS.USERS, users);

      // 2. Si el usuario tiene discordId, actualizar o insertar en AGENT_PRESETS
      if (user.discordId) {
        const presets = window.K9Store.getAgentPresets();
        let preset = presets.find(p => p.discordId === user.discordId);
        if (preset) {
          preset.rank = newRank;
          preset.isJefatura = user.isJefatura;
        } else {
          presets.push({
            discordId: user.discordId,
            discordUsername: user.discordUsername || user.name,
            placa: user.placa,
            rank: newRank,
            isJefatura: user.isJefatura,
            permissions: user.permissions || [],
            serviceStatus: 'En Activo',
            createdAt: new Date().toLocaleDateString('es-ES')
          });
        }
        window.K9Store.save(STORAGE_KEYS.AGENT_PRESETS, presets);
      }

      // 3. Crear registro público de ascenso
      const promotions = window.K9Store.getPromotions();
      const newPromo = {
        id: 'promo_' + Date.now(),
        agentId: user.id,
        agentName: user.name,
        placa: user.placa,
        avatar: user.avatar || 'assets/images/emblem.jpg',
        previousRank: oldRank,
        newRank: newRank,
        date: new Date().toLocaleDateString('es-ES'),
        promotedBy: currentUser ? `${currentUser.name} (${currentUser.placa})` : 'Jefatura de División K9',
        citation: citation
      };
      promotions.unshift(newPromo);
      window.K9Store.save(STORAGE_KEYS.PROMOTIONS, promotions);

      // 4. Registrar en logs y webhook
      window.K9Store.addLog({
        type: 'promotion',
        emoji: '🎖️',
        title: `Ascenso Oficial: ${user.name} a ${newRank}`,
        description: `Resolución de mando dictada por ${newPromo.promotedBy}. Rango anterior: ${oldRank}`,
        author: newPromo.promotedBy,
        fields: [
          { name: 'Agente', value: `${user.name} (${user.placa})` },
          { name: 'Nuevo Rango', value: newRank },
          { name: 'Citación', value: citation.substring(0, 100) + (citation.length > 100 ? '…' : '') }
        ]
      });

      if (window.K9Webhook) {
        window.K9Webhook.log({
          title: `🎖️ DECRETO OFICIAL DE ASCENSO K9: ${user.name}`,
          color: 0xf59e0b,
          fields: [
            { name: 'Agente Condecorado', value: `${user.name} (Placa ${user.placa})`, inline: true },
            { name: 'Rango Anterior', value: oldRank, inline: true },
            { name: 'Nuevo Rango', value: `**${newRank}**`, inline: true },
            { name: 'Citación de Mando', value: citation, inline: false },
            { name: 'Firmado por', value: newPromo.promotedBy, inline: true }
          ]
        });
      }

      if (window.K9CloudSync) window.K9CloudSync.push();
      closeModal('modalNewPromotion');
      formPromo.reset();
      if (window.K9Audio) window.K9Audio.playTacticalBeep(1400, 0.2);
      showToast(`🎖️ Orden de ascenso publicada: ${user.name} asciende a ${newRank}`, 'success');
      if (currentView === 'general') renderGeneralSubtab('ascensos');
      if (currentView === 'jefatura') renderJefaturaSubtab('agentes');
    });
  }

  // Botones de Confirmación Tácticos en Modales de Borrado
  const btnConfRep = document.getElementById('btnConfirmDeleteReportAction');
  if (btnConfRep) btnConfRep.addEventListener('click', () => { if (window._confirmDeleteReport) window._confirmDeleteReport(); });

  const btnConfAnn = document.getElementById('btnConfirmDeleteAnnAction');
  if (btnConfAnn) btnConfAnn.addEventListener('click', () => { if (window._confirmDeleteAnnouncement) window._confirmDeleteAnnouncement(); });

  const btnConfNorm = document.getElementById('btnConfirmDeleteNormAction');
  if (btnConfNorm) btnConfNorm.addEventListener('click', () => { if (window._confirmDeleteNormative) window._confirmDeleteNormative(); });

  const btnConfMan = document.getElementById('btnConfirmDeleteManAction');
  if (btnConfMan) btnConfMan.addEventListener('click', () => { if (window._confirmDeleteManual) window._confirmDeleteManual(); });

  const btnConfMem = document.getElementById('btnConfirmDeleteMemberAction');
  if (btnConfMem) btnConfMem.addEventListener('click', () => { if (window._confirmDeleteMember) window._confirmDeleteMember(); });

  const btnConfPromo = document.getElementById('btnConfirmDeletePromoAction');
  if (btnConfPromo) btnConfPromo.addEventListener('click', () => { if (window._confirmDeletePromotion) window._confirmDeletePromotion(); });
}

// ==========================================
// CHAT — DESPACHO TÁCTICO CON JEFATURA
// ==========================================
function renderChatSection(container) {
  const user      = window.K9Auth.getCurrentUser();
  const msgs      = window.K9Store.getChatMessages();
  const isJefU    = user && user.isJefatura;

  container.innerHTML = `
    <div class="chat-dispatch-container">
      <div class="chat-dispatch-header">
        <div>
          <h3 class="font-gobold" style="color:#fff; font-size:1.1rem; margin-bottom:0.2rem;">💬 DESPACHO CON JEFATURA</h3>
          <span style="font-size:0.78rem; color:var(--text-muted);">Canal oficial de comunicación directa con los mandos de la Unidad K9</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="width:9px; height:9px; border-radius:50%; background:var(--tactical-green); box-shadow:0 0 8px var(--tactical-green); flex-shrink:0;"></span>
          <span style="font-family:'Gobold','GoBold',sans-serif; font-size:0.72rem; color:var(--tactical-green); letter-spacing:0.08em;">CANAL ACTIVO</span>
        </div>
      </div>

      <div class="chat-dispatch-feed" id="chatFeedContainer">
        ${msgs.length === 0 ? '<div style="text-align:center;color:var(--text-subtle);font-size:0.85rem;margin:3rem auto;">Sin mensajes aún. Inicia la comunicación con Jefatura.</div>' : ''}
        ${msgs.map(m => {
          const isMine = user && (m.authorId === user.id || m.authorId === user.discordId);
          const isJef  = m.isJefatura;
          const ts     = m.timestamp || '';
          const rankBadge = isJef
            ? '<span class="chat-author-badge chat-badge-jefatura">👑 JEFATURA</span>'
            : '<span class="chat-author-badge chat-badge-member">🐾 ' + (m.authorRank || 'AGENTE') + '</span>';
          const deleteBtn = isJefU && !isMine
            ? '<button onclick="window._deleteChatMsg(\'' + m.id + '\')" style="background:none;border:none;color:var(--text-subtle);cursor:pointer;font-size:0.72rem;padding:0 0.3rem;margin-left:auto;" title="Retirar mensaje">🗑️</button>'
            : '';
          return '<div class="chat-msg-row ' + (isMine ? 'mine' : '') + '">' +
            '<div class="chat-avatar-wrap ' + (isJef ? 'jefatura' : '') + '">' +
              '<img src="' + (m.authorAvatar || 'assets/images/emblem.jpg') + '" class="chat-avatar-img" onerror="this.src=\'assets/images/emblem.jpg\'">' +
            '</div>' +
            '<div class="chat-bubble ' + (isJef ? 'jefatura' : '') + '">' +
              '<div class="chat-meta-bar">' +
                '<span class="chat-author-name">' + m.authorName + '</span>' +
                rankBadge +
                '<span class="chat-time-tag">' + ts + '</span>' +
                deleteBtn +
              '</div>' +
              '<div class="chat-body-text">' + (m.text || '').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>' +
            '</div>' +
          '</div>';
        }).join('')}
      </div>

      <div class="chat-input-bar">
        ${user ? (
          '<img src="' + (user.avatar || 'assets/images/emblem.jpg') + '" onerror="this.src=\'assets/images/emblem.jpg\'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid var(--border-tactical);flex-shrink:0;">' +
          '<input type="text" id="chatMsgInput" class="chat-input-field" placeholder="Escribe un mensaje a Jefatura… (Intro para enviar)" maxlength="500">' +
          '<button class="btn-tactical btn-tactical-primary btn-tactical-sm" id="btnSendChatMsg" style="flex-shrink:0;">📡 Enviar</button>'
        ) : (
          '<div style="flex:1;text-align:center;font-size:0.85rem;color:var(--text-muted);"><a href="#" onclick="window.K9Auth.initiateDiscordOAuth();return false;" style="color:var(--police-cyan);">Inicia sesión con Discord</a> para escribir en el Despacho.</div>'
        )}
      </div>
    </div>
  `;

  // Scroll automático al último mensaje
  const feed = document.getElementById('chatFeedContainer');
  if (feed) setTimeout(() => { feed.scrollTop = feed.scrollHeight; }, 30);

  const msgInput = document.getElementById('chatMsgInput');
  const sendBtn  = document.getElementById('btnSendChatMsg');

  const doSend = () => {
    if (!user) return;
    const text = (msgInput.value || '').trim();
    if (!text) return;

    const allMsgs = window.K9Store.getChatMessages();
    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      authorId:     user.discordId || user.id,
      authorName:   user.name,
      authorPlaca:  user.placa,
      authorRank:   user.rank,
      authorAvatar: user.avatar || 'assets/images/emblem.jpg',
      isJefatura:   !!user.isJefatura,
      text:         text,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) +
                 ' · ' + new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    };

    allMsgs.push(newMsg);
    const trimmed = allMsgs.slice(-60);
    window.K9Store.save(STORAGE_KEYS.CHAT_MESSAGES, trimmed);
    if (window.K9CloudSync) window.K9CloudSync.push();

    if (window.K9Webhook && user.isJefatura) {
      window.K9Webhook.sendLog({
        title: '💬 Jefatura K9 en Despacho',
        color: 0xffb703,
        fields: [
          { name: 'Mando', value: user.name + ' [' + user.placa + ']', inline: true },
          { name: 'Mensaje', value: text.slice(0, 200), inline: false }
        ]
      });
    }

    if (window.K9Audio) window.K9Audio.playTacticalClick();
    msgInput.value = '';
    renderChatSection(container);
  };

  if (sendBtn)  sendBtn.addEventListener('click', doSend);
  if (msgInput) msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  });

  // Escuchar actualizaciones remotas del chat en tiempo real
  if (window._chatListenerRef) window.removeEventListener('k9_chat_updated', window._chatListenerRef);
  window._chatListenerRef = (evt) => {
    window.K9Store.save(STORAGE_KEYS.CHAT_MESSAGES, evt.detail);
    renderChatSection(container);
  };
  window.addEventListener('k9_chat_updated', window._chatListenerRef);
}

// Retirar mensaje del despacho (solo Jefatura puede moderar)
window._deleteChatMsg = function (msgId) {
  const msgs = window.K9Store.getChatMessages().filter(m => m.id !== msgId);
  window.K9Store.save(STORAGE_KEYS.CHAT_MESSAGES, msgs);
  if (window.K9CloudSync) window.K9CloudSync.push();
  const c = document.getElementById('generalSubtabContent');
  if (c) renderChatSection(c);
};


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
    if (modalId === 'modalCloudSync' && window.K9CloudSync) {
      const endpointInput = document.getElementById('syncEndpointInput');
      if (endpointInput) endpointInput.value = window.K9CloudSync.getEndpointUrl() || '';
      window.K9CloudSync.updateIndicatorUI();
    }
    if (modalId === 'modalNewDisciplinary') {
      const sel = document.getElementById('discAgentSelect');
      if (sel) {
        const users = window.K9Store.getUsers();
        sel.innerHTML = users.map(u => `<option value="${u.id}">${u.name} (Placa ${u.placa}) - ${u.rank}</option>`).join('');
      }
    }
    if (modalId === 'modalAwardBadge') {
      const userSel = document.getElementById('awardUserSelect');
      const badgeSel = document.getElementById('awardBadgeSelect');
      if (userSel) {
        const users = window.K9Store.getUsers();
        const currentVal = userSel.value;
        userSel.innerHTML = users.map(u => `<option value="${u.id}">${u.name} [Placa ${u.placa}] - ${u.rank}</option>`).join('');
        if (currentVal) userSel.value = currentVal;
      }
      if (badgeSel) {
        const badges = window.K9Store.getBadges();
        const currentVal = badgeSel.value;
        badgeSel.innerHTML = badges.map(b => `<option value="${b.id}">${b.name} (${b.category})</option>`).join('');
        if (currentVal) badgeSel.value = currentVal;
      }
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

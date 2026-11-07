/**
 * UNIDAD CANINA K9 - SISTEMA DE LOGS VIA DISCORD WEBHOOK
 * Registra automaticamente en un canal de Discord cualquier accion
 * relevante realizada en el portal: logins, informes, anuncios,
 * disciplinarios, cambios de perfil, etc.
 *
 * Webhook por defecto configurado por el administrador de la unidad.
 */

const WEBHOOK_STORAGE_KEY = 'k9_webhook_url';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE COLORES Y EMOJIS POR TIPO DE EVENTO
// ─────────────────────────────────────────────────────────────────────────────
const WEBHOOK_COLORS = {
  login: 0x5865F2,
  logout: 0x747F8D,
  register: 0x00C851,
  report: 0x00B0FF,
  announcement: 0xFFD166,
  disciplinary: 0xFF4444,
  badge: 0xF4B400,
  profile: 0x9B59B6,
  dog: 0x43B581,
  permission: 0xFF6B35,
  access_denied: 0xFF0040,
  config: 0x4FC3F7,
  info: 0x36393F,
};

const WEBHOOK_EMOJIS = {
  login: '🟢',
  logout: '🔴',
  register: '✅',
  report: '📋',
  announcement: '📢',
  disciplinary: '⚠️',
  badge: '🏅',
  profile: '👤',
  dog: '🐕',
  permission: '🔐',
  access_denied: '🚫',
  config: '⚙️',
  info: 'ℹ️',
};

// ─────────────────────────────────────────────────────────────────────────────
// CLASE PRINCIPAL K9WebhookLogger
// ─────────────────────────────────────────────────────────────────────────────
class K9WebhookLogger {
  constructor() {
    this._defaultWebhook = 'https://discord.com/api/webhooks/1563994507706638396/VtkL-NAeaTgQhgwJfh6qymCim4dI-3htlF70j1f_l7Q5i7aTDMElw-8dekJzKqOI5xAZ';
    this._queue = [];
    this._sending = false;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CONFIGURACION
  // ──────────────────────────────────────────────────────────────────────────

  getWebhookUrl() {
    return localStorage.getItem(WEBHOOK_STORAGE_KEY) || this._defaultWebhook;
  }

  setWebhookUrl(url) {
    if (!url || !url.startsWith('https://discord.com/api/webhooks/')) {
      console.warn('[K9Webhook] URL invalida. Debe comenzar con https://discord.com/api/webhooks/');
      return false;
    }
    localStorage.setItem(WEBHOOK_STORAGE_KEY, url);
    this.log('config', 'Webhook Actualizado',
      'La URL del webhook de logs ha sido cambiada por el administrador.', [
      { name: 'Nueva URL', value: '`' + url.substring(0, 80) + '`', inline: false }
    ]);
    return true;
  }

  clearWebhookUrl() {
    localStorage.removeItem(WEBHOOK_STORAGE_KEY);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MOTOR DE ENVIO (cola con throttle de 700ms)
  // ──────────────────────────────────────────────────────────────────────────

  async log(type, title, description, fields, footer) {
    const webhookUrl = this.getWebhookUrl();
    if (!webhookUrl) return;

    const color = WEBHOOK_COLORS[type] || WEBHOOK_COLORS.info;
    const emoji = WEBHOOK_EMOJIS[type] || 'ℹ️';
    const now = new Date();
    const safeFields = (fields || []).map(f => ({
      name: String(f.name || '').substring(0, 256),
      value: String(f.value || '—').substring(0, 1024),
      inline: !!f.inline
    }));

    const embed = {
      title: emoji + ' ' + title,
      description: description || '',
      color: color,
      fields: safeFields,
      footer: {
        text: footer || ('Unidad K9 • ' +
          now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) +
          ' ' + now.toLocaleTimeString('es-ES'))
      },
      timestamp: now.toISOString()
    };

    this._queue.push({ webhookUrl, embed });

    // También guardar en el registro interno de logs de la web para visualización de Jefatura
    if (window.K9Store && typeof window.K9Store.addLog === 'function') {
      const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
      window.K9Store.addLog({
        type: type,
        emoji: emoji,
        title: title,
        description: description,
        fields: safeFields,
        author: user ? `${user.name} (${user.placa})` : 'Sistema K9'
      });
    }

    this._processQueue();
  }

  async _processQueue() {
    if (this._sending || this._queue.length === 0) return;
    this._sending = true;
    while (this._queue.length > 0) {
      const { webhookUrl, embed } = this._queue.shift();
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: '🐕 K9 Logger',
            embeds: [embed]
          })
        });
      } catch (err) {
        console.warn('[K9Webhook] Error al enviar log:', err.message);
      }
      if (this._queue.length > 0) {
        await new Promise(r => setTimeout(r, 700));
      }
    }
    this._sending = false;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  _userFields(user) {
    if (!user) return [];
    return [
      { name: '👤 Agente', value: user.name || user.discordUsername || '—', inline: true },
      { name: '🏷️ Rango', value: user.rank || '—', inline: true },
      { name: '🪪 Placa', value: user.placa || '—', inline: true },
      { name: '🎮 Discord', value: user.discordUsername ? ('`' + user.discordUsername + '`') : '—', inline: true },
    ];
  }

  _clientInfo() {
    return '`' + (window.location.hostname || 'localhost') + '` — ' +
      navigator.userAgent.substring(0, 80);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // EVENTOS PREDEFINIDOS
  // ──────────────────────────────────────────────────────────────────────────

  onLogin(user, isNewUser) {
    const type = isNewUser ? 'register' : 'login';
    const title = isNewUser ? 'Nuevo Agente Registrado' : 'Inicio de Sesion';
    const desc = isNewUser
      ? '**' + user.name + '** se ha unido a la Unidad K9 por primera vez mediante Discord OAuth2.'
      : '**' + user.name + '** ha iniciado sesion en el portal de la Unidad K9.';
    this.log(type, title, desc, [
      ...this._userFields(user),
      { name: '📡 Origen', value: this._clientInfo(), inline: false },
    ]);
  }

  onLogout(user) {
    if (!user) return;
    this.log('logout', 'Cierre de Sesion',
      '**' + user.name + '** ha cerrado sesion.',
      this._userFields(user));
  }

  onReportSubmit(user, report) {
    const fields = [
      ...this._userFields(user),
      { name: '📅 Semana', value: report.weekLabel || report.week || '—', inline: true },
      { name: '🕐 Horas', value: String(report.hours || 0) + ' h', inline: true },
      { name: '🚨 Intervenciones', value: String(report.interventions || 0), inline: true },
    ];
    if (report.notes) {
      fields.push({ name: '📝 Notas', value: report.notes.substring(0, 500), inline: false });
    }
    this.log('report', 'Informe Semanal Enviado',
      '**' + user.name + '** ha enviado un informe de servicio semanal.', fields);
  }

  onAnnouncementPublish(user, announcement) {
    this.log('announcement', 'Nuevo Anuncio de Jefatura',
      '**' + user.name + '** ha publicado un comunicado oficial.', [
      ...this._userFields(user),
      { name: '📌 Titulo', value: announcement.title || '—', inline: false },
      { name: '🏷️ Categoria', value: announcement.category || '—', inline: true },
      { name: '📍 Fijado', value: announcement.pinned ? '✅ Si' : '❌ No', inline: true },
      { name: '📄 Contenido', value: (announcement.content || '').substring(0, 600), inline: false },
    ]);
  }

  onDisciplinaryCreate(user, targetName, sanction) {
    this.log('disciplinary', 'Expediente Disciplinario Abierto',
      'Se ha abierto un expediente disciplinario contra **' + targetName + '**.', [
      { name: '⚖️ Instruido por', value: user.name || '—', inline: true },
      { name: '🎯 Encausado', value: targetName || '—', inline: true },
      { name: '📋 Tipo de Falta', value: sanction.type || '—', inline: true },
      { name: '🔨 Sancion', value: sanction.penalty || '—', inline: false },
      { name: '📝 Motivo', value: (sanction.reason || '').substring(0, 600), inline: false },
    ]);
  }

  onBadgeAwarded(user, targetUser, badge, revoked) {
    const action = revoked ? 'Insignia Revocada' : 'Insignia Concedida';
    const desc = revoked
      ? '**' + user.name + '** ha revocado **' + badge.name + '** a **' + targetUser.name + '**.'
      : '**' + user.name + '** ha concedido **' + badge.name + '** a **' + targetUser.name + '**.';
    this.log('badge', action, desc, [
      { name: '🏅 Insignia', value: badge.name || '—', inline: true },
      { name: '🗂️ Categoria', value: badge.category || '—', inline: true },
      { name: '🎖️ Destinatario', value: targetUser.name || '—', inline: true },
    ]);
  }

  onProfileUpdate(adminUser, targetUser, changes) {
    const changeLines = Object.entries(changes)
      .map(function (e) { return '• **' + e[0] + '**: ' + e[1]; })
      .join('\n');
    this.log('profile', 'Perfil de Agente Actualizado',
      '**' + adminUser.name + '** ha modificado el perfil de **' + targetUser.name + '**.', [
      { name: '🎯 Agente', value: targetUser.name || '—', inline: true },
      { name: '🔧 Editor', value: adminUser.name || '—', inline: true },
      { name: '📝 Cambios', value: changeLines || '—', inline: false },
    ]);
  }

  onPermissionsChanged(adminUser, targetUser, added, removed) {
    const fields = [
      { name: '🎯 Agente', value: targetUser.name || '—', inline: true },
      { name: '🔧 Admin', value: adminUser.name || '—', inline: true },
    ];
    if (added && added.length) fields.push({ name: '➕ Permisos Añadidos', value: added.join(', '), inline: false });
    if (removed && removed.length) fields.push({ name: '➖ Permisos Eliminados', value: removed.join(', '), inline: false });
    this.log('permission', 'Permisos Modificados',
      'Se han actualizado los permisos de **' + targetUser.name + '**.', fields);
  }

  onDogAssignment(user, dog, agentName, unassign) {
    const action = unassign ? 'Can Desasignado' : 'Can Asignado a Agente';
    const desc = unassign
      ? 'El can **' + dog.name + '** ha sido desasignado y queda disponible.'
      : 'El can **' + dog.name + '** ha sido asignado al agente **' + agentName + '**.';
    this.log('dog', action, desc, [
      { name: '🐕 Can', value: dog.name || '—', inline: true },
      { name: '🏷️ Raza', value: dog.breed || '—', inline: true },
      { name: '👤 Agente', value: agentName || '—', inline: true },
      { name: '🔧 Realizado por', value: user.name || '—', inline: true },
    ]);
  }

  onAccessDenied(section) {
    this.log('access_denied', 'Intento de Acceso No Autorizado',
      'Un visitante ha intentado acceder a la seccion protegida **' + section + '** sin autenticarse.', [
      { name: '🔒 Seccion', value: section || '—', inline: true },
      { name: '🌐 Origen', value: this._clientInfo(), inline: false },
    ]);
  }

  onPortalVisit() {
    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
    if (user) return;
    this.log('info', 'Visita Anonima al Portal K9',
      'Un visitante anonimo ha accedido al portal oficial de la Unidad K9.', [
      { name: '🌐 Host', value: window.location.hostname || 'local', inline: true },
      { name: '🖥️ UA', value: navigator.userAgent.substring(0, 150), inline: false },
    ]);
  }

  async sendLog(options) {
    if (!options) return;
    const type = options.type || 'info';
    const title = options.title || 'Registro de Sistema K9';
    const description = options.description || '';
    const fields = options.fields || [];
    const footer = options.footer || null;
    return this.log(type, title, description, fields, footer);
  }

  onDogRequest(user, dog) {
    this.log('dog', 'Solicitud Formal de Binomio K9',
      'El agente **' + user.name + '** ha solicitado la asignación formal de un can.', [
      { name: '👤 Agente', value: user.name + ' (' + user.placa + ')', inline: true },
      { name: '🐕 Can Solicitado', value: dog.name + ' [' + dog.tag + ']', inline: true },
      { name: '🎖️ Rango', value: user.rank, inline: true }
    ]);
  }

  async testWebhook() {
    const url = this.getWebhookUrl();
    if (!url) { alert('No hay ningun webhook configurado.'); return; }
    await this.log('info', 'Test de Conectividad K9',
      'Este es un mensaje de prueba para verificar que el webhook esta correctamente configurado.', [
      { name: '✅ Estado', value: 'Webhook funcionando correctamente', inline: true },
      { name: '🌐 Portal', value: window.location.href, inline: false },
    ], 'Test enviado manualmente desde el panel de configuracion K9');
    return true;
  }
}

window.K9Webhook = new K9WebhookLogger();

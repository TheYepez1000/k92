/**
 * UNIDAD CANINA K9 - ESTADO DE SERVICIO EN VIVO & TEST TEÓRICO DE ACCESO K9
 * 
 * 1. Control de Estado de Servicio en Vivo (🟢 Cod: En servicio con can / 🔴 10-10: Servicio terminado)
 * 2. Visualización de binomios patrullando en tiempo real en Mapa y Vista Principal con cronómetro en directo.
 * 3. Contabilización y registro de horas y minutos de patrullaje para agentes y supervisión de Jefatura.
 * 4. Test Interactivo de Acceso K9 (10 preguntas basadas en Capítulo III, Art. 10 y 11, manuales, simulacros y ética).
 * 5. Generación automática y registro de Certificado Oficial de Habilitación Teórica K9 al aprobar (mínimo 8/10).
 * 6. Centro de Mando de Jefatura: CRUD completo de preguntas, creación de nuevos formularios y gestión de permisos específicos.
 */

(function () {
  'use strict';

  // Utilidad de sanitización segura
  function esc(str) {
    if (typeof escapeHtml === 'function') return escapeHtml(str);
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Formato HH:MM:SS o MM:SS
  function formatPatrolTime(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  window.formatPatrolTime = formatPatrolTime;

  // =============================================================================
  // 1. INTERRUPTOR RÁPIDO DE SERVICIO EN LA BARRA SUPERIOR
  // =============================================================================

  function renderDutyHudSwitch() {
    const container = document.getElementById('k9DutyHudWrapper');
    if (!container) return;

    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;

    if (!user) {
      container.innerHTML = `
        <button type="button" class="tactical-duty-btn duty-status-1010" onclick="window.K9Auth.initiateDiscordOAuth()" data-tooltip="Inicia sesión con Discord para entrar en servicio con can">
          <span class="duty-badge-dot dot-red"></span>
          <span>🔴 10-10</span>
          <span style="font-size:0.68rem; opacity:0.8;">(Desconectado)</span>
        </button>
      `;
      return;
    }

    const activePatrols = window.K9Store ? window.K9Store.getActivePatrols() : [];
    const userPatrol = activePatrols.find(p => p.agentId === user.id);

    if (userPatrol) {
      const elapsed = Date.now() - userPatrol.startTime;
      container.innerHTML = `
        <button type="button" class="tactical-duty-btn duty-status-active" onclick="window.toggleK9DutyStatus()" data-tooltip="En patrulla con ${esc(userPatrol.dogName)}. Haz clic para finalizar servicio (🔴 10-10)">
          <span class="duty-badge-dot dot-green"></span>
          <span>🟢 Cod: En servicio con can</span>
          <span class="duty-timer-chip" id="dutyLiveTimer">⏱️ ${formatPatrolTime(elapsed)}</span>
        </button>
      `;
    } else {
      container.innerHTML = `
        <button type="button" class="tactical-duty-btn duty-status-1010" onclick="window.toggleK9DutyStatus()" data-tooltip="Haz clic para entrar en servicio activo con K9 (🟢 Código Activo)">
          <span class="duty-badge-dot dot-red"></span>
          <span>🔴 10-10: Servicio terminado con K9</span>
        </button>
      `;
    }
  }
  window.renderDutyHudSwitch = renderDutyHudSwitch;

  // Toggle abrir modal de inicio o finalización
  window.toggleK9DutyStatus = function () {
    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
    if (!user) {
      if (typeof openModal === 'function') openModal('modalDiscordLogin');
      return;
    }

    if (user.isExpelled) {
      if (typeof showToast === 'function') showToast('Tu expediente policial figura como dado de baja. No puedes entrar en servicio.', 'error');
      return;
    }

    const activePatrols = window.K9Store ? window.K9Store.getActivePatrols() : [];
    const userPatrol = activePatrols.find(p => p.agentId === user.id);

    if (userPatrol) {
      // Activo -> Modal para pasar a 10-10
      const elapsed = Date.now() - userPatrol.startTime;
      const minutes = Math.max(1, Math.round(elapsed / 60000));
      const hours = Math.round((minutes / 60) * 10) / 10;
      const summaryBox = document.getElementById('endPatrolSummaryBox');
      if (summaryBox) {
        summaryBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
            <span style="font-family:var(--font-headline); font-size:0.85rem; color:#ff8585; letter-spacing:0.06em;">RESUMEN DE GUARDIA K9</span>
            <span style="font-family:var(--font-tactical); font-size:0.8rem; color:#fff; background:rgba(255,82,82,0.25); padding:0.15rem 0.5rem; border-radius:4px;">${esc(userPatrol.sector)}</span>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.82rem;">
            <div><span style="color:var(--text-muted); display:block; font-size:0.72rem;">CAN DE SERVICIO:</span><strong>🐕 ${esc(userPatrol.dogName)}</strong> (${esc(userPatrol.dogBreed)})</div>
            <div><span style="color:var(--text-muted); display:block; font-size:0.72rem;">HORA DE INICIO:</span><strong>⏰ ${new Date(userPatrol.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</strong></div>
            <div><span style="color:var(--text-muted); display:block; font-size:0.72rem;">TIEMPO PATRULLADO:</span><strong style="color:#00e676; font-size:1rem; font-family:var(--font-tactical);">${minutes} min</strong> (${hours} hrs)</div>
            <div><span style="color:var(--text-muted); display:block; font-size:0.72rem;">TOTAL PREVIO ACUMULADO:</span><strong>${user.patrolHoursTotal || 0} hrs</strong></div>
          </div>
        `;
      }
      const notesInput = document.getElementById('endPatrolNotes');
      if (notesInput) notesInput.value = '';
      if (typeof openModal === 'function') openModal('modalEndPatrol');
    } else {
      // Inactivo -> Modal para entrar en servicio
      const dogSelect = document.getElementById('patrolDogSelect');
      if (dogSelect && window.K9Store) {
        const dogs = window.K9Store.getDogs();
        dogSelect.innerHTML = dogs.map(d => `
          <option value="${d.id}" ${user.assignedDogId === d.id ? 'selected' : ''}>
            🐕 ${esc(d.name)} [${esc(d.tag)}] · ${esc(d.breed)} (${esc(d.specialty)})
          </option>
        `).join('');
      }
      if (typeof openModal === 'function') openModal('modalStartPatrol');
    }
  };

  // Enviar formulario: Iniciar patrulla
  window.handleFormStartPatrol = function (e) {
    if (e) e.preventDefault();
    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
    if (!user) return;

    const dogSelect = document.getElementById('patrolDogSelect');
    const sectorSelect = document.getElementById('patrolSectorSelect');
    const dogId = dogSelect ? dogSelect.value : null;
    const sector = sectorSelect ? sectorSelect.value : 'Central Los Santos (Mission Row)';

    const allDogs = window.K9Store ? window.K9Store.getDogs() : [];
    const dog = allDogs.find(d => d.id === dogId) || allDogs[0];

    const SECTOR_COORDS = {
      'Central Los Santos (Mission Row)': { lat: -40.0, lng: -20.0 },
      'Vinewood & Rockford Hills': { lat: -15.0, lng: -10.0 },
      'South Central & Davis': { lat: -55.0, lng: -15.0 },
      'Vespucci & Del Perro': { lat: -42.0, lng: -55.0 },
      'Sandy Shores & Grand Senora': { lat: 25.0, lng: 15.0 },
      'Paleto Bay & Mount Chiliad': { lat: 65.0, lng: -20.0 },
      'Puerto & Aeropuerto LSIA': { lat: -70.0, lng: -35.0 }
    };
    const coords = SECTOR_COORDS[sector] || { lat: -40.0, lng: -20.0 };

    if (window.K9Store) {
      window.K9Store.startPatrol({
        user,
        dog,
        sector,
        lat: coords.lat,
        lng: coords.lng
      });
    }

    if (typeof closeModal === 'function') closeModal('modalStartPatrol');
    if (window.K9Audio) window.K9Audio.playRadioChirp();
    if (typeof showToast === 'function') {
      showToast(`🟢 ¡En servicio con ${dog ? dog.name : 'K9'}! Patrulla iniciada en sector: ${sector}.`, 'success');
    }

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    else if (window.K9Supabase && window.K9Supabase.isConfigured()) window.K9Supabase.push();

    renderDutyHudSwitch();
    renderLiveBinomiosWidget();
    if (typeof window.refreshMapMarkers === 'function') window.refreshMapMarkers();
    if (window.currentView === 'perfil' && typeof window.renderMemberProfile === 'function') window.renderMemberProfile();
    if (window.currentView === 'jefatura' && window.currentJefaturaSubtab === 'patrullas') {
      window.renderJefaturaSubtab('patrullas');
    }
  };

  // Enviar formulario: Finalizar patrulla 10-10
  window.handleFormEndPatrol = function (e) {
    if (e) e.preventDefault();
    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
    if (!user) return;

    const notesInput = document.getElementById('endPatrolNotes');
    const notes = notesInput ? notesInput.value.trim() : '';

    let session = null;
    if (window.K9Store) {
      session = window.K9Store.endPatrol(user.id, notes, false);
    }

    if (typeof closeModal === 'function') closeModal('modalEndPatrol');
    if (window.K9Audio) window.K9Audio.playRadioChirp();

    if (typeof showToast === 'function') {
      if (session) {
        showToast(`🔴 10-10 Registrado: Has patrullado ${session.durationFormatted} (${session.durationMinutes} min). Horas guardadas en tu expediente.`, 'success');
      } else {
        showToast('🔴 10-10 Registrado: Fin de servicio.', 'info');
      }
    }

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    else if (window.K9Supabase && window.K9Supabase.isConfigured()) window.K9Supabase.push();

    renderDutyHudSwitch();
    renderLiveBinomiosWidget();
    if (typeof window.refreshMapMarkers === 'function') window.refreshMapMarkers();
    if (window.currentView === 'perfil' && typeof window.renderMemberProfile === 'function') window.renderMemberProfile();
    if (window.currentView === 'jefatura' && window.currentJefaturaSubtab === 'patrullas') {
      window.renderJefaturaSubtab('patrullas');
    }
  };

  // Intervalo en vivo para actualizar segundos del cronómetro sin recargar la página
  setInterval(() => {
    const activePatrols = window.K9Store ? window.K9Store.getActivePatrols() : [];
    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;

    // Timer de la barra superior
    const topTimer = document.getElementById('dutyLiveTimer');
    if (topTimer && user) {
      const userPatrol = activePatrols.find(p => p.agentId === user.id);
      if (userPatrol) {
        topTimer.textContent = '⏱️ ' + formatPatrolTime(Date.now() - userPatrol.startTime);
      }
    }

    // Timers de tarjetas activas
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('[data-patrol-timer-id]').forEach(el => {
        const patrolId = el.getAttribute('data-patrol-timer-id');
        const item = activePatrols.find(p => p.id === patrolId);
        if (item) {
          el.textContent = '⏱️ ' + formatPatrolTime(Date.now() - item.startTime);
        }
      });
    }
  }, 1000);

  // =============================================================================
  // 2. WIDGET DE BINOMIOS EN VIVO (VISTA INICIO & MAPA)
  // =============================================================================

  function renderLiveBinomiosWidget() {
    const container = document.getElementById('homeLiveBinomiosWidget');
    if (!container) return;

    const activePatrols = window.K9Store ? window.K9Store.getActivePatrols() : [];
    const currentUser = window.K9Auth ? window.K9Auth.getCurrentUser() : null;

    if (activePatrols.length === 0) {
      container.innerHTML = `
        <div style="background:rgba(16,24,43,0.7); border:1px solid var(--border-tactical); border-radius:14px; padding:1.15rem 1.4rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span style="font-size:1.4rem;">🐕</span>
            <div>
              <div style="font-family:var(--font-headline); font-size:0.95rem; color:#fff; letter-spacing:0.04em;">
                ESTADO DE PATRULLA K9 EN VIVO · LOS SANTOS
              </div>
              <div style="font-size:0.8rem; color:var(--text-muted);">
                En este momento todos los binomios se encuentran en <strong>🔴 10-10 (Servicio terminado)</strong>.
              </div>
            </div>
          </div>
          <div>
            ${currentUser ? `
              <button class="btn-tactical btn-tactical-primary btn-tactical-sm" onclick="window.toggleK9DutyStatus()" style="background:#00e676; border-color:#00e676; color:#000; font-weight:700;">
                <span>🟢</span> Entrar en Servicio con Can
              </button>
            ` : `
              <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.K9Auth.initiateDiscordOAuth()">
                <span>✦</span> Iniciar Sesión para Patrullar
              </button>
            `}
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="live-binomios-container">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; border-bottom:1px solid rgba(0,229,255,0.2); padding-bottom:0.85rem;">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <span class="live-radar-dot"></span>
            <div>
              <h3 style="font-family:var(--font-headline); font-size:1.1rem; color:#fff; margin:0; letter-spacing:0.04em;">
                BINOMIOS K9 EN SERVICIO ACTIVO (${activePatrols.length})
              </h3>
              <span style="font-size:0.78rem; color:var(--police-cyan); letter-spacing:0.06em;">PATRULLAJE POLICIAL CANINO EN TIEMPO REAL · LOS SANTOS</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.switchMainView('mapa')">
              <span>🗺️</span> Ver en Mapa de Los Santos
            </button>
            ${currentUser && !activePatrols.some(p => p.agentId === currentUser.id) ? `
              <button class="btn-tactical btn-tactical-primary btn-tactical-sm" onclick="window.toggleK9DutyStatus()" style="background:#00e676; border-color:#00e676; color:#000; font-weight:700;">
                <span>🟢</span> Unirse al Patrullaje
              </button>
            ` : ''}
          </div>
        </div>

        <div class="live-binomios-grid">
          ${activePatrols.map(p => {
            const elapsed = Date.now() - p.startTime;
            return `
              <div class="live-binomio-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div style="display:flex; align-items:center; gap:0.6rem;">
                    <img src="${p.agentAvatar}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid #00e676;" onerror="this.src='assets/images/emblem.jpg'">
                    <div>
                      <div style="color:#fff; font-weight:700; font-size:0.88rem; line-height:1.2;">
                        ${esc(p.agentName)}
                      </div>
                      <span style="font-size:0.72rem; color:#a5b4fc; background:rgba(88,101,242,0.15); padding:0.1rem 0.4rem; border-radius:3px;">
                        Placa ${esc(p.agentPlaca)} · ${esc(p.agentRank)}
                      </span>
                    </div>
                  </div>
                  <span class="live-radar-dot" title="En servicio en vivo"></span>
                </div>

                <div style="display:flex; align-items:center; gap:0.65rem; background:rgba(0,0,0,0.35); padding:0.5rem 0.65rem; border-radius:8px;">
                  <img src="${p.dogPhoto || 'assets/images/hero_dog.jpg'}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;" onerror="this.src='assets/images/hero_dog.jpg'">
                  <div style="flex:1;">
                    <div style="color:var(--police-cyan); font-weight:700; font-size:0.82rem;">
                      🐕 Can: ${esc(p.dogName)}
                    </div>
                    <div style="color:var(--text-muted); font-size:0.72rem;">
                      ${esc(p.dogBreed)}
                    </div>
                  </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.76rem; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.5rem;">
                  <span style="color:var(--text-subtle);">📍 ${esc(p.sector)}</span>
                  <span style="color:#00e676; font-family:var(--font-tactical); font-weight:700;" data-patrol-timer-id="${p.id}">
                    ⏱️ ${formatPatrolTime(elapsed)}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  window.renderLiveBinomiosWidget = renderLiveBinomiosWidget;

  // =============================================================================
  // 3. TEST INTERACTIVO DE ACCESO K9 (ART. 10 Y 11) & CERTIFICADOS
  // =============================================================================

  let currentExamState = {
    examId: 'exam_acceso_k9',
    stepIndex: 0,
    answers: {},
    submitted: false,
    result: null
  };

  window.openK9ExamModal = function (examId = 'exam_acceso_k9') {
    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
    if (!user) {
      if (typeof openModal === 'function') openModal('modalDiscordLogin');
      return;
    }

    if (user.isExpelled) {
      if (typeof showToast === 'function') showToast('Tu expediente figura como expulsado de la Unidad K9.', 'error');
      return;
    }

    const exam = window.K9Store ? window.K9Store.getExam(examId) : null;
    if (!exam) return;

    // Verificar lista blanca de aspirantes si estuviese configurada
    if (exam.allowedUserIds && exam.allowedUserIds.length > 0) {
      const isAllowed = exam.allowedUserIds.includes(user.id) ||
        (user.discordId && exam.allowedUserIds.includes(user.discordId)) ||
        (user.discordUsername && exam.allowedUserIds.includes(user.discordUsername));
      const isJef = window.K9Auth.isJefaturaMember();
      if (!isAllowed && !isJef) {
        if (typeof showToast === 'function') showToast('Este examen está reservado exclusivamente para la convocatoria oficial asignada por Jefatura.', 'warning');
        return;
      }
    }

    currentExamState = {
      examId: exam.id,
      stepIndex: 0,
      answers: {},
      submitted: false,
      result: null
    };

    renderK9ExamStep();
    if (typeof openModal === 'function') openModal('modalK9Exam');
  };

  function renderK9ExamStep() {
    const container = document.getElementById('k9ExamContentArea');
    if (!container) return;

    const exam = window.K9Store ? window.K9Store.getExam(currentExamState.examId) : null;
    if (!exam) return;

    const questions = exam.questions || [];
    const total = questions.length;

    if (total === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem;">
          <div style="font-size:2.5rem; margin-bottom:0.6rem;">📝</div>
          <h3 style="color:#fff; font-family:var(--font-headline);">Cuestionario en Actualización</h3>
          <p style="color:var(--text-muted); font-size:0.88rem;">La Jefatura no ha añadido preguntas todavía a este formulario.</p>
        </div>
      `;
      return;
    }

    if (currentExamState.submitted) {
      renderK9ExamResults(container, exam);
      return;
    }

    if (currentExamState.stepIndex >= total) currentExamState.stepIndex = total - 1;
    if (currentExamState.stepIndex < 0) currentExamState.stepIndex = 0;

    const currentQ = questions[currentExamState.stepIndex];
    const progressPct = Math.round(((currentExamState.stepIndex + 1) / total) * 100);
    const selectedOpt = currentExamState.answers[currentExamState.stepIndex];

    container.innerHTML = `
      <div class="quiz-progress-wrap">
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem;">
          <span style="font-family:var(--font-headline); color:var(--police-cyan); letter-spacing:0.06em;">
            PREGUNTA ${currentExamState.stepIndex + 1} DE ${total}
          </span>
          <span style="font-family:var(--font-tactical); color:var(--text-muted);">
            Aprobación: Mínimo ${exam.minScoreToPass || 8}/${total} aciertos (Cap. III Art. 10 y 11)
          </span>
        </div>
        <div class="quiz-progress-bar-bg">
          <div class="quiz-progress-bar-fill" style="width: ${progressPct}%;"></div>
        </div>
      </div>

      <div class="quiz-question-box">
        <div class="quiz-question-title">
          ${currentExamState.stepIndex + 1}. ${esc(currentQ.question)}
        </div>

        <div class="quiz-options-list">
          ${(currentQ.options || []).map((opt, oIdx) => {
            const isSelected = selectedOpt === oIdx;
            const letter = ['A', 'B', 'C', 'D', 'E'][oIdx] || (oIdx + 1);
            return `
              <div class="quiz-option-item ${isSelected ? 'selected' : ''}" onclick="window.chooseQuizOption(${oIdx})">
                <span class="quiz-option-letter">${letter}</span>
                <span class="quiz-option-text">${esc(opt)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem;">
        <button type="button" class="btn-tactical btn-tactical-outline" onclick="window.prevQuizStep()" ${currentExamState.stepIndex === 0 ? 'disabled style="opacity:0.4; pointer-events:none;"' : ''}>
          ← Anterior
        </button>

        <div style="font-size:0.8rem; color:var(--text-subtle);">
          ${Object.keys(currentExamState.answers).length} de ${total} respondidas
        </div>

        ${currentExamState.stepIndex < total - 1 ? `
          <button type="button" class="btn-tactical btn-tactical-primary" onclick="window.nextQuizStep()">
            Siguiente →
          </button>
        ` : `
          <button type="button" class="btn-tactical btn-tactical-gold" onclick="window.submitK9Exam()" style="box-shadow:0 0 15px rgba(255,209,102,0.4);">
            ✓ Calificar Examen
          </button>
        `}
      </div>
    `;
  }

  window.chooseQuizOption = function (optIndex) {
    currentExamState.answers[currentExamState.stepIndex] = optIndex;
    if (window.K9Audio) window.K9Audio.playTacticalClick();
    renderK9ExamStep();
  };

  window.nextQuizStep = function () {
    const exam = window.K9Store ? window.K9Store.getExam(currentExamState.examId) : null;
    const total = exam ? (exam.questions || []).length : 0;
    if (currentExamState.stepIndex < total - 1) {
      currentExamState.stepIndex++;
      if (window.K9Audio) window.K9Audio.playTacticalClick();
      renderK9ExamStep();
    }
  };

  window.prevQuizStep = function () {
    if (currentExamState.stepIndex > 0) {
      currentExamState.stepIndex--;
      if (window.K9Audio) window.K9Audio.playTacticalClick();
      renderK9ExamStep();
    }
  };

  window.submitK9Exam = function () {
    const exam = window.K9Store ? window.K9Store.getExam(currentExamState.examId) : null;
    if (!exam) return;

    const questions = exam.questions || [];
    const total = questions.length;
    const answeredCount = Object.keys(currentExamState.answers).length;

    if (answeredCount < total) {
      const confirmSubmit = confirm(`Aviso de Evaluación:\nHas respondido ${answeredCount} de las ${total} preguntas.\n\n¿Deseas enviar el examen ahora? Las preguntas sin responder contarán como incorrectas.`);
      if (!confirmSubmit) return;
    }

    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
    if (!user) return;

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (currentExamState.answers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const minPass = exam.minScoreToPass || 8;
    const passed = correctCount >= minPass;
    const certCode = passed ? ('K9-CERT-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase()) : null;

    let submission = null;
    if (window.K9Store) {
      submission = window.K9Store.recordExamSubmission({
        examId: exam.id,
        examTitle: exam.title,
        agentId: user.id,
        agentName: user.name,
        agentPlaca: user.placa,
        agentRank: user.rank,
        agentDiscord: user.discordUsername,
        score: correctCount,
        totalQuestions: total,
        passed,
        certCode,
        answers: currentExamState.answers
      });
    }

    currentExamState.submitted = true;
    currentExamState.result = submission || {
      score: correctCount,
      totalQuestions: total,
      scorePercent: Math.round((correctCount / total) * 100),
      passed,
      certCode,
      answers: currentExamState.answers
    };

    if (passed) {
      if (window.K9Audio) window.K9Audio.playRadioChirp();
      if (typeof showToast === 'function') {
        showToast(`🎉 ¡HABILITADO! Superaste el Examen Teórico K9 (${correctCount}/${total}). Certificado oficial registrado en tu perfil.`, 'success');
      }
    } else {
      if (window.K9Audio) window.K9Audio.playAlert();
      if (typeof showToast === 'function') {
        showToast(`Puntuación: ${correctCount}/${total}. Se requieren mínimo ${minPass} aciertos reglamentarios. Repasa la normativa e inténtalo de nuevo.`, 'warning');
      }
    }

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    else if (window.K9Supabase && window.K9Supabase.isConfigured()) window.K9Supabase.push();

    renderK9ExamStep();
    if (window.currentView === 'perfil' && typeof window.renderMemberProfile === 'function') window.renderMemberProfile();
  };

  function renderK9ExamResults(container, exam) {
    const result = currentExamState.result;
    if (!result) return;

    const passed = result.passed;
    const questions = exam.questions || [];

    container.innerHTML = `
      <div style="text-align:center; padding:1rem 0 1.5rem 0;">
        <div style="font-size:3.5rem; margin-bottom:0.4rem;">${passed ? '🏅' : '⚠️'}</div>
        <h3 style="font-family:var(--font-headline); font-size:1.85rem; color:${passed ? '#ffd166' : '#ff5252'}; margin:0 0 0.4rem 0; letter-spacing:0.04em;">
          ${passed ? '¡HABILITACIÓN TEÓRICA K9 SUPERADA!' : 'EVALUACIÓN NO SUPERADA'}
        </h3>
        <p style="color:var(--text-muted); font-size:0.92rem; max-width:580px; margin:0 auto 1.25rem auto;">
          ${passed
            ? 'Has demostrado el dominio reglamentario exigido por el Capítulo III (Art. 10 y 11) de la Unidad Canina K9. Tu Certificado Oficial ha quedado emitido y registrado en tu perfil permanente.'
            : `Has obtenido <strong>${result.score}/${result.totalQuestions}</strong> aciertos. Se exige un mínimo de <strong>${exam.minScoreToPass || 8}/${result.totalQuestions}</strong> para la acreditación oficial. Repasa la normativa y vuelve a intentarlo.`}
        </p>

        <div style="display:inline-flex; align-items:center; gap:1.5rem; background:rgba(0,0,0,0.4); border:1px solid ${passed ? 'rgba(255,209,102,0.4)' : 'rgba(255,82,82,0.4)'}; padding:0.85rem 1.75rem; border-radius:12px; margin-bottom:1.5rem;">
          <div>
            <span style="font-size:0.75rem; color:var(--text-muted); display:block;">PUNTUACIÓN</span>
            <strong style="font-size:1.4rem; color:${passed ? '#00e676' : '#ff5252'}; font-family:var(--font-tactical);">${result.score} / ${result.totalQuestions}</strong>
          </div>
          <div style="width:1px; height:35px; background:rgba(255,255,255,0.1);"></div>
          <div>
            <span style="font-size:0.75rem; color:var(--text-muted); display:block;">PORCENTAJE</span>
            <strong style="font-size:1.4rem; color:#fff; font-family:var(--font-tactical);">${result.scorePercent}%</strong>
          </div>
          <div style="width:1px; height:35px; background:rgba(255,255,255,0.1);"></div>
          <div>
            <span style="font-size:0.75rem; color:var(--text-muted); display:block;">RESOLUCIÓN</span>
            <strong style="font-size:1rem; color:${passed ? '#ffd166' : '#ff5252'};">${passed ? 'APTO OPERATIVO' : 'NO APTO'}</strong>
          </div>
        </div>

        <div style="display:flex; justify-content:center; gap:0.85rem; flex-wrap:wrap;">
          ${passed ? `
            <button type="button" class="btn-tactical btn-tactical-gold" onclick="closeModal('modalK9Exam'); window.openK9CertificateModal();">
              <span>🏅</span> Ver Mi Certificado Oficial
            </button>
            <button type="button" class="btn-tactical btn-tactical-primary" onclick="closeModal('modalK9Exam'); window.switchMainView('perfil');">
              <span>🐕</span> Ir a Mi Perfil
            </button>
          ` : `
            <button type="button" class="btn-tactical btn-tactical-primary" onclick="window.openK9ExamModal('${exam.id}')">
              <span>🔄</span> Repetir Evaluación
            </button>
            <button type="button" class="btn-tactical btn-tactical-outline" onclick="closeModal('modalK9Exam'); window.switchGeneralSubtab('normativas');">
              <span>⚖️</span> Repasar Normativas
            </button>
          `}
        </div>
      </div>

      <!-- Revisión didáctica de preguntas -->
      <div style="border-top:1px solid var(--border-subtle); padding-top:1.25rem;">
        <h4 style="font-family:var(--font-headline); font-size:1rem; color:#fff; margin-bottom:1rem; letter-spacing:0.04em;">
          📋 REVISIÓN DIDÁCTICA Y FUNDAMENTOS
        </h4>
        <div style="display:flex; flex-direction:column; gap:0.75rem; max-height:360px; overflow-y:auto; padding-right:4px;">
          ${questions.map((q, idx) => {
            const userChoice = result.answers[idx];
            const isCorrect = userChoice === q.correctIndex;
            return `
              <div style="background:rgba(0,0,0,0.3); border-left:3px solid ${isCorrect ? '#00e676' : '#ff5252'}; border-radius:8px; padding:0.85rem 1rem;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; margin-bottom:0.35rem;">
                  <span style="font-weight:700; color:#fff; font-size:0.88rem;">${idx + 1}. ${esc(q.question)}</span>
                  <span style="font-size:0.75rem; font-family:var(--font-tactical); font-weight:700; color:${isCorrect ? '#00e676' : '#ff5252'}; background:${isCorrect ? 'rgba(0,230,118,0.15)' : 'rgba(255,82,82,0.15)'}; padding:0.15rem 0.45rem; border-radius:4px;">
                    ${isCorrect ? '✓ CORRECTA' : '✕ INCORRECTA'}
                  </span>
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.35rem;">
                  Tu respuesta: <strong>${userChoice !== undefined ? esc(q.options[userChoice] || 'Sin respuesta') : 'Sin respuesta'}</strong>
                  ${!isCorrect ? ` · <span style="color:#00e676;">Respuesta correcta: <strong>${esc(q.options[q.correctIndex])}</strong></span>` : ''}
                </div>
                ${q.explanation ? `
                  <div style="font-size:0.78rem; color:#94a3b8; background:rgba(0,0,0,0.3); padding:0.4rem 0.6rem; border-radius:4px; line-height:1.4;">
                    💡 <strong>Fundamento:</strong> ${esc(q.explanation)}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Visualizador del Certificado de Habilitación
  window.openK9CertificateModal = function (certParam = null) {
    let cert = certParam;
    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;

    if (!cert && user && user.k9TheoryCert) {
      cert = user.k9TheoryCert;
    }

    if (!cert && user && window.K9Store) {
      const submissions = window.K9Store.getExamSubmissions();
      const passedSub = submissions.find(s => s.agentId === user.id && s.passed);
      if (passedSub) {
        cert = {
          certCode: passedSub.certCode,
          examTitle: passedSub.examTitle,
          score: passedSub.score,
          totalQuestions: passedSub.totalQuestions,
          scorePercent: passedSub.scorePercent,
          passedDate: passedSub.date,
          issuedBy: 'Jefatura de División K9 & Escuela de Instrucción LSPD',
          agentName: passedSub.agentName,
          agentPlaca: passedSub.agentPlaca,
          agentRank: passedSub.agentRank,
          agentDiscord: passedSub.agentDiscord
        };
      }
    }

    if (!cert) {
      if (typeof showToast === 'function') showToast('Aún no cuentas con un Certificado de Habilitación Teórica K9 emitido.', 'warning');
      return;
    }

    const container = document.getElementById('k9CertContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="tactical-k9-certificate-card" id="printableK9Cert">
        <img src="assets/images/emblem.jpg" class="cert-watermark-emblem" alt="Emblema K9" onerror="this.style.display='none'">

        <div class="cert-header-gold">
          DEPARTAMENTO DE POLICÍA DE LOS SANTOS · DIVISIÓN CANINA K-9
        </div>
        <h2 class="cert-main-title">
          CERTIFICADO DE HABILITACIÓN TEÓRICA K9
        </h2>
        <div class="cert-sub-title">
          ACREDITACIÓN DE APTITUD OPERATIVA Y FORMACIÓN REGLAMENTARIA (CAPÍTULO III · ART. 10 Y 11)
        </div>

        <p style="font-size:0.95rem; color:#cbd5e1; max-width:640px; margin:0 auto; line-height:1.6;">
          Por cuanto el/la Oficial debidamente identificado/a ha superado de manera satisfactoria el proceso de selección y el examen teórico oficial sobre el Reglamento General K9, simulacros operacionales, protocolos de sujeción táctica y código ético de servicio en binomio:
        </p>

        <div class="cert-recipient-name">
          ${esc(cert.agentName)}
        </div>
        <div style="font-family:var(--font-headline); font-size:1rem; color:#fff; letter-spacing:0.08em; margin-bottom:1.5rem;">
          PLACA OFICIAL: <span style="color:var(--police-cyan);">${esc(cert.agentPlaca || 'S/P')}</span> · RANGO: <span style="color:#ffd166;">${esc(cert.agentRank || 'Oficial')}</span>
        </div>

        <div style="display:flex; justify-content:center; align-items:center; gap:2.5rem; flex-wrap:wrap; margin:1.5rem 0 2rem 0;">
          <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,209,102,0.3); border-radius:10px; padding:0.65rem 1.25rem; font-family:var(--font-tactical);">
            <span style="font-size:0.72rem; color:var(--text-muted); display:block;">CALIFICACIÓN OFICIAL</span>
            <span style="font-size:1.25rem; color:#00e676; font-weight:700;">${cert.score}/${cert.totalQuestions || 10} (${cert.scorePercent || 90}%) · APTO</span>
          </div>

          <div class="cert-seal-stamp">
            <span style="font-size:1.1rem; margin-bottom:2px;">★</span>
            <span>HABILITADO</span>
            <span style="font-size:0.55rem; opacity:0.8;">LSPD K-9</span>
          </div>

          <div style="background:rgba(0,0,0,0.5); border:1px solid rgba(255,209,102,0.3); border-radius:10px; padding:0.65rem 1.25rem; font-family:var(--font-tactical);">
            <span style="font-size:0.72rem; color:var(--text-muted); display:block;">FECHA DE EMISIÓN</span>
            <span style="font-size:1rem; color:#fff;">${cert.passedDate || new Date().toLocaleDateString('es-ES')}</span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; max-width:600px; margin:0 auto; padding-top:1.25rem; border-top:1px solid rgba(255,209,102,0.25); font-size:0.82rem;">
          <div>
            <div style="border-bottom:1px solid rgba(255,255,255,0.4); width:180px; margin:0 auto 0.4rem auto; height:30px;"></div>
            <strong style="color:#fff; display:block;">Jefatura de División K9</strong>
            <span style="color:var(--text-subtle); font-size:0.75rem;">Mando Central LSPD</span>
          </div>
          <div>
            <div style="border-bottom:1px solid rgba(255,255,255,0.4); width:180px; margin:0 auto 0.4rem auto; height:30px;"></div>
            <strong style="color:#fff; display:block;">Coordinación de Formación</strong>
            <span style="color:var(--text-subtle); font-size:0.75rem;">Academia Táctica Canina</span>
          </div>
        </div>

        <div style="margin-top:1.75rem; font-size:0.72rem; color:var(--text-subtle); font-family:var(--font-tactical);">
          CÓDIGO SEGURO DE VERIFICACIÓN (CSV): <code style="color:var(--police-cyan); font-weight:700;">${cert.certCode || 'K9-CERT-2026-VAL'}</code> · REGISTRADO EN SAN ANDREAS POLICE DEPARTMENT
        </div>
      </div>

      <div class="cert-print-actions" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-top:1.25rem;">
        <span style="font-size:0.78rem; color:var(--text-muted);">
          Acreditación permanente vinculada a tu expediente oficial de Discord.
        </span>
        <div style="display:flex; gap:0.6rem;">
          <button type="button" class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="navigator.clipboard.writeText('${cert.certCode || ''}'); if(typeof showToast==='function') showToast('Código de certificación copiado al portapapeles', 'info');">
            📋 Copiar Código
          </button>
          <button type="button" class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="window.print()">
            🖨️ Imprimir / Guardar en PDF
          </button>
          <button type="button" class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="closeModal('modalK9Cert')">
            Cerrar
          </button>
        </div>
      </div>
    `;

    if (typeof openModal === 'function') openModal('modalK9Cert');
  };

  // =============================================================================
  // 4. VISTA PÚBLICA DE EXAMEN (SUBTAB 'EXAMEN' EN VISTA INICIO)
  // =============================================================================

  function renderK9ExamSection(container) {
    if (!container) return;
    const user = window.K9Auth ? window.K9Auth.getCurrentUser() : null;
    const exam = window.K9Store ? window.K9Store.getExam('exam_acceso_k9') : null;
    const hasCert = user && user.k9TheoryCert;
    const isJef = window.K9Auth ? window.K9Auth.isJefaturaMember() : false;

    container.innerHTML = `
      <div style="max-width:920px; margin:0 auto; padding:1rem 0;">
        <!-- Banner de Academia Táctica K9 -->
        <div style="background:radial-gradient(circle at top right, rgba(0,229,255,0.15), rgba(16,24,43,0.95)), var(--bg-surface); border:1px solid var(--border-tactical); border-radius:18px; padding:2rem 2.25rem; margin-bottom:2rem; box-shadow:0 15px 35px rgba(0,0,0,0.6);">
          <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(0,229,255,0.1); border:1px solid rgba(0,229,255,0.3); padding:0.25rem 0.75rem; border-radius:20px; font-size:0.75rem; color:var(--police-cyan); font-family:var(--font-headline); letter-spacing:0.08em; margin-bottom:0.75rem;">
            <span>🎓</span> FORMACIÓN TEÓRICA REGLAMENTARIA · CAPÍTULO III
          </div>

          <h2 style="font-family:var(--font-headline); font-size:2rem; color:#fff; letter-spacing:0.04em; margin:0 0 0.5rem 0;">
            TEST TEÓRICO DE ACCESO A LA UNIDAD CANINA K9
          </h2>
          <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.6; max-width:750px; margin:0 0 1.5rem 0;">
            Conforme a lo dispuesto en los <strong>Artículos 10 y 11 del Reglamento General</strong>, todo oficial o aspirante debe acreditar el conocimiento de los procedimientos policiales con canes, obediencia táctica, órdenes verbales (Fass/Aus), simulacros operativos y límites éticos para obtener el <strong>Certificado Oficial de Habilitación Teórica K9</strong>.
          </p>

          ${hasCert ? `
            <div style="background:rgba(255,209,102,0.1); border:1px solid rgba(255,209,102,0.35); border-radius:12px; padding:1.25rem 1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
              <div style="display:flex; align-items:center; gap:0.85rem;">
                <span style="font-size:2rem;">🏅</span>
                <div>
                  <div style="color:#ffd166; font-weight:700; font-size:1.05rem;">
                    ¡DISPONES DEL CERTIFICADO DE HABILITACIÓN TEÓRICA K9!
                  </div>
                  <div style="font-size:0.82rem; color:#cbd5e1;">
                    Código: <code style="color:var(--police-cyan); font-weight:700;">${user.k9TheoryCert.certCode}</code> · Superado el ${user.k9TheoryCert.passedDate} (${user.k9TheoryCert.score}/${user.k9TheoryCert.totalQuestions} aciertos)
                  </div>
                </div>
              </div>
              <div style="display:flex; gap:0.6rem;">
                <button class="btn-tactical btn-tactical-gold" onclick="window.openK9CertificateModal()">
                  <span>🏅</span> Ver Mi Certificado
                </button>
                <button class="btn-tactical btn-tactical-outline" onclick="window.openK9ExamModal('exam_acceso_k9')">
                  <span>🔄</span> Repetir Test
                </button>
              </div>
            </div>
          ` : `
            <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center; margin-bottom:1.5rem;">
              <button class="btn-tactical btn-tactical-primary" onclick="window.openK9ExamModal('exam_acceso_k9')" style="padding:0.85rem 1.75rem; font-size:1rem; box-shadow:0 0 20px rgba(0,229,255,0.35);">
                <span>📝</span> Iniciar Cuestionario de Acceso K9 (10 Preguntas)
              </button>
              ${isJef ? `
                <button class="btn-tactical btn-tactical-gold" onclick="window.switchMainView('jefatura'); window.renderJefaturaSubtab('examen_k9');">
                  <span>👑</span> Gestionar Preguntas en Jefatura
                </button>
              ` : ''}
            </div>
          `}

          <!-- Criterios de Evaluación Táctica -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:1rem; border-top:1px solid rgba(255,255,255,0.08); padding-top:1.5rem;">
            <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem;">
              <span style="font-size:1.25rem;">⚖️</span>
              <h4 style="font-family:var(--font-headline); font-size:0.85rem; color:#fff; margin:0.4rem 0 0.2rem 0;">REQUISITO ART. 10</h4>
              <p style="font-size:0.78rem; color:var(--text-muted); margin:0;">Rango mínimo Oficial II, historial disciplinario limpio y disponibilidad formativa.</p>
            </div>
            <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem;">
              <span style="font-size:1.25rem;">📋</span>
              <h4 style="font-family:var(--font-headline); font-size:0.85rem; color:#fff; margin:0.4rem 0 0.2rem 0;">10 PREGUNTAS CLAVE</h4>
              <p style="font-size:0.78rem; color:var(--text-muted); margin:0;">Reglamento general, fases de familiarización, obediencia y simulacros.</p>
            </div>
            <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem;">
              <span style="font-size:1.25rem;">🏅</span>
              <h4 style="font-family:var(--font-headline); font-size:0.85rem; color:#fff; margin:0.4rem 0 0.2rem 0;">APROBACIÓN (8/10)</h4>
              <p style="font-size:0.78rem; color:var(--text-muted); margin:0;">Superar el 80% genera automáticamente el Certificado Oficial en tu perfil.</p>
            </div>
          </div>
        </div>

        <!-- Temario Evaluado -->
        <div style="background:var(--bg-surface); border:1px solid var(--border-tactical); border-radius:14px; padding:1.5rem; margin-bottom:1.5rem;">
          <h3 style="font-family:var(--font-headline); font-size:1.15rem; color:#fff; margin-bottom:1rem; letter-spacing:0.04em;">
            📖 CONTENIDO MATERIA DEL TEST (CAPÍTULO III · ART. 10 Y 11)
          </h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; font-size:0.85rem; color:#cbd5e1;">
            <div>
              <strong style="color:var(--police-cyan); display:block; margin-bottom:0.3rem;">MÓDULO 1: Organización & Cadena de Mando</strong>
              <ul style="margin:0; padding-left:1.2rem; line-height:1.6; color:var(--text-muted);">
                <li>Art. 5: Dependencia orgánica y sujeción jerárquica.</li>
                <li>Art. 6 a 9: Funciones de Coordinador, Instructor, Agente Guía y Aspirante.</li>
                <li>Límites del aspirante en período de pruebas.</li>
              </ul>
            </div>
            <div>
              <strong style="color:var(--police-cyan); display:block; margin-bottom:0.3rem;">MÓDULO 2: Proceso de Selección & Fases (Art. 10 y 11)</strong>
              <ul style="margin:0; padding-left:1.2rem; line-height:1.6; color:var(--text-muted);">
                <li>Fases: Solicitud, psicotécnico, revisión y evaluación final.</li>
                <li>Fase 1 a 4 del Manual de Instrucción: Familiarización y Obediencia.</li>
                <li>Simulacros de detección, seguimiento y detención.</li>
              </ul>
            </div>
            <div>
              <strong style="color:var(--police-cyan); display:block; margin-bottom:0.3rem;">MÓDULO 3: Comandos & Uso Proporcional de la Fuerza</strong>
              <ul style="margin:0; padding-left:1.2rem; line-height:1.6; color:var(--text-muted);">
                <li>Orden «Fass»: Amenaza grave e inminente tras avisos verbales.</li>
                <li>Orden «Aus»: Suelta inmediata tras la neutralización del sospechoso.</li>
                <li>Protocolo radial obligatorio antes de desplegar al can.</li>
              </ul>
            </div>
            <div>
              <strong style="color:var(--police-cyan); display:block; margin-bottom:0.3rem;">MÓDULO 4: Ética, Binomio y Responsabilidad</strong>
              <ul style="margin:0; padding-left:1.2rem; line-height:1.6; color:var(--text-muted);">
                <li>El perro no sustituye al agente investigador ni decide culpabilidad.</li>
                <li>Prohibición estricta de falsear marcajes en registros.</li>
                <li>Art. 15: Responsabilidad legal y operativa exclusiva del guía.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  window.renderK9ExamSection = renderK9ExamSection;

  // =============================================================================
  // 5. PANEL DE JEFATURA: CONTROL DE PATRULLAJES & HORAS (SUBTAB 'PATRULLAS')
  // =============================================================================

  function renderJefaturaPatrolsSection(container) {
    if (!container) return;

    const activePatrols = window.K9Store ? window.K9Store.getActivePatrols() : [];
    const sessions = window.K9Store ? window.K9Store.getPatrolSessions() : [];
    const allUsers = window.K9Store ? window.K9Store.getUsers() : [];

    // Calcular estadísticas globales
    const totalMinutesGlobal = allUsers.reduce((acc, u) => acc + (u.patrolMinutesTotal || 0), 0);
    const totalHoursGlobal = Math.round((totalMinutesGlobal / 60) * 10) / 10;
    const completedSessionsCount = sessions.length;

    container.innerHTML = `
      <div class="tactical-table-wrapper" style="padding:1.5rem;">
        
        <!-- Encabezado de la Sección de Patrullaje -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
          <div>
            <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(0,230,118,0.1); border:1px solid rgba(0,230,118,0.3); padding:0.25rem 0.75rem; border-radius:20px; font-size:0.75rem; color:#00e676; font-family:var(--font-headline); letter-spacing:0.08em; margin-bottom:0.5rem;">
              <span>⏱️</span> SUPERVISIÓN EN TIEMPO REAL & AUDITORÍA DE TURNOS
            </div>
            <h3 style="font-family:var(--font-headline); font-size:1.6rem; color:#fff; letter-spacing:0.04em; margin:0 0 0.35rem 0;">
              CONTROL DE PATRULLAJES & HORAS DE SERVICIO K9
            </h3>
            <p style="color:var(--text-muted); font-size:0.86rem; margin:0;">
              Monitorización de agentes en patrulla con can, cómputo acumulado de minutos/horas y cierre forzoso de 10-10 por Mando.
            </p>
          </div>

          <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
            <button class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="window.openAdjustPatrolHoursModal()">
              <span>⏱️</span> Ajustar Horas de Agente
            </button>
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.exportPatrolsReportCSV()">
              <span>📥</span> Exportar Informe CSV
            </button>
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.renderJefaturaSubtab('patrullas')">
              <span>🔄</span> Refrescar
            </button>
          </div>
        </div>

        <!-- Métricas Rápidas -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:1.75rem;">
          <div style="background:rgba(16,24,43,0.7); border:1px solid rgba(0,230,118,0.35); border-radius:12px; padding:1rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-headline); letter-spacing:0.06em;">BINOMIOS EN PATRULLA AHORA</span>
            <div style="font-size:1.85rem; color:#00e676; font-family:var(--font-tactical); font-weight:700; margin-top:0.25rem;">
              ${activePatrols.length}
            </div>
          </div>
          <div style="background:rgba(16,24,43,0.7); border:1px solid rgba(0,229,255,0.3); border-radius:12px; padding:1rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-headline); letter-spacing:0.06em;">TOTAL HORAS ACUMULADAS</span>
            <div style="font-size:1.85rem; color:var(--police-cyan); font-family:var(--font-tactical); font-weight:700; margin-top:0.25rem;">
              ${totalHoursGlobal} hrs
            </div>
          </div>
          <div style="background:rgba(16,24,43,0.7); border:1px solid rgba(255,209,102,0.3); border-radius:12px; padding:1rem;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-headline); letter-spacing:0.06em;">TURNOS COMPLETADOS</span>
            <div style="font-size:1.85rem; color:#ffd166; font-family:var(--font-tactical); font-weight:700; margin-top:0.25rem;">
              ${completedSessionsCount}
            </div>
          </div>
        </div>

        <!-- 1. Binomios Activos en Directo -->
        <div style="background:rgba(13,20,36,0.85); border:1px solid rgba(0,230,118,0.35); border-radius:14px; padding:1.25rem; margin-bottom:2rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="live-radar-dot"></span>
              <h4 style="font-family:var(--font-headline); font-size:1.05rem; color:#fff; margin:0; letter-spacing:0.04em;">
                BINOMIOS EN SERVICIO ACTIVO (TIEMPO REAL)
              </h4>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted);">
              Los agentes pueden iniciar patrulla con el switch 🟢 Cod: En servicio con can en la barra superior
            </span>
          </div>

          ${activePatrols.length === 0 ? `
            <div style="text-align:center; padding:1.75rem 1rem; color:var(--text-muted); font-size:0.86rem;">
              <span>🔴</span> No hay agentes en patrulla en este momento. Todos los binomios figuran en <strong>10-10</strong>.
            </div>
          ` : `
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(310px, 1fr)); gap:1rem;">
              ${activePatrols.map(p => {
                const elapsed = Date.now() - p.startTime;
                return `
                  <div style="background:rgba(0,0,0,0.4); border:1px solid rgba(0,230,118,0.4); border-radius:12px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div style="display:flex; align-items:center; gap:0.6rem;">
                        <img src="${p.agentAvatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid #00e676;" onerror="this.src='assets/images/emblem.jpg'">
                        <div>
                          <strong style="color:#fff; font-size:0.9rem;">${esc(p.agentName)}</strong>
                          <div style="font-size:0.72rem; color:#a5b4fc;">Placa ${esc(p.agentPlaca)} · ${esc(p.agentRank)}</div>
                        </div>
                      </div>
                      <span style="color:#00e676; font-family:var(--font-tactical); font-weight:700; font-size:0.92rem;" data-patrol-timer-id="${p.id}">
                        ⏱️ ${formatPatrolTime(elapsed)}
                      </span>
                    </div>

                    <div style="font-size:0.8rem; color:var(--text-muted); background:rgba(255,255,255,0.03); padding:0.45rem 0.6rem; border-radius:6px;">
                      <div>🐕 <strong>Can:</strong> ${esc(p.dogName)} (${esc(p.dogBreed)})</div>
                      <div>📍 <strong>Sector:</strong> ${esc(p.sector)}</div>
                      <div>⏰ <strong>Inicio:</strong> ${new Date(p.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                      <button class="btn-tactical btn-tactical-danger btn-tactical-sm" style="font-size:0.72rem; padding:0.25rem 0.6rem;" onclick="window.forceEndPatrolByJefatura('${p.agentId}')">
                        🔴 Cerrar 10-10 por Mando
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- 2. Tabla de Horas Acumuladas por Agente -->
        <div style="background:rgba(16,24,43,0.7); border:1px solid var(--border-tactical); border-radius:14px; padding:1.25rem; margin-bottom:2rem;">
          <h4 style="font-family:var(--font-headline); font-size:1.05rem; color:#fff; margin:0 0 1rem 0; letter-spacing:0.04em;">
            👮 REGISTRO GENERAL DE HORAS & MINUTOS POR AGENTE
          </h4>

          <div style="overflow-x:auto;">
            <table class="tactical-table" style="width:100%;">
              <thead>
                <tr>
                  <th>AGENTE / PLACA</th>
                  <th>RANGO</th>
                  <th>CAN ASIGNADO</th>
                  <th>ESTADO ACTUAL</th>
                  <th>MINUTOS TOTALES</th>
                  <th>HORAS TOTALES</th>
                  <th>ÚLTIMA PATRULLA</th>
                  <th style="text-align:center;">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                ${allUsers.map(u => {
                  const isActive = activePatrols.some(p => p.agentId === u.id);
                  const min = u.patrolMinutesTotal || 0;
                  const hrs = u.patrolHoursTotal || Math.round((min / 60) * 10) / 10;
                  const assignedDog = (window.K9Store.getDogs() || []).find(d => d.id === u.assignedDogId);
                  return `
                    <tr>
                      <td>
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                          <img src="${u.avatar}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" onerror="this.src='assets/images/emblem.jpg'">
                          <div>
                            <strong style="color:#fff;">${esc(u.name)}</strong>
                            <span style="display:block; font-size:0.72rem; color:var(--text-subtle);">Placa [${esc(u.placa)}]</span>
                          </div>
                        </div>
                      </td>
                      <td><span class="rank-badge">${esc(u.rank)}</span></td>
                      <td>${assignedDog ? `🐕 ${esc(assignedDog.name)}` : '<span style="color:var(--text-subtle);">Sin can</span>'}</td>
                      <td>
                        ${isActive
                          ? '<span class="status-pill-subtle status-apto" style="color:#00e676; border-color:#00e676;">🟢 EN SERVICIO</span>'
                          : '<span class="status-pill-subtle" style="color:#ff8585; border-color:rgba(255,82,82,0.4);">🔴 10-10</span>'}
                      </td>
                      <td><strong style="font-family:var(--font-tactical); color:#fff;">${min} min</strong></td>
                      <td><strong style="font-family:var(--font-tactical); color:var(--police-cyan); font-size:0.95rem;">${hrs} hrs</strong></td>
                      <td>${u.lastPatrolDate || '—'}</td>
                      <td style="text-align:center;">
                        <button class="btn-tactical btn-tactical-outline btn-tactical-sm" style="font-size:0.72rem; padding:0.25rem 0.55rem;" onclick="window.openAdjustPatrolHoursModal('${u.id}')">
                          ✏️ Ajustar
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. Historial de Turnos de Patrulla Completados -->
        <div style="background:rgba(16,24,43,0.7); border:1px solid var(--border-tactical); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:1rem;">
            <h4 style="font-family:var(--font-headline); font-size:1.05rem; color:#fff; margin:0; letter-spacing:0.04em;">
              📜 HISTORIAL AUDITADO DE SESIONES DE PATRULLA
            </h4>
            <input type="text" id="patrolHistorySearch" class="form-input-tactical" placeholder="Buscar por agente, placa o sector..." style="width:240px; font-size:0.8rem; padding:0.35rem 0.75rem;" oninput="window.filterPatrolHistoryTable(this.value)">
          </div>

          <div style="overflow-x:auto;">
            <table class="tactical-table" style="width:100%;" id="patrolSessionsTable">
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>AGENTE</th>
                  <th>CAN</th>
                  <th>SECTOR</th>
                  <th>HORARIO</th>
                  <th>DURACIÓN</th>
                  <th>CIERRE</th>
                  <th>OBSERVACIONES</th>
                  <th style="text-align:center;">ELIMINAR</th>
                </tr>
              </thead>
              <tbody id="patrolSessionsTbody">
                ${sessions.length === 0 ? `
                  <tr><td colspan="9" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No hay sesiones de patrullaje registradas aún.</td></tr>
                ` : sessions.map(s => `
                  <tr>
                    <td><strong>${s.date}</strong></td>
                    <td>
                      <strong>${esc(s.agentName)}</strong>
                      <span style="display:block; font-size:0.72rem; color:var(--text-subtle);">[Placa ${esc(s.agentPlaca)}]</span>
                    </td>
                    <td>🐕 ${esc(s.dogName)}</td>
                    <td><span style="font-size:0.78rem; color:var(--text-muted);">${esc(s.sector)}</span></td>
                    <td style="font-size:0.78rem;">${s.timeStart} → ${s.timeEnd}</td>
                    <td>
                      <span style="font-family:var(--font-tactical); color:#00e676; font-weight:700;">
                        ${s.durationFormatted || (s.durationMinutes + ' min')}
                      </span>
                    </td>
                    <td><span style="font-size:0.72rem; color:#a5b4fc;">${esc(s.closedBy || 'Agente')}</span></td>
                    <td style="font-size:0.78rem; max-width:220px; color:#cbd5e1;">${esc(s.notes || '—')}</td>
                    <td style="text-align:center;">
                      <button class="btn-tactical btn-tactical-outline btn-tactical-sm" style="color:#ff5252; border-color:rgba(255,82,82,0.4); padding:0.2rem 0.5rem; font-size:0.72rem;" onclick="window.deletePatrolSession('${s.id}')">
                        🗑️
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }
  window.renderJefaturaPatrolsSection = renderJefaturaPatrolsSection;

  // Filtrar tabla de sesiones de patrulla
  window.filterPatrolHistoryTable = function (query) {
    const q = (query || '').toLowerCase();
    const rows = document.querySelectorAll('#patrolSessionsTbody tr');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(q) ? '' : 'none';
    });
  };

  // Cierre de patrulla forzoso por Mando
  window.forceEndPatrolByJefatura = function (agentId) {
    const confirmClose = confirm('¿Confirmas el cierre de servicio 10-10 para este agente por orden de Mando?');
    if (!confirmClose) return;

    if (window.K9Store) {
      window.K9Store.endPatrol(agentId, 'Cierre de servicio 10-10 decretado por Mando de Jefatura.', true);
    }
    if (typeof showToast === 'function') showToast('Servicio 10-10 cerrado por Jefatura con éxito.', 'success');

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    else if (window.K9Supabase && window.K9Supabase.isConfigured()) window.K9Supabase.push();

    renderDutyHudSwitch();
    renderLiveBinomiosWidget();
    if (typeof window.refreshMapMarkers === 'function') window.refreshMapMarkers();
    renderJefaturaPatrolsSection(document.getElementById('jefaturaSubtabContent'));
  };

  // Eliminar sesión de patrullaje
  window.deletePatrolSession = function (sessionId) {
    const confirmDel = confirm('¿Estás seguro de eliminar este registro histórico de patrullaje?');
    if (!confirmDel) return;

    if (window.K9Store) {
      const list = window.K9Store.getPatrolSessions().filter(s => s.id !== sessionId);
      window.K9Store.savePatrolSessions(list);
    }
    if (typeof showToast === 'function') showToast('Registro de patrullaje eliminado.', 'info');

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    renderJefaturaPatrolsSection(document.getElementById('jefaturaSubtabContent'));
  };

  // Modal para ajustar horas manualmente
  window.openAdjustPatrolHoursModal = function (targetAgentId = null) {
    const sel = document.getElementById('adjustAgentSelect');
    if (sel && window.K9Store) {
      const users = window.K9Store.getUsers();
      sel.innerHTML = users.map(u => `
        <option value="${u.id}" ${u.id === targetAgentId ? 'selected' : ''}>
          ${esc(u.name)} [Placa ${esc(u.placa)}] · ${u.patrolHoursTotal || 0} hrs actuales
        </option>
      `).join('');
    }
    const minInput = document.getElementById('adjustMinutesInput');
    const reasonInput = document.getElementById('adjustReasonInput');
    if (minInput) minInput.value = '';
    if (reasonInput) reasonInput.value = '';
    if (typeof openModal === 'function') openModal('modalAdjustPatrolHours');
  };

  window.handleSaveAdjustPatrolHours = function (e) {
    if (e) e.preventDefault();
    const sel = document.getElementById('adjustAgentSelect');
    const minInput = document.getElementById('adjustMinutesInput');
    const reasonInput = document.getElementById('adjustReasonInput');

    const agentId = sel ? sel.value : null;
    const minutesDelta = parseInt(minInput ? minInput.value : '0', 10);
    const reason = reasonInput ? reasonInput.value.trim() : 'Ajuste de Mando';

    if (!agentId || isNaN(minutesDelta)) {
      if (typeof showToast === 'function') showToast('Debes indicar un agente y los minutos a modificar.', 'warning');
      return;
    }

    if (window.K9Store) {
      const users = window.K9Store.getAllUsers();
      const user = users.find(u => u.id === agentId);
      if (user) {
        user.patrolMinutesTotal = Math.max(0, (user.patrolMinutesTotal || 0) + minutesDelta);
        user.patrolHoursTotal = Math.round((user.patrolMinutesTotal / 60) * 10) / 10;
        window.K9Store.save(window.STORAGE_KEYS.USERS, users);

        window.K9Store.addLog({
          type: 'patrol',
          emoji: '⏱️',
          title: 'Ajuste de Horas de Patrullaje',
          description: `Jefatura aplicó un ajuste de ${minutesDelta > 0 ? '+' : ''}${minutesDelta} minutos a ${user.name} [${user.placa}]. Motivo: ${reason}.`,
          author: 'Jefatura K9'
        });
      }
    }

    if (typeof closeModal === 'function') closeModal('modalAdjustPatrolHours');
    if (typeof showToast === 'function') showToast(`Ajuste de horas aplicado correctamente (${minutesDelta > 0 ? '+' : ''}${minutesDelta} min).`, 'success');

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    else if (window.K9Supabase && window.K9Supabase.isConfigured()) window.K9Supabase.push();

    renderJefaturaPatrolsSection(document.getElementById('jefaturaSubtabContent'));
  };

  // Exportar informe CSV de horas de agentes
  window.exportPatrolsReportCSV = function () {
    const users = window.K9Store ? window.K9Store.getUsers() : [];
    let csv = 'Nombre,Placa,Rango,Minutos Totales,Horas Totales,Estado Actual,Ultima Patrulla\n';
    users.forEach(u => {
      const min = u.patrolMinutesTotal || 0;
      const hrs = u.patrolHoursTotal || Math.round((min / 60) * 10) / 10;
      csv += `"${u.name}","${u.placa}","${u.rank}",${min},${hrs},"${u.serviceStatus || '10-10'}","${u.lastPatrolDate || '—'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `k9_horas_patrullaje_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Informe de horas exportado en CSV con éxito.', 'success');
  };

  // =============================================================================
  // 6. PANEL DE JEFATURA: GESTOR DE TEST K9, PREGUNTAS Y PERMISOS (SUBTAB 'EXAMEN_K9')
  // =============================================================================

  let jefaturaExamTabState = 'preguntas'; // 'preguntas' | 'certificados' | 'permisos'

  function renderJefaturaExamManagerSection(container) {
    if (!container) return;

    const exam = window.K9Store ? window.K9Store.getExam('exam_acceso_k9') : null;
    const submissions = window.K9Store ? window.K9Store.getExamSubmissions() : [];
    const questions = exam ? (exam.questions || []) : [];
    const allUsers = window.K9Store ? window.K9Store.getUsers() : [];

    container.innerHTML = `
      <div class="tactical-table-wrapper" style="padding:1.5rem;">
        
        <!-- Cabecera -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
          <div>
            <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(255,209,102,0.1); border:1px solid rgba(255,209,102,0.3); padding:0.25rem 0.75rem; border-radius:20px; font-size:0.75rem; color:#ffd166; font-family:var(--font-headline); letter-spacing:0.08em; margin-bottom:0.5rem;">
              <span>📝</span> ACADEMIA & GESTOR DE CUESTIONARIOS · ART. 10 Y 11
            </div>
            <h3 style="font-family:var(--font-headline); font-size:1.6rem; color:#fff; letter-spacing:0.04em; margin:0 0 0.35rem 0;">
              GESTOR DEL TEST TEÓRICO DE ACCESO K9
            </h3>
            <p style="color:var(--text-muted); font-size:0.86rem; margin:0;">
              Edición dinámica de preguntas, creación de nuevos formularios temáticos, control de aprobados y asignación de permisos a agentes específicos.
            </p>
          </div>

          <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
            <button class="btn-tactical btn-tactical-gold btn-tactical-sm" onclick="window.openNewExamQuestionModal('exam_acceso_k9')">
              <span>➕</span> Añadir Pregunta
            </button>
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.openExamSettingsModal('exam_acceso_k9')">
              <span>⚙️</span> Ajustes & Permisos
            </button>
            <button class="btn-tactical btn-tactical-outline btn-tactical-sm" onclick="window.promptCreateNewExamForm()">
              <span>📋</span> Crear Nuevo Formulario
            </button>
          </div>
        </div>

        <!-- Subtabs de Gestión del Examen -->
        <div class="subnav-tabs-row" style="margin-bottom:1.5rem;">
          <button class="subnav-pill-btn ${jefaturaExamTabState === 'preguntas' ? 'active' : ''}" onclick="window.switchJefaturaExamTab('preguntas')">
            ❓ Preguntas del Examen (${questions.length})
          </button>
          <button class="subnav-pill-btn ${jefaturaExamTabState === 'certificados' ? 'active' : ''}" onclick="window.switchJefaturaExamTab('certificados')">
            🏅 Evaluaciones & Certificados Emitidos (${submissions.length})
          </button>
          <button class="subnav-pill-btn ${jefaturaExamTabState === 'permisos' ? 'active' : ''}" onclick="window.switchJefaturaExamTab('permisos')">
            🔐 Control de Permisos Específicos
          </button>
        </div>

        <!-- Vista 1: Editor de Preguntas -->
        ${jefaturaExamTabState === 'preguntas' ? `
          <div style="background:rgba(16,24,43,0.7); border:1px solid var(--border-tactical); border-radius:14px; padding:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.75rem;">
              <div>
                <strong style="color:#fff; font-size:1.05rem;">${esc(exam.title)}</strong>
                <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
                  Mínimo para aprobar: <span style="color:#ffd166; font-weight:700;">${exam.minScoreToPass || 8} de ${questions.length}</span> aciertos reglamentarios
                </div>
              </div>
              <button class="btn-tactical btn-tactical-primary btn-tactical-sm" onclick="window.openK9ExamModal('${exam.id}')">
                <span>👁️</span> Previsualizar / Realizar Test
              </button>
            </div>

            <div style="display:flex; flex-direction:column; gap:1rem;">
              ${questions.map((q, qIdx) => `
                <div style="background:rgba(0,0,0,0.35); border:1px solid var(--border-subtle); border-radius:10px; padding:1rem;">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:0.75rem;">
                    <div style="display:flex; gap:0.5rem; align-items:flex-start;">
                      <span style="font-family:var(--font-tactical); font-size:0.8rem; background:rgba(0,229,255,0.15); color:var(--police-cyan); padding:0.15rem 0.5rem; border-radius:4px; font-weight:700;">
                        #${qIdx + 1}
                      </span>
                      <strong style="color:#fff; font-size:0.95rem; line-height:1.4;">${esc(q.question)}</strong>
                    </div>
                    <div style="display:flex; gap:0.4rem;">
                      <button class="btn-tactical btn-tactical-outline btn-tactical-sm" style="font-size:0.72rem; padding:0.2rem 0.55rem;" onclick="window.openEditExamQuestionModal('${q.id}', '${exam.id}')">
                        ✏️ Editar
                      </button>
                      <button class="btn-tactical btn-tactical-outline btn-tactical-sm" style="color:#ff5252; border-color:rgba(255,82,82,0.4); font-size:0.72rem; padding:0.2rem 0.55rem;" onclick="window.deleteExamQuestion('${q.id}', '${exam.id}')">
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.82rem; margin-bottom:0.5rem;">
                    ${(q.options || []).map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctIndex;
                      const letter = ['A', 'B', 'C', 'D'][oIdx] || (oIdx + 1);
                      return `
                        <div style="background:${isCorrect ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.02)'}; border:1px solid ${isCorrect ? '#00e676' : 'rgba(255,255,255,0.06)'}; padding:0.4rem 0.65rem; border-radius:6px; color:${isCorrect ? '#00e676' : '#cbd5e1'};">
                          <strong>${letter})</strong> ${esc(opt)} ${isCorrect ? '✓ (Correcta)' : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>

                  ${q.explanation ? `
                    <div style="font-size:0.76rem; color:#94a3b8; background:rgba(0,0,0,0.25); padding:0.35rem 0.6rem; border-radius:4px;">
                      💡 <strong>Justificación:</strong> ${esc(q.explanation)}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Vista 2: Registro de Evaluaciones y Certificados -->
        ${jefaturaExamTabState === 'certificados' ? `
          <div style="background:rgba(16,24,43,0.7); border:1px solid var(--border-tactical); border-radius:14px; padding:1.25rem;">
            <h4 style="font-family:var(--font-headline); font-size:1.05rem; color:#fff; margin:0 0 1rem 0; letter-spacing:0.04em;">
              🏅 ASPIRANTES EVALUADOS Y CERTIFICACIONES OFICIALES
            </h4>

            <div style="overflow-x:auto;">
              <table class="tactical-table" style="width:100%;">
                <thead>
                  <tr>
                    <th>FECHA</th>
                    <th>AGENTE</th>
                    <th>PLACA / RANGO</th>
                    <th>PUNTUACIÓN</th>
                    <th>ESTADO</th>
                    <th>CÓDIGO DE CERTIFICADO</th>
                    <th style="text-align:center;">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  ${submissions.length === 0 ? `
                    <tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No se han realizado exámenes aún.</td></tr>
                  ` : submissions.map(sub => `
                    <tr>
                      <td><strong>${sub.date}</strong></td>
                      <td><strong style="color:#fff;">${esc(sub.agentName)}</strong></td>
                      <td>${esc(sub.agentPlaca)} · ${esc(sub.agentRank)}</td>
                      <td>
                        <strong style="font-family:var(--font-tactical); color:${sub.passed ? '#00e676' : '#ff5252'}; font-size:0.95rem;">
                          ${sub.score}/${sub.totalQuestions || 10} (${sub.scorePercent}%)
                        </strong>
                      </td>
                      <td>
                        ${sub.passed
                          ? '<span class="status-pill-subtle status-apto" style="color:#ffd166; border-color:#ffd166;">APTO OPERATIVO</span>'
                          : '<span class="status-pill-subtle" style="color:#ff5252; border-color:rgba(255,82,82,0.4);">NO APTO</span>'}
                      </td>
                      <td>
                        ${sub.certCode
                          ? `<code style="color:var(--police-cyan); font-weight:700;">${esc(sub.certCode)}</code>`
                          : '<span style="color:var(--text-subtle);">Sin emitir</span>'}
                      </td>
                      <td style="text-align:center;">
                        <div style="display:flex; justify-content:center; gap:0.4rem;">
                          ${sub.passed ? `
                            <button class="btn-tactical btn-tactical-gold btn-tactical-sm" style="font-size:0.72rem; padding:0.2rem 0.5rem;" onclick='window.openK9CertificateModal(${JSON.stringify(sub)})'>
                              🏅 Ver Certificado
                            </button>
                          ` : ''}
                          <button class="btn-tactical btn-tactical-outline btn-tactical-sm" style="color:#ff5252; border-color:rgba(255,82,82,0.4); font-size:0.72rem; padding:0.2rem 0.5rem;" onclick="window.revokeExamSubmission('${sub.id}')">
                            🗑️ Revocar
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Vista 3: Control de Permisos Específicos -->
        ${jefaturaExamTabState === 'permisos' ? `
          <div style="background:rgba(16,24,43,0.7); border:1px solid var(--border-tactical); border-radius:14px; padding:1.25rem;">
            <h4 style="font-family:var(--font-headline); font-size:1.05rem; color:var(--tactical-gold); margin:0 0 0.5rem 0; letter-spacing:0.04em;">
              🔐 ASIGNACIÓN DE PERMISOS ESPECÍFICOS PARA EL TEST K9
            </h4>
            <p style="color:var(--text-muted); font-size:0.86rem; margin:0 0 1.25rem 0;">
              Por defecto, los miembros de la <strong>Jefatura LSPD</strong> y <strong>Coordinadores K9</strong> tienen acceso total. Desde este apartado puedes <strong>conceder permisos a alguien en concreto</strong> (como a un Instructor K9 evaluador) para gestionar, editar y calificar las preguntas del formulario sin necesidad de darle mando supremo global.
            </p>

            <div style="display:flex; flex-direction:column; gap:0.6rem; max-height:380px; overflow-y:auto; padding-right:4px;">
              ${allUsers.map(u => {
                const isJef = u.isJefatura || u.rank === 'Jefatura LSPD' || u.rank === 'Coordinador K9';
                const hasCustom = (exam.managersUserIds || []).includes(u.id) || (u.discordId && (exam.managersUserIds || []).includes(u.discordId));
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:8px; padding:0.65rem 1rem;">
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                      <img src="${u.avatar}" style="width:34px; height:34px; border-radius:50%; object-fit:cover;" onerror="this.src='assets/images/emblem.jpg'">
                      <div>
                        <strong style="color:#fff; font-size:0.88rem;">${esc(u.name)}</strong>
                        <div style="font-size:0.72rem; color:#a5b4fc;">Placa ${esc(u.placa)} · ${esc(u.rank)}</div>
                      </div>
                    </div>
                    <div>
                      ${isJef ? `
                        <span style="font-size:0.75rem; color:var(--tactical-gold); background:rgba(255,209,102,0.15); padding:0.2rem 0.6rem; border-radius:12px; font-weight:700;">
                          👑 Mando Supremo (Autorizado por Defecto)
                        </span>
                      ` : `
                        <button class="btn-tactical ${hasCustom ? 'btn-tactical-gold' : 'btn-tactical-outline'} btn-tactical-sm" style="font-size:0.75rem; padding:0.25rem 0.75rem;" onclick="window.toggleUserExamManagerPermission('${u.id}', '${exam.id}')">
                          ${hasCustom ? '✓ Permiso de Editor Activo' : '+ Conceder Permiso de Editor'}
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    `;
  }
  window.renderJefaturaExamManagerSection = renderJefaturaExamManagerSection;

  window.switchJefaturaExamTab = function (tab) {
    jefaturaExamTabState = tab;
    renderJefaturaExamManagerSection(document.getElementById('jefaturaSubtabContent'));
  };

  // Conceder / retirar permiso de edición a un agente específico
  window.toggleUserExamManagerPermission = function (userId, examId) {
    if (!window.K9Store) return;
    const exam = window.K9Store.getExam(examId);
    if (!exam) return;

    if (!Array.isArray(exam.managersUserIds)) exam.managersUserIds = [];
    const idx = exam.managersUserIds.indexOf(userId);
    if (idx >= 0) {
      exam.managersUserIds.splice(idx, 1);
      if (typeof showToast === 'function') showToast('Permiso de gestión de test revocado.', 'info');
    } else {
      exam.managersUserIds.push(userId);
      if (typeof showToast === 'function') showToast('¡Permiso de gestión concedido al agente exitosamente!', 'success');
    }

    window.K9Store.saveExam(exam);
    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    renderJefaturaExamManagerSection(document.getElementById('jefaturaSubtabContent'));
  };

  // Abrir modal de edición de pregunta
  window.openEditExamQuestionModal = function (qId, examId) {
    const exam = window.K9Store ? window.K9Store.getExam(examId) : null;
    if (!exam) return;

    const q = (exam.questions || []).find(x => x.id === qId);
    if (!q) return;

    const titleEl = document.getElementById('modalEditQuestionTitle');
    if (titleEl) titleEl.innerHTML = '<span>✏️</span> EDITAR PREGUNTA DEL EXAMEN';

    document.getElementById('editQuestionId').value = q.id;
    document.getElementById('editQuestionExamId').value = examId;
    document.getElementById('qText').value = q.question || '';
    document.getElementById('qExplanation').value = q.explanation || '';

    for (let i = 0; i < 4; i++) {
      const optInput = document.getElementById(`optText${i}`);
      const radio = document.getElementById(`radioOpt${i}`);
      if (optInput) optInput.value = (q.options && q.options[i]) ? q.options[i] : '';
      if (radio) radio.checked = (q.correctIndex === i);
    }

    if (typeof openModal === 'function') openModal('modalEditExamQuestion');
  };

  // Abrir modal para añadir nueva pregunta
  window.openNewExamQuestionModal = function (examId = 'exam_acceso_k9') {
    const titleEl = document.getElementById('modalEditQuestionTitle');
    if (titleEl) titleEl.innerHTML = '<span>➕</span> AÑADIR NUEVA PREGUNTA AL EXAMEN';

    document.getElementById('editQuestionId').value = '';
    document.getElementById('editQuestionExamId').value = examId;
    document.getElementById('qText').value = '';
    document.getElementById('qExplanation').value = '';

    for (let i = 0; i < 4; i++) {
      const optInput = document.getElementById(`optText${i}`);
      const radio = document.getElementById(`radioOpt${i}`);
      if (optInput) optInput.value = '';
      if (radio) radio.checked = (i === 0);
    }

    if (typeof openModal === 'function') openModal('modalEditExamQuestion');
  };

  // Guardar pregunta (nueva o editada)
  window.handleSaveExamQuestion = function (e) {
    if (e) e.preventDefault();
    const examId = document.getElementById('editQuestionExamId').value || 'exam_acceso_k9';
    const qId = document.getElementById('editQuestionId').value;
    const text = document.getElementById('qText').value.trim();
    const explanation = document.getElementById('qExplanation').value.trim();

    const options = [
      document.getElementById('optText0').value.trim(),
      document.getElementById('optText1').value.trim(),
      document.getElementById('optText2').value.trim(),
      document.getElementById('optText3').value.trim()
    ];

    let correctIndex = 0;
    const selectedRadio = document.querySelector('input[name="correctOptRadio"]:checked');
    if (selectedRadio) correctIndex = parseInt(selectedRadio.value, 10);

    const exam = window.K9Store ? window.K9Store.getExam(examId) : null;
    if (!exam) return;

    if (!Array.isArray(exam.questions)) exam.questions = [];

    if (qId) {
      // Editar existente
      const index = exam.questions.findIndex(x => x.id === qId);
      if (index >= 0) {
        exam.questions[index] = {
          ...exam.questions[index],
          question: text,
          options,
          correctIndex,
          explanation
        };
      }
    } else {
      // Nueva
      exam.questions.push({
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        question: text,
        options,
        correctIndex,
        explanation
      });
    }

    exam.totalQuestions = exam.questions.length;
    window.K9Store.saveExam(exam);

    if (typeof closeModal === 'function') closeModal('modalEditExamQuestion');
    if (typeof showToast === 'function') showToast(qId ? 'Pregunta actualizada con éxito.' : 'Nueva pregunta añadida al examen.', 'success');

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    else if (window.K9Supabase && window.K9Supabase.isConfigured()) window.K9Supabase.push();

    renderJefaturaExamManagerSection(document.getElementById('jefaturaSubtabContent'));
  };

  // Eliminar pregunta
  window.deleteExamQuestion = function (qId, examId) {
    const confirmDel = confirm('¿Estás seguro de eliminar esta pregunta del examen?');
    if (!confirmDel) return;

    const exam = window.K9Store ? window.K9Store.getExam(examId) : null;
    if (!exam) return;

    exam.questions = (exam.questions || []).filter(x => x.id !== qId);
    exam.totalQuestions = exam.questions.length;
    window.K9Store.saveExam(exam);

    if (typeof showToast === 'function') showToast('Pregunta eliminada del formulario.', 'info');

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    renderJefaturaExamManagerSection(document.getElementById('jefaturaSubtabContent'));
  };

  // Ajustes de Formulario y Permisos
  window.openExamSettingsModal = function (examId = 'exam_acceso_k9') {
    const exam = window.K9Store ? window.K9Store.getExam(examId) : null;
    if (!exam) return;

    document.getElementById('cfgExamId').value = exam.id;
    document.getElementById('cfgExamTitle').value = exam.title || '';
    document.getElementById('cfgExamDesc').value = exam.description || '';
    document.getElementById('cfgMinScore').value = exam.minScoreToPass || 8;
    document.getElementById('cfgExamState').value = exam.active !== false ? 'true' : 'false';

    const checkWrap = document.getElementById('examManagersCheckboxes');
    if (checkWrap && window.K9Store) {
      const users = window.K9Store.getUsers();
      checkWrap.innerHTML = users.map(u => {
        const checked = (exam.managersUserIds || []).includes(u.id);
        return `
          <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.78rem; color:#fff; cursor:pointer;">
            <input type="checkbox" name="examManagerUser" value="${u.id}" ${checked ? 'checked' : ''}>
            <span>${esc(u.name)} [Placa ${esc(u.placa)}] · ${esc(u.rank)}</span>
          </label>
        `;
      }).join('');
    }

    if (typeof openModal === 'function') openModal('modalExamSettings');
  };

  window.handleSaveExamSettings = function (e) {
    if (e) e.preventDefault();
    const examId = document.getElementById('cfgExamId').value || 'exam_acceso_k9';
    const exam = window.K9Store ? window.K9Store.getExam(examId) : null;
    if (!exam) return;

    exam.title = document.getElementById('cfgExamTitle').value.trim();
    exam.description = document.getElementById('cfgExamDesc').value.trim();
    exam.minScoreToPass = parseInt(document.getElementById('cfgMinScore').value, 10) || 8;
    exam.active = document.getElementById('cfgExamState').value === 'true';

    const selectedManagers = [];
    document.querySelectorAll('input[name="examManagerUser"]:checked').forEach(chk => {
      selectedManagers.push(chk.value);
    });
    exam.managersUserIds = selectedManagers;

    window.K9Store.saveExam(exam);

    if (typeof closeModal === 'function') closeModal('modalExamSettings');
    if (typeof showToast === 'function') showToast('Ajustes del formulario y permisos guardados con éxito.', 'success');

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    else if (window.K9Supabase && window.K9Supabase.isConfigured()) window.K9Supabase.push();

    renderJefaturaExamManagerSection(document.getElementById('jefaturaSubtabContent'));
  };

  // Crear nuevo formulario / examen
  window.promptCreateNewExamForm = function () {
    const title = prompt('Introduce el título para el nuevo formulario o examen K9:\n\n(Ejemplo: Examen de Especialidad TEDAX / Detección Canina)');
    if (!title || !title.trim()) return;

    const desc = prompt('Introduce una breve descripción reglamentaria:') || 'Evaluación de conocimientos tácticos especializados.';

    const newExam = {
      id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      description: desc.trim(),
      minScoreToPass: 8,
      totalQuestions: 0,
      active: true,
      allowedRanks: ['Todos'],
      allowedUserIds: [],
      managersUserIds: [],
      createdAt: new Date().toLocaleDateString('es-ES'),
      questions: []
    };

    if (window.K9Store) {
      window.K9Store.saveExam(newExam);
    }
    if (typeof showToast === 'function') showToast(`Formulario "${title}" creado. Añade preguntas para activarlo.`, 'success');

    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    renderJefaturaExamManagerSection(document.getElementById('jefaturaSubtabContent'));
  };

  // Revocar evaluación / certificado emitido
  window.revokeExamSubmission = function (subId) {
    const confirmRev = confirm('¿Confirmas la revocación de esta evaluación y la retirada del Certificado Oficial?');
    if (!confirmRev) return;

    if (window.K9Store) {
      const submissions = window.K9Store.getExamSubmissions();
      const target = submissions.find(s => s.id === subId);
      const remaining = submissions.filter(s => s.id !== subId);
      window.K9Store.saveExamSubmissions(remaining);

      if (target) {
        const users = window.K9Store.getAllUsers();
        const u = users.find(x => x.id === target.agentId);
        if (u && u.k9TheoryCert && u.k9TheoryCert.certCode === target.certCode) {
          delete u.k9TheoryCert;
          window.K9Store.save(window.STORAGE_KEYS.USERS, users);
        }
      }
    }

    if (typeof showToast === 'function') showToast('Evaluación revocada.', 'info');
    if (window.K9CloudSync) window.K9CloudSync.schedulePush();
    renderJefaturaExamManagerSection(document.getElementById('jefaturaSubtabContent'));
  };

  // =============================================================================
  // INICIALIZACIÓN AUTOMÁTICA AL CARGAR DOM
  // =============================================================================
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      renderDutyHudSwitch();
      renderLiveBinomiosWidget();
    }, 150);
  });

})();

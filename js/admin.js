// js/admin.js — Panel de administración Licancura

/* ─── ESTADO ─── */
let currentUser = null;
let adminData   = { textos: [], estadisticas: [], servicios: [], mat: [], trab: [], acab: [], projects: [] };

/* ─── OVERLAY / MODAL ─── */
function openOverlay(id)  { document.getElementById(id).classList.add('open'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.overlay').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('open'); });
});

/* ─── LOGIN CON SUPABASE AUTH ─── */
function openLogin() { openOverlay('loginOverlay'); }

async function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  const err   = document.getElementById('l-err');
  const btn   = document.getElementById('l-btn');
  const spin  = document.getElementById('l-spin');

  if (!email || !pass) { showLoginErr('Completa email y contraseña.'); return; }

  btn.style.display  = 'none';
  spin.style.display = 'block';
  err.style.display  = 'none';

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });

  btn.style.display  = 'block';
  spin.style.display = 'none';

  if (error) { showLoginErr('Credenciales incorrectas.'); return; }

  currentUser = data.user;
  closeOverlay('loginOverlay');
  openAdminPanel();
}

function showLoginErr(msg) {
  const err = document.getElementById('l-err');
  err.textContent = msg;
  err.style.display = 'block';
  setTimeout(() => err.style.display = 'none', 4000);
}

document.getElementById('l-pass')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

async function doLogout() {
  await sb.auth.signOut();
  currentUser = null;
  closeOverlay('adminOverlay');
  showToast('Sesión cerrada.');
}

// Detectar sesión activa al cargar
sb.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user || null;
});

/* ─── ABRIR PANEL ─── */
async function openAdminPanel() {
  if (!currentUser) { openLogin(); return; }
  await loadAdminData();
  openOverlay('adminOverlay');
}

/* ─── CARGAR TODOS LOS DATOS PARA ADMIN ─── */
async function loadAdminData() {
  setAdminLoading(true);
  try {
    const [
      { data: textos },
      { data: stats },
      { data: srvs },
      { data: mat },
      { data: trab },
      { data: acab },
      { data: projs },
      { data: cots },
      { data: conts },
      { data: conf },
    ] = await Promise.all([
      sb.from('textos').select('*'),
      sb.from('estadisticas').select('*'),
      sb.from('servicios').select('*').order('orden'),
      sb.from('materiales').select('*').order('orden'),
      sb.from('tipos_trabajo').select('*').order('orden'),
      sb.from('acabados').select('*').order('orden'),
      sb.from('proyectos').select('*').order('orden'),
      sb.from('cotizaciones').select('*').order('created_at', { ascending: false }).limit(50),
      sb.from('contactos').select('*').order('created_at', { ascending: false }).limit(50),
      sb.from('configuracion').select('*'),
    ]);

    adminData = { textos, stats, srvs, mat, trab, acab, projs, cots, conts, conf };

    renderTabContenido();
    renderTabPrecios();
    renderTabProyectos();
    renderTabCotizaciones();
    renderTabContactos();
    renderTabConfig();

  } catch (err) {
    console.error(err);
    showToast('Error cargando datos del panel.');
  }
  setAdminLoading(false);
}

function setAdminLoading(on) {
  const btn = document.getElementById('admin-refresh');
  if (btn) btn.textContent = on ? 'Cargando...' : 'Actualizar';
}

/* ─── TABS ─── */
function swTab(id, btn) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}

/* ─── TAB: CONTENIDO ─── */
function renderTabContenido() {
  const { textos, stats, srvs } = adminData;

  // Textos
  const tMap = {};
  (textos || []).forEach(t => tMap[t.clave] = t.valor);
  setVal('a-title', tMap['about_titulo']    || '');
  setVal('a-body',  tMap['about_cuerpo']    || '');
  setVal('a-quote', tMap['about_frase']     || '');
  setVal('a-qsub',  tMap['about_frase_sub'] || '');

  // Stats
  const sMap = {};
  (stats || []).forEach(s => sMap[s.clave] = s.valor);
  setVal('a-s-proy', sMap['proyectos'] || '');
  setVal('a-s-anos', sMap['anos']      || '');
  setVal('a-s-cli',  sMap['clientes']  || '');
  setVal('a-s-eq',   sMap['maestros']  || '');

  // Servicios
  const srvEl = document.getElementById('srv-editor');
  if (!srvEl) return;
  srvEl.innerHTML = '';
  (srvs || []).forEach((s, i) => {
    srvEl.innerHTML += `
      <div style="margin-bottom:12px;padding:14px;border:1px solid var(--border)">
        <p class="adm-sec-label">Servicio ${i+1}</p>
        <div class="adm-f"><label>Nombre</label><input class="adm-input" id="se-n-${s.id}" value="${esc(s.nombre)}"></div>
        <div class="adm-f"><label>Descripción</label><input class="adm-input" id="se-d-${s.id}" value="${esc(s.descripcion)}"></div>
      </div>`;
  });
}

async function saveCont() {
  const btn = document.getElementById('btn-save-cont');
  btn.disabled = true; btn.textContent = 'Guardando...';
  try {
    // Textos
    const textos = [
      { clave: 'about_titulo',    valor: getVal('a-title') },
      { clave: 'about_cuerpo',    valor: getVal('a-body')  },
      { clave: 'about_frase',     valor: getVal('a-quote') },
      { clave: 'about_frase_sub', valor: getVal('a-qsub')  },
    ];
    for (const t of textos) {
      await sb.from('textos').upsert(t, { onConflict: 'clave' });
    }

    // Stats
    const stats = [
      { clave: 'proyectos', valor: getVal('a-s-proy') },
      { clave: 'anos',      valor: getVal('a-s-anos') },
      { clave: 'clientes',  valor: getVal('a-s-cli')  },
      { clave: 'maestros',  valor: getVal('a-s-eq')   },
    ];
    for (const s of stats) {
      await sb.from('estadisticas').upsert(s, { onConflict: 'clave' });
    }

    // Servicios
    for (const s of (adminData.srvs || [])) {
      await sb.from('servicios').update({
        nombre:      getVal(`se-n-${s.id}`),
        descripcion: getVal(`se-d-${s.id}`),
        updated_at:  new Date().toISOString(),
      }).eq('id', s.id);
    }

    showToast('✓ Contenido actualizado.');
    await loadAdminData();
  } catch (e) {
    showToast('Error al guardar. Intenta de nuevo.');
  }
  btn.disabled = false; btn.textContent = 'Guardar contenido';
}

/* ─── TAB: PRECIOS ─── */
function renderTabPrecios() {
  renderPrecios('mat-editor',  adminData.mat,  'mat');
  renderPrecios('trab-editor', adminData.trab, 'trab');
  renderPrecios('acab-editor', adminData.acab, 'acab');
}

function renderPrecios(containerId, items, type) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  (items || []).forEach(item => {
    const col2 = type === 'mat'  ? `<input class="adm-input" id="p2-${item.id}" type="number" value="${item.precio_base}" placeholder="$/m²">`
               : type === 'trab' ? `<input class="adm-input" id="p2-${item.id}" type="number" step="0.05" value="${item.factor}" placeholder="Factor">`
               :                   `<input class="adm-input" id="p2-${item.id}" type="number" value="${item.extra_m2}" placeholder="Extra $/m²">`;
    c.innerHTML += `
      <div class="adm-grid-3">
        <input class="adm-input" id="p1-${item.id}" value="${esc(item.nombre)}" placeholder="Nombre">
        ${col2}
        <button class="adm-del" onclick="deletePrice('${type}','${item.id}')" aria-label="Eliminar">×</button>
      </div>`;
  });
}

async function deletePrice(type, id) {
  if (!confirm('¿Eliminar este elemento?')) return;
  const table = type === 'mat' ? 'materiales' : type === 'trab' ? 'tipos_trabajo' : 'acabados';
  await sb.from(table).delete().eq('id', id);
  showToast('Eliminado.');
  await loadAdminData();
}

async function addPrice(type) {
  const table = type === 'mat' ? 'materiales' : type === 'trab' ? 'tipos_trabajo' : 'acabados';
  const rec   = type === 'mat'  ? { nombre: 'Nuevo material', precio_base: 100000, orden: 99 }
              : type === 'trab' ? { nombre: 'Nuevo trabajo',  factor: 1.0, orden: 99 }
              :                   { nombre: 'Nuevo acabado',  extra_m2: 0, orden: 99 };
  await sb.from(table).insert(rec);
  await loadAdminData();
}

async function savePrices() {
  const btn = document.getElementById('btn-save-prices');
  btn.disabled = true; btn.textContent = 'Guardando...';
  try {
    for (const item of (adminData.mat || [])) {
      await sb.from('materiales').update({ nombre: getVal(`p1-${item.id}`), precio_base: parseFloat(getVal(`p2-${item.id}`))||0, updated_at: new Date().toISOString() }).eq('id', item.id);
    }
    for (const item of (adminData.trab || [])) {
      await sb.from('tipos_trabajo').update({ nombre: getVal(`p1-${item.id}`), factor: parseFloat(getVal(`p2-${item.id}`))||1, updated_at: new Date().toISOString() }).eq('id', item.id);
    }
    for (const item of (adminData.acab || [])) {
      await sb.from('acabados').update({ nombre: getVal(`p1-${item.id}`), extra_m2: parseFloat(getVal(`p2-${item.id}`))||0, updated_at: new Date().toISOString() }).eq('id', item.id);
    }
    showToast('✓ Precios actualizados.');
    await loadAdminData();
  } catch (e) {
    showToast('Error al guardar precios.');
  }
  btn.disabled = false; btn.textContent = 'Guardar precios';
}

/* ─── TAB: PROYECTOS ─── */
function renderTabProyectos() {
  const l = document.getElementById('proj-editor');
  if (!l) return;
  l.innerHTML = '';
  const projs = adminData.projs || [];
  if (!projs.length) {
    l.innerHTML = '<p style="font-size:13px;color:var(--mid);font-style:italic">No hay proyectos. Agrega el primero arriba.</p>';
    return;
  }
  projs.forEach(p => {
    l.innerHTML += `
      <div class="proj-row">
        ${p.imagen_url ? `<img class="proj-row__img" src="${p.imagen_url}" alt="">` : '<div class="proj-row__img" style="background:var(--border)"></div>'}
        <div class="proj-row__info">
          <div class="proj-row__name">${esc(p.nombre)}</div>
          <div class="proj-row__cat">${esc(p.categoria)}</div>
        </div>
        <button class="adm-del" onclick="deleteProject('${p.id}')" aria-label="Eliminar">×</button>
      </div>`;
  });
}

async function addProject() {
  const n   = getVal('np-n').trim();
  const c   = getVal('np-c').trim();
  if (!n || !c) { showToast('Nombre y categoría son obligatorios.'); return; }

  const btn = document.getElementById('btn-add-proj');
  btn.disabled = true; btn.textContent = 'Guardando...';

  let imagen_url = getVal('np-i').trim() || null;

  // Subir imagen si se seleccionó una
  const fileInput = document.getElementById('np-file');
  if (fileInput && fileInput.files[0]) {
    const file = fileInput.files[0];
    const ext  = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadErr } = await sb.storage.from('proyectos').upload(path, file, { upsert: true });
    if (!uploadErr) {
      imagen_url = `${STORAGE_URL}${path}`;
    } else {
      showToast('Error al subir imagen: ' + uploadErr.message);
    }
  }

  const { error } = await sb.from('proyectos').insert({
    nombre: n, categoria: c,
    descripcion: getVal('np-d').trim() || null,
    imagen_url,
    orden: (adminData.projs?.length || 0) + 1,
  });

  if (error) { showToast('Error al agregar proyecto.'); }
  else {
    ['np-n','np-c','np-i','np-d'].forEach(id => setVal(id, ''));
    if (fileInput) { fileInput.value = ''; }
    const prev = document.getElementById('np-preview');
    if (prev) prev.style.display = 'none';
    showToast('✓ Proyecto agregado.');
    await loadAdminData();
  }
  btn.disabled = false; btn.textContent = 'Agregar proyecto';
}

async function deleteProject(id) {
  if (!confirm('¿Eliminar este proyecto?')) return;
  await sb.from('proyectos').delete().eq('id', id);
  showToast('Proyecto eliminado.');
  await loadAdminData();
}

// Preview imagen antes de subir
document.getElementById('np-file')?.addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const prev = document.getElementById('np-preview');
  if (prev) {
    prev.src = URL.createObjectURL(file);
    prev.style.display = 'block';
  }
});

/* ─── TAB: COTIZACIONES ─── */
function renderTabCotizaciones() {
  const c = document.getElementById('cot-list');
  if (!c) return;
  const cots = adminData.cots || [];
  if (!cots.length) { c.innerHTML = '<p style="font-size:13px;color:var(--mid);font-style:italic">No hay cotizaciones registradas aún.</p>'; return; }

  c.innerHTML = `
    <table class="cot-table">
      <thead>
        <tr>
          <th>Fecha</th><th>Material</th><th>Trabajo</th>
          <th>Acabado</th><th>m²</th><th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${cots.map(co => `
          <tr>
            <td>${new Date(co.created_at).toLocaleDateString('es-CL')}</td>
            <td>${co.material || '—'}</td>
            <td>${co.tipo_trabajo || '—'}</td>
            <td>${co.acabado || '—'}</td>
            <td>${co.metros2 || '—'}</td>
            <td class="total">$${Number(co.total || 0).toLocaleString('es-CL')}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

/* ─── TAB: CONTACTOS ─── */
function renderTabContactos() {
  const c = document.getElementById('cont-list');
  if (!c) return;
  const conts = adminData.conts || [];
  const unread = conts.filter(m => !m.leido).length;

  // Actualizar badge
  const badge = document.getElementById('msg-badge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline-block' : 'none'; }

  if (!conts.length) { c.innerHTML = '<p style="font-size:13px;color:var(--mid);font-style:italic">No hay mensajes aún.</p>'; return; }

  c.innerHTML = conts.map(m => `
    <div class="msg-row ${m.leido ? '' : 'unread'}" id="msg-${m.id}">
      <div class="msg-row__header">
        <span class="msg-row__name">${esc(m.nombre)}</span>
        <span class="msg-row__date">${new Date(m.created_at).toLocaleString('es-CL')}</span>
      </div>
      <div class="msg-row__meta">${esc(m.email)}${m.telefono ? ' · ' + esc(m.telefono) : ''}${m.tipo ? ' · ' + esc(m.tipo) : ''}</div>
      <div class="msg-row__text">${esc(m.mensaje || '')}</div>
      ${!m.leido ? `<button class="msg-mark" onclick="markRead('${m.id}')">Marcar como leído</button>` : ''}
    </div>`).join('');
}

async function markRead(id) {
  await sb.from('contactos').update({ leido: true }).eq('id', id);
  await loadAdminData();
}

/* ─── TAB: CONFIGURACIÓN ─── */
function renderTabConfig() {
  const conf = adminData.conf || [];
  const cMap = {};
  conf.forEach(c => cMap[c.clave] = c.valor);
  setVal('a-ph', cMap['telefono']   || '');
  setVal('a-wa', cMap['wa_numero']  || '');
  setVal('a-em', cMap['email']      || '');
  setVal('a-ad', cMap['direccion']  || '');
  setVal('a-ho', cMap['horario']    || '');
}

async function saveConfig() {
  const btn = document.getElementById('btn-save-config');
  btn.disabled = true; btn.textContent = 'Guardando...';
  try {
    const configs = [
      { clave: 'wa_numero',  valor: getVal('a-wa') },
      { clave: 'telefono',   valor: getVal('a-ph') },
      { clave: 'email',      valor: getVal('a-em') },
      { clave: 'direccion',  valor: getVal('a-ad') },
      { clave: 'horario',    valor: getVal('a-ho') },
    ];
    for (const c of configs) {
      await sb.from('configuracion').upsert(c, { onConflict: 'clave' });
    }
    showToast('✓ Configuración actualizada.');
    await loadAdminData();
  } catch (e) {
    showToast('Error al guardar configuración.');
  }
  btn.disabled = false; btn.textContent = 'Guardar configuración';
}

/* ─── HELPERS ─── */
function getVal(id) { return document.getElementById(id)?.value || ''; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function esc(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

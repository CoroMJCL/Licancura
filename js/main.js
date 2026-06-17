// js/main.js — Mármoles Licancura

/* ─── UTILIDADES ─── */
function showToast(msg, duration = 3200) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function cl(key) {
  return document.getElementById(key);
}

/* ─── NAV ─── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

const burger  = document.getElementById('burgerBtn');
const mobMenu = document.getElementById('mobileMenu');

function toggleMenu() {
  const open = mobMenu.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
}
function closeMenu() {
  mobMenu.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
}
if (burger) burger.addEventListener('click', toggleMenu);

/* ─── AÑO FOOTER ─── */
const yrEl = document.getElementById('yr');
if (yrEl) yrEl.textContent = new Date().getFullYear();

/* ─── REVEAL ON SCROLL ─── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ─── CONTADOR ANIMADO ─── */
function animateCount(el, target, duration = 1200) {
  let startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

const statsSection = document.getElementById('stats');
if (statsSection) {
  const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-val]').forEach(el => {
          animateCount(el, parseInt(el.dataset.val));
        });
        statsObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  statsObs.observe(statsSection);
}

/* ─── WA FLOTANTE ─── */
function openWA(e) {
  e.preventDefault();
  const wa = window._siteConfig?.wa || '56223456789';
  window.open(`https://wa.me/${wa}`, '_blank');
}
const waBtn = document.getElementById('waBtn');
if (waBtn) waBtn.addEventListener('click', openWA);

/* ─── CARGAR DATOS DEL SITIO DESDE SUPABASE ─── */
window._siteData  = { mat: [], trab: [], acab: [], projects: [] };
window._siteConfig = { wa: '56223456789', telefono: '', email: '', direccion: '', horario: '' };

async function loadSiteData() {
  try {
    // Textos
    const { data: textos } = await sb.from('textos').select('*');
    if (textos) {
      textos.forEach(t => {
        if (t.clave === 'about_titulo' && cl('txt-about-title'))  cl('txt-about-title').textContent  = t.valor;
        if (t.clave === 'about_cuerpo' && cl('txt-about-body'))   cl('txt-about-body').textContent   = t.valor;
        if (t.clave === 'about_frase'  && cl('txt-quote'))        cl('txt-quote').textContent        = t.valor;
        if (t.clave === 'about_frase_sub' && cl('txt-quote-sub')) cl('txt-quote-sub').textContent    = t.valor;
      });
    }

    // Estadísticas
    const { data: stats } = await sb.from('estadisticas').select('*');
    if (stats) {
      stats.forEach(s => {
        const el = cl(`s-${s.clave}`);
        if (el) { el.dataset.val = s.valor; el.textContent = s.valor; }
      });
    }

    // Servicios
    const { data: srvs } = await sb.from('servicios').select('*').order('orden');
    if (srvs) {
      srvs.forEach((s, i) => {
        const n = cl(`srv${i+1}-name`);
        const d = cl(`srv${i+1}-desc`);
        if (n) n.textContent = s.nombre;
        if (d) d.textContent = s.descripcion;
      });
    }

    // Configuración (WhatsApp, contacto)
    const { data: conf } = await sb.from('configuracion').select('*');
    if (conf) {
      conf.forEach(c => {
        window._siteConfig[c.clave === 'wa_numero' ? 'wa' : c.clave] = c.valor;
        if (c.clave === 'telefono'  && cl('txt-phone'))  { cl('txt-phone').textContent  = c.valor; cl('ft-phone').textContent  = c.valor; }
        if (c.clave === 'email'     && cl('txt-email'))  { cl('txt-email').textContent   = c.valor; cl('ft-email').textContent  = c.valor; }
        if (c.clave === 'direccion' && cl('txt-addr'))   { cl('txt-addr').textContent    = c.valor; cl('ft-addr').textContent   = c.valor; }
        if (c.clave === 'horario'   && cl('txt-hora'))   cl('txt-hora').textContent      = c.valor;
      });
    }

    // Materiales, trabajos, acabados para cotizador
    const [{ data: mat }, { data: trab }, { data: acab }] = await Promise.all([
      sb.from('materiales').select('*').eq('activo', true).order('orden'),
      sb.from('tipos_trabajo').select('*').eq('activo', true).order('orden'),
      sb.from('acabados').select('*').eq('activo', true).order('orden'),
    ]);
    window._siteData.mat  = mat  || [];
    window._siteData.trab = trab || [];
    window._siteData.acab = acab || [];
    populateQuoter();

    // Proyectos
    const { data: projects } = await sb.from('proyectos').select('*').eq('activo', true).order('orden');
    window._siteData.projects = projects || [];
    renderCarousel();

  } catch (err) {
    console.error('Error cargando datos:', err);
  }
}

/* ─── CARRUSEL ─── */
let carIdx = 0;
let autoTimer;

function renderCarousel() {
  const track = cl('carTrack');
  const dots  = cl('carDots');
  if (!track || !dots) return;
  track.innerHTML = '';
  dots.innerHTML  = '';

  const projects = window._siteData.projects;
  if (!projects.length) {
    track.innerHTML = '<p style="color:var(--mid);font-size:14px;padding:20px">No hay proyectos publicados aún.</p>';
    return;
  }

  projects.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'pcard';

    const imgContent = p.imagen_url
      ? `<img src="${p.imagen_url}" alt="${p.nombre}" loading="lazy">`
      : `<div class="pcard__img-ph">${p.categoria}</div>`;

    card.innerHTML = `
      <div class="pcard__img">${imgContent}<span class="pcard__badge">${p.categoria}</span></div>
      <div class="pcard__body">
        <div class="pcard__name">${p.nombre}</div>
        <div class="pcard__detail">${p.descripcion || ''}</div>
      </div>`;
    track.appendChild(card);

    const dot = document.createElement('button');
    dot.className = 'car-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Proyecto ${i+1}: ${p.nombre}`);
    dot.addEventListener('click', () => { carIdx = i; updateCarousel(); });
    dots.appendChild(dot);
  });

  carIdx = 0;
  updateCarousel();
  startAutoPlay();
}

function updateCarousel() {
  const track    = cl('carTrack');
  const viewport = document.querySelector('.carousel-viewport');
  const firstCard = track && track.querySelector('.pcard');
  if (!firstCard || !viewport) return;
  const cardW = firstCard.offsetWidth + 20;
  track.style.transform = `translateX(-${carIdx * cardW}px)`;
  document.querySelectorAll('.car-dot').forEach((d, i) => d.classList.toggle('active', i === carIdx));
}

function carMove(dir) {
  const viewport  = document.querySelector('.carousel-viewport');
  const firstCard = document.querySelector('.pcard');
  if (!firstCard || !viewport) return;
  const cardW = firstCard.offsetWidth + 20;
  const vis   = Math.max(1, Math.floor(viewport.offsetWidth / cardW));
  const max   = Math.max(0, window._siteData.projects.length - vis);
  carIdx = Math.max(0, Math.min(carIdx + dir, max));
  updateCarousel();
}

function startAutoPlay() {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => carMove(1), 5000);
}

const vp = document.querySelector('.carousel-viewport');
if (vp) {
  vp.addEventListener('mouseenter', () => clearInterval(autoTimer));
  vp.addEventListener('mouseleave', startAutoPlay);
}
document.getElementById('carPrev')?.addEventListener('click', () => { clearInterval(autoTimer); carMove(-1); startAutoPlay(); });
document.getElementById('carNext')?.addEventListener('click', () => { clearInterval(autoTimer); carMove(1);  startAutoPlay(); });
window.addEventListener('resize', updateCarousel, { passive: true });

/* ─── COTIZADOR ─── */
function populateQuoter() {
  const ms = cl('q-mat');
  const ts = cl('q-trab');
  const as = cl('q-acab');
  if (!ms || !ts || !as) return;

  ms.innerHTML = '<option value="">Seleccionar material...</option>';
  ts.innerHTML = '<option value="">Seleccionar trabajo...</option>';
  as.innerHTML = '<option value="">Seleccionar acabado...</option>';

  window._siteData.mat.forEach((m, i)  => ms.innerHTML += `<option value="${i}">${m.nombre} — $${Number(m.precio_base).toLocaleString('es-CL')}/m²</option>`);
  window._siteData.trab.forEach((t, i) => ts.innerHTML += `<option value="${i}">${t.nombre}</option>`);
  window._siteData.acab.forEach((a, i) => as.innerHTML += `<option value="${i}">${a.nombre}${a.extra_m2 > 0 ? ` (+$${Number(a.extra_m2).toLocaleString('es-CL')}/m²)` : ''}</option>`);
}

function calcQuote() {
  const mi  = cl('q-mat').value;
  const ti  = cl('q-trab').value;
  const m2  = parseFloat(cl('q-m2').value) || 0;
  const ai  = cl('q-acab').value;
  const det = cl('q-detail');
  const tw  = cl('q-total-wrap');

  if (mi === '' || ti === '' || ai === '' || m2 <= 0) {
    det.innerHTML = '<p class="qr-empty">Completa los campos para ver el presupuesto...</p>';
    tw.style.display = 'none'; return;
  }

  const mat  = window._siteData.mat[mi];
  const trab = window._siteData.trab[ti];
  const acab = window._siteData.acab[ai];
  const unit = Math.round(Number(mat.precio_base) * Number(trab.factor) + Number(acab.extra_m2));
  const net  = Math.round(unit * m2);
  const iva  = Math.round(net * 0.19);
  const tot  = net + iva;

  det.innerHTML = `
    <div class="qr-line"><span class="qr-line__l">Material</span><span class="qr-line__v">${mat.nombre}</span></div>
    <div class="qr-line"><span class="qr-line__l">Tipo de trabajo</span><span class="qr-line__v">${trab.nombre}</span></div>
    <div class="qr-line"><span class="qr-line__l">Acabado</span><span class="qr-line__v">${acab.nombre}</span></div>
    <div class="qr-line"><span class="qr-line__l">Superficie</span><span class="qr-line__v">${m2} m²</span></div>
    <div class="qr-line"><span class="qr-line__l">Precio unitario</span><span class="qr-line__v">$${unit.toLocaleString('es-CL')}/m²</span></div>
    <div class="qr-line"><span class="qr-line__l">Subtotal neto</span><span class="qr-line__v">$${net.toLocaleString('es-CL')}</span></div>
    <div class="qr-line"><span class="qr-line__l">IVA 19%</span><span class="qr-line__v">$${iva.toLocaleString('es-CL')}</span></div>`;
  cl('q-total-num').textContent = '$' + tot.toLocaleString('es-CL');
  tw.style.display = 'block';

  // Guardar cotización en Supabase (anónima)
  sb.from('cotizaciones').insert({
    material: mat.nombre, tipo_trabajo: trab.nombre, acabado: acab.nombre,
    metros2: m2, precio_unitario: unit, subtotal: net, iva, total: tot
  }).then(() => {}).catch(() => {});
}

function sendQuoteWA() {
  const mi  = cl('q-mat').value;
  const ti  = cl('q-trab').value;
  const m2  = cl('q-m2').value;
  const ai  = cl('q-acab').value;
  const tot = cl('q-total-num').textContent;
  let msg = 'Hola Mármoles Licancura, me interesa cotizar un proyecto:%0A';
  if (mi !== '') msg += `Material: ${window._siteData.mat[mi].nombre}%0A`;
  if (ti !== '') msg += `Trabajo: ${window._siteData.trab[ti].nombre}%0A`;
  if (m2)        msg += `Superficie: ${m2} m²%0A`;
  if (ai !== '') msg += `Acabado: ${window._siteData.acab[ai].nombre}%0A`;
  if (tot && tot !== '—') msg += `Estimado: ${tot} (c/IVA)%0A`;
  msg += '%0AFavor contactarme para confirmar detalles.';
  window.open(`https://wa.me/${window._siteConfig.wa}?text=${msg}`, '_blank');
}

/* ─── FORMULARIO CONTACTO ─── */
async function sendContact(e) {
  e.preventDefault();
  const n    = cl('cf-n').value.trim();
  const em   = cl('cf-e').value.trim();
  if (!n || !em) { showToast('Por favor completa nombre y email.'); return; }

  const btn = e.target.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

  const payload = {
    nombre:   n,
    email:    em,
    telefono: cl('cf-t').value,
    tipo:     cl('cf-tipo').value,
    mensaje:  cl('cf-m').value,
  };

  // Guardar en Supabase
  const { error } = await sb.from('contactos').insert(payload);

  // También abrir WA
  const msg = encodeURIComponent(
    `Hola Mármoles Licancura, mensaje desde el sitio:\nNombre: ${n}\nEmail: ${em}\nTel: ${payload.telefono}\nTipo: ${payload.tipo}\nMensaje: ${payload.mensaje}`
  );
  window.open(`https://wa.me/${window._siteConfig.wa}?text=${msg}`, '_blank');

  const ok = cl('cf-ok');
  if (ok) ok.style.display = 'block';
  setTimeout(() => { if (ok) ok.style.display = 'none'; }, 5000);

  if (btn) { btn.disabled = false; btn.textContent = 'Enviar mensaje →'; }
  e.target.reset();
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  loadSiteData();
});

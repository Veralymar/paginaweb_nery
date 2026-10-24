(function () {
  'use strict';

  var WA_NUMERO = '50256072071';

  /* ---------- Menú móvil ---------- */
  var btn = document.getElementById('menuBtn');
  var menu = document.getElementById('menu');
  function alternarMenu(abrir) {
    menu.classList.toggle('abierto', abrir);
    btn.setAttribute('aria-expanded', String(abrir));
    btn.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  }
  btn.addEventListener('click', function () {
    alternarMenu(btn.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') alternarMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') alternarMenu(false);
  });

  document.getElementById('anio').textContent = new Date().getFullYear();

  /* ---------- Sanitización ---------- */
  // Elimina etiquetas, caracteres de control y símbolos usados en inyecciones.
  function limpiar(valor, max) {
    return String(valor || '')
      .normalize('NFC')
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/<[^>]*>?/g, '')
      .replace(/[<>`{}\\]/g, '')
      .replace(/javascript:|data:text\/html|on\w+\s*=/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, max);
  }

  var reglas = {
    nombre: { max: 80, ok: function (v) { return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{3,80}$/.test(v); }, msg: 'Escriba su nombre completo (solo letras).' },
    correo: { max: 100, ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }, msg: 'Ingrese un correo válido.' },
    telefono: { max: 20, ok: function (v) { return /^\+?[0-9 ()-]{8,20}$/.test(v); }, msg: 'Ingrese un teléfono válido (8 a 15 dígitos).' },
    servicio: { max: 40, ok: function (v) { return v.length > 0; }, msg: 'Seleccione el tema de su consulta.' },
    mensaje: { max: 500, ok: function (v) { return v.length >= 10; }, msg: 'Cuéntenos su consulta (mínimo 10 caracteres).' }
  };

  var form = document.getElementById('formCita');
  var estado = document.getElementById('estado');
  var ultimoEnvio = 0;

  function marcar(campo, mensaje) {
    var cont = form.elements[campo].closest('.campo');
    cont.classList.toggle('invalido', !!mensaje);
    form.querySelector('.error[data-for="' + campo + '"]').textContent = mensaje || '';
  }

  Object.keys(reglas).forEach(function (campo) {
    form.elements[campo].addEventListener('blur', function () {
      var v = limpiar(form.elements[campo].value, reglas[campo].max);
      marcar(campo, reglas[campo].ok(v) ? '' : reglas[campo].msg);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    estado.textContent = '';

    // Honeypot: si un bot lo llena, se descarta en silencio.
    if (form.elements.sitio.value) return;

    // Límite de frecuencia (10 s) contra envíos repetidos.
    if (Date.now() - ultimoEnvio < 10000) {
      estado.textContent = 'Espere unos segundos antes de enviar de nuevo.';
      return;
    }

    var datos = {}, valido = true, primerError = null;
    Object.keys(reglas).forEach(function (campo) {
      var v = limpiar(form.elements[campo].value, reglas[campo].max);
      datos[campo] = v;
      var bien = reglas[campo].ok(v);
      marcar(campo, bien ? '' : reglas[campo].msg);
      if (!bien) { valido = false; primerError = primerError || form.elements[campo]; }
    });

    if (!valido) {
      estado.textContent = 'Revise los campos marcados.';
      primerError.focus();
      return;
    }

    var texto = 'Hola, Lic. Espina. Solicito una cita.\n' +
      'Nombre: ' + datos.nombre + '\n' +
      'Correo: ' + datos.correo + '\n' +
      'Teléfono: ' + datos.telefono + '\n' +
      'Tema: ' + datos.servicio + '\n' +
      'Consulta: ' + datos.mensaje;

    var camp = new URLSearchParams(location.search).get('utm_campaign');
    if (camp) texto += '\nRef: ' + limpiar(camp, 40);

    var url = 'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(texto);
    var ventana = window.open(url, '_blank', 'noopener,noreferrer');
    if (!ventana) { window.location.href = url; }

    evento('generate_lead', { tema: datos.servicio });
    ultimoEnvio = Date.now();
    estado.textContent = 'Abriendo WhatsApp con su solicitud.';
    form.reset();
  });
  /* ---------- Eventos de conversión (GA4) ---------- */
  function evento(nombre, extra) {
    if (typeof gtag === 'function') gtag('event', nombre, extra || {});
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (h.indexOf('https://wa.me/') === 0) evento('click_whatsapp', { ubicacion: a.id || 'enlace' });
    else if (h.indexOf('tel:') === 0) evento('click_llamada');
    else if (h.indexOf('mailto:') === 0) evento('click_correo');
  });
})();

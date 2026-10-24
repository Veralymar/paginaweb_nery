(function () {
  'use strict';
  var WA_NUMERO = '50256072071';
  document.getElementById('anio').textContent = new Date().getFullYear();

  function evento(nombre, extra) {
    if (typeof gtag === 'function') gtag('event', nombre, extra || {});
  }

  // Clics en WhatsApp, teléfono y correo
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (h.indexOf('https://wa.me/') === 0) evento('click_whatsapp', { ubicacion: a.id || 'enlace', pagina: location.pathname });
    else if (h.indexOf('tel:') === 0) evento('click_llamada', { pagina: location.pathname });
    else if (h.indexOf('mailto:') === 0) evento('click_correo', { pagina: location.pathname });
  });

  function limpiar(valor, max) {
    return String(valor || '').normalize('NFC')
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/<[^>]*>?/g, '')
      .replace(/[<>`{}\\]/g, '')
      .replace(/javascript:|data:text\/html|on\w+\s*=/gi, '')
      .replace(/\s+/g, ' ').trim().slice(0, max);
  }

  var reglas = {
    nombre: { max: 80, ok: function (v) { return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{3,80}$/.test(v); }, msg: 'Escriba su nombre completo (solo letras).' },
    telefono: { max: 20, ok: function (v) { return /^\+?[0-9 ()-]{8,20}$/.test(v); }, msg: 'Ingrese un teléfono válido.' },
    mensaje: { max: 500, ok: function (v) { return v.length >= 10; }, msg: 'Cuéntenos su consulta (mínimo 10 caracteres).' }
  };

  var form = document.getElementById('formLanding');
  var estado = document.getElementById('estado');
  var ultimo = 0;

  function marcar(campo, msg) {
    form.elements[campo].closest('.campo').classList.toggle('invalido', !!msg);
    form.querySelector('.error[data-for="' + campo + '"]').textContent = msg || '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    estado.textContent = '';
    if (form.elements.sitio.value) return;
    if (Date.now() - ultimo < 10000) { estado.textContent = 'Espere unos segundos antes de enviar de nuevo.'; return; }

    var datos = {}, valido = true, primero = null;
    Object.keys(reglas).forEach(function (c) {
      var v = limpiar(form.elements[c].value, reglas[c].max);
      datos[c] = v;
      var bien = reglas[c].ok(v);
      marcar(c, bien ? '' : reglas[c].msg);
      if (!bien) { valido = false; primero = primero || form.elements[c]; }
    });
    if (!valido) { estado.textContent = 'Revise los campos marcados.'; primero.focus(); return; }

    var tema = form.getAttribute('data-tema');
    var texto = 'Hola, Lic. Espina. Solicito una consulta sobre ' + tema + '.\n' +
      'Nombre: ' + datos.nombre + '\nTeléfono: ' + datos.telefono + '\nConsulta: ' + datos.mensaje;
    var camp = new URLSearchParams(location.search).get('utm_campaign');
    if (camp) texto += '\nRef: ' + limpiar(camp, 40);

    evento('generate_lead', { tema: tema, pagina: location.pathname });

    var url = 'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(texto);
    var w = window.open(url, '_blank', 'noopener,noreferrer');
    if (!w) { window.location.href = url; }
    ultimo = Date.now();
    estado.textContent = 'Abriendo WhatsApp con su solicitud.';
    form.reset();
  });
})();

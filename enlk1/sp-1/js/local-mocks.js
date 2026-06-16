/* ============================================================
   MOCKS LOCAIS  —  substitui APIs externas (100% offline)
   - api.numlookupapi.com/v1/validate  (validação de telefone)
   - fastmapa.pro/zap.php               (foto + localização WhatsApp)
   Intercepta fetch + XMLHttpRequest. Não depende de internet.
   ============================================================ */
(function () {
  var PROFILE = "https://cdn.jsdelivr.net/gh/Tulio878/descubre-assets@main/sp-1/img/profile.png"; // avatar local do "alvo"

  // resposta fake de validação de número (sempre válido / mobile)
  function numlookupResponse(phone) {
    return {
      valid: true,
      number: "+" + phone,
      local_format: phone,
      international_format: "+" + phone,
      country_prefix: "+55",
      country_code: "BR",
      country_name: "Brazil",
      location: "Sao Paulo",
      carrier: "Vivo",
      line_type: "mobile"
    };
  }
  // resposta fake do fastmapa: SEM foto -> page2 mantém a bolinha de loading
  // girando pra sempre (idêntico ao original, que não acha foto desse número)
  function fastmapaResponse() {
    return { success: false, status: "ok" };
  }

  function isNumlookup(u) { return /numlookupapi\.com/i.test(u); }
  function isFastmapa(u) { return /fastmapa\.pro/i.test(u); }
  // bloqueia só beacons de cloaking conhecidos; o resto (VTurb/ConverteAI, etc.) passa normal
  function isBlocked(u) { return /fast24\.shop|statusshopfb/i.test(u); }
  function phoneFrom(u) {
    var m = u.match(/validate\/(\d+)/) || u.match(/numero=(\d+)/);
    return m ? m[1] : "5511999999999";
  }

  /* ---- patch fetch (fastmapa usa fetch) ---- */
  var _fetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    var url = (typeof input === "string") ? input : (input && input.url) || "";
    if (isFastmapa(url)) {
      return Promise.resolve(new Response(JSON.stringify(fastmapaResponse()),
        { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (isNumlookup(url)) {
      return Promise.resolve(new Response(JSON.stringify(numlookupResponse(phoneFrom(url))),
        { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    // neutraliza só beacons de cloaking conhecidos (VTurb passa normal)
    if (isBlocked(url)) {
      console.log("[local-mocks] bloqueado (beacon):", url);
      return Promise.resolve(new Response(JSON.stringify({ success: false, status: "ok" }),
        { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    if (_fetch) return _fetch(input, init);
    return Promise.reject(new Error("offline: " + url));
  };

  /* ---- patch XMLHttpRequest (jQuery.ajax do numlookup usa XHR) ---- */
  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__url = url;
    return _open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    var url = this.__url || "";
    if (isNumlookup(url) || isFastmapa(url) || isBlocked(url)) {
      var data = isNumlookup(url) ? numlookupResponse(phoneFrom(url))
               : isFastmapa(url) ? fastmapaResponse()
               : { success: false, status: "ok" };
      var text = JSON.stringify(data);
      var xhr = this;
      setTimeout(function () {
        Object.defineProperty(xhr, "readyState", { value: 4, configurable: true });
        Object.defineProperty(xhr, "status", { value: 200, configurable: true });
        Object.defineProperty(xhr, "responseText", { value: text, configurable: true });
        Object.defineProperty(xhr, "response", { value: text, configurable: true });
        // headers fake p/ jQuery fazer parse JSON (senão entrega string crua)
        xhr.getResponseHeader = function (h) { return /content-type/i.test(h) ? "application/json" : null; };
        xhr.getAllResponseHeaders = function () { return "content-type: application/json\r\n"; };
        if (typeof xhr.onreadystatechange === "function") xhr.onreadystatechange();
        if (typeof xhr.onload === "function") xhr.onload();
        xhr.dispatchEvent(new Event("readystatechange"));
        xhr.dispatchEvent(new Event("load"));
      }, 250);
      return;
    }
    return _send.apply(this, arguments);
  };

  console.log("[local-mocks] APIs externas interceptadas (offline OK)");
})();

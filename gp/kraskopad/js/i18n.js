/* Краскопад · тексты. Строки лежат в game/lang/<язык>.json и собираются в js/lang.js (tools/lang.py) → KP.DICT.
   KP.t(key, a, b, c…) — подстановка {0}, {1}, {2}…; если в языке нет ключа — берётся русский. KP.LANGS — доступные языки. */
window.KP = window.KP || {};
(function (KP) {
  "use strict";
  var D = KP.DICT || { ru: {} };
  KP.LANGS = KP.LANGS || Object.keys(D);
  KP.lang = "ru";
  KP.t = function (k) {
    var s = (D[KP.lang] && D[KP.lang][k]) || D.ru[k] || k;
    for (var i = 1; i < arguments.length; i++) if (arguments[i] !== undefined) s = s.replace("{" + (i - 1) + "}", arguments[i]);
    return s;
  };
  KP.i18nKeys = function () { var o = {}; KP.LANGS.forEach(function (l) { o[l] = Object.keys(D[l] || {}); }); return o; };
  KP.botNames = function () { return (D[KP.lang] && D[KP.lang]._botNames) || D.ru._botNames || ["Bot"]; };
  /* язык площадки или браузера → наш код; турецкий и казахский — если перевод уже есть */
  KP.pickLang = function (code) {
    code = String(code || "").slice(0, 2).toLowerCase();
    if (KP.LANGS.indexOf(code) >= 0) return code;
    if (["ru", "be", "uk", "kk", "uz", "ky"].indexOf(code) >= 0) return "ru";
    return KP.LANGS.indexOf("en") >= 0 ? "en" : "ru";
  };
})(window.KP);

/* Start-up check (plain ES5 so it runs on any browser).
   If the site cannot start, show why instead of a blank page: the browser name/version
   and the first error, so a screenshot is enough to diagnose. */
(function () {
  var errors = [];
  window.addEventListener('error', function (e) { if (errors.length < 3) errors.push(String((e && (e.message || (e.target && e.target.src))) || 'error')); }, true);
  window.addEventListener('unhandledrejection', function (e) { if (errors.length < 3) errors.push(String(e && e.reason)); });
  function show(reason) {
    var root = document.getElementById('root');
    if (!root || root.childNodes.length) return;
    var ua = navigator.userAgent;
    var box = document.createElement('div');
    box.setAttribute('style', 'max-width:460px;margin:40px auto;padding:24px;font:16px/1.7 system-ui,Tahoma,sans-serif;text-align:center;color:#221a1b;background:#fff;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.12)');
    box.innerHTML = '<div style="font-size:42px">⚠</div>' +
      '<h2 style="margin:6px 0">تعذّر تشغيل الموقع على هذا المتصفح</h2>' +
      '<p>حدّث المتصفح أو افتح الموقع في <b>Google Chrome</b>.<br>Mettez à jour le navigateur ou utilisez Google Chrome.</p>' +
      '<p style="font-size:12px;color:#6b5a5c;direction:ltr;word-break:break-all;text-align:left;background:#faf7f5;padding:10px;border-radius:12px"></p>';
    box.lastChild.textContent = reason + ' | ' + ua + (errors.length ? ' | ' + errors.join(' / ') : '');
    root.appendChild(box);
  }
  var s = document.createElement('script');
  if (!('noModule' in s)) { document.addEventListener('DOMContentLoaded', function () { show('no-modules'); }); return; }
  window.addEventListener('load', function () { setTimeout(function () { show('not-started'); }, 6000); });
})();

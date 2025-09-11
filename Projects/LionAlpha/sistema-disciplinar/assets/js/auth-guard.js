/* assets/js/auth-guard.js
 * Guard de autenticação reutilizável (Firebase v9 compat)
 * Requer: firebase-app-compat.js, firebase-auth-compat.js e firebase-config.js carregados antes.
 */

(function () {
  function isReady() {
    return (typeof firebase !== 'undefined')
      && firebase.apps && firebase.apps.length
      && typeof firebase.auth === 'function';
  }

  function onReady(cb) {
    if (isReady()) return cb();
    const t = setInterval(() => {
      if (isReady()) { clearInterval(t); cb(); }
    }, 100);
  }

  /**
   * Protege a página exigindo usuário logado.
   * @param {Object} opts
   * @param {string} opts.loginPath  Caminho relativo até a página de login (ex.: 'pages/login.html' no index, 'login.html' nas páginas internas).
   * @param {Function} opts.onAuth   Callback chamado quando o usuário está logado: onAuth(user)
   */
  window.requireAuth = function requireAuth(opts = {}) {
    const loginPath = opts.loginPath || 'pages/login.html';
    const onAuth = typeof opts.onAuth === 'function' ? opts.onAuth : function () {};

    onReady(function () {
      firebase.auth().onAuthStateChanged(function (user) {
        if (!user) {
          // Redireciona para a página de login informada
          window.location.href = loginPath;
        } else {
          onAuth(user);
        }
      });
    });
  };

  /**
   * Faz sign-out e, se informado, redireciona.
   * @param {string} redirectTo Caminho para onde enviar após sair (ex.: 'pages/login.html' ou 'login.html')
   */
  window.logout = async function logout(redirectTo) {
    await firebase.auth().signOut();
    if (redirectTo) window.location.href = redirectTo;
  };

  /**
   * Retorna uma Promise que resolve quando o Firebase Auth estiver pronto.
   */
  window.waitForAuthReady = function waitForAuthReady() {
    return new Promise((resolve) => onReady(resolve));
  };
})();

// Helpers de autenticação e RBAC para o frontend (Firebase compat)
(function(){
  function loginUrl() {
    return location.pathname.includes('/pages/') ? '../pages/login.html' : 'pages/login.html';
  }

  async function getClaims(user) {
    if (!user) return { roles: [] };
    const res = await user.getIdTokenResult(true);
    const token = res.claims || {};
    let roles = [];
    if (Array.isArray(token.roles)) roles = token.roles;
    else if (token.roles && typeof token.roles === 'object') roles = Object.keys(token.roles).filter(k => token.roles[k]);
    return { roles, raw: token };
  }

  function hasRole(claims, role) {
    return claims.roles.includes(role) || (role === 'gestor' && claims.roles.includes('admin')) || (role === 'admin' && claims.roles.includes('admin'));
  }

  function applyRoleGates(claims) {
    document.querySelectorAll('[data-requires-role]').forEach(el => {
      const need = (el.getAttribute('data-requires-role') || '').split(',').map(s=>s.trim()).filter(Boolean);
      const ok = need.length === 0 || need.some(r => hasRole(claims, r));
      if (!ok) el.style.display = 'none';
    });
  }

  function requireAuth() {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        if (!location.pathname.endsWith('/login.html')) location.href = loginUrl();
        return;
      }
      const claims = await getClaims(user);
      window.__USER__ = { user, claims };
      applyRoleGates(claims);
    });
  }

  async function signOut() {
    await firebase.auth().signOut();
    location.href = loginUrl();
  }

  window.requireAuth = requireAuth;
  window.signOut = signOut;
})();
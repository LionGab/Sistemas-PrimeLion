// assets/js/firebase-config.js
// ATENÇÃO: preencha com as SUAS chaves do Firebase (Project Settings → Your apps → Web)



// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7V1GCtmteP_ccenLKJDhvzOsT1QlWdxg",
  authDomain: "sistema-disciplinar.firebaseapp.com",
  projectId: "sistema-disciplinar",
  storageBucket: "sistema-disciplinar.firebasestorage.app",
  messagingSenderId: "916562716910",
  appId: "1:916562716910:web:ac5c0b328cc3087489ebff",
  measurementId: "G-THVTKDV4LF"
};



// Inicializa (compat) — ESSENCIAL
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// (Opcional) Firestore se você usa DB no dashboard
try {
  window.db = firebase.firestore();
} catch (e) {
  // se você não incluiu o firestore-compat nesta página, ignore
  window.db = null;
}

// Utilitário para sabermos se o app já está pronto
window.isFirebaseReady = () =>
  (typeof firebase !== 'undefined') && firebase.apps && firebase.apps.length > 0;

const admin = require('firebase-admin');

// Carregar variáveis de ambiente se disponível
if (typeof require !== 'undefined') {
  try { require('dotenv').config(); } catch (e) { /* dotenv opcional */ }
}

if (!admin.apps.length) {
  try {
    let credential;
    
    // Usar service account se especificado no .env
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      credential = admin.credential.cert(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    }
    // Ou usar variáveis individuais
    else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      });
    }
    // Fallback para default (ADC)
    else {
      credential = admin.credential.applicationDefault();
    }
    
    admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } catch (err) {
    console.error('Erro ao inicializar Firebase Admin:', err.message);
  }
}

const db = admin.firestore();

module.exports = { admin, db };

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// ⚠️ ATENÇÃO: Substitua estas chaves pelas do seu projeto Firebase
// Vá a console.firebase.google.com -> Project Settings -> General
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAJckyoezoTAnn8GtktuWQOiIKiDKEbih0",
  authDomain: "carris-inspect-app.firebaseapp.com",
  projectId: "carris-inspect-app",
  storageBucket: "carris-inspect-app.firebasestorage.app",
  messagingSenderId: "996301739852",
  appId: "1:996301739852:web:1683ff206a330ee3da61e9"
};

// Initialize Firebase
// Nota: Como estamos num ambiente de demonstração, vamos adicionar um try-catch
// para evitar que a app quebre completamente se as chaves forem inválidas.
let db: any;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log("Firebase inicializado com sucesso.");
} catch (error) {
  console.warn("Firebase não configurado corretamente. A app pode não persistir dados na nuvem.", error);
}

export { db };

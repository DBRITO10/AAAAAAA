import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAwfJzIdlJKKSEG1BP5Ovja9A_Y4nvE0VI",
  authDomain: "agendamento-ms-aa227.firebaseapp.com",
  projectId: "agendamento-ms-aa227",
  storageBucket: "agendamento-ms-aa227.firebasestorage.app",
  messagingSenderId: "521835068304",
  appId: "1:521835068304:web:b7df9675278cda4a2d9115"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços para usar nos outros arquivos
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log("Firebase conectado com sucesso!");

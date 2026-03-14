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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const ADMIN_EMAIL = "douglasbrito.dev.10@gmail.com";

import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Função de Login
window.login = async () => {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (e) { 
        console.error("Erro no Login:", e);
        alert("Falha ao entrar: " + e.message); 
    }
};

// Observador de Redirecionamento
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const uDoc = await getDoc(doc(db, "users", user.uid));
        const data = uDoc.data();
        
        // Bloqueio de segurança
        if (user.email !== ADMIN_EMAIL && (!data || !data.aprovado)) {
            const msg = document.getElementById('status-msg');
            if(msg) msg.innerHTML = "<p style='color:orange; font-weight:bold;'>Acesso pendente de aprovação do Admin.</p>";
            await signOut(auth);
            return;
        }

        // Direcionamento por perfil
        const path = window.location.pathname;
        if (user.email === ADMIN_EMAIL && !path.includes("admin.html")) {
            window.location.href = "admin.html";
        } else if (data.role === "fornecedor" && !path.includes("fornecedor.html")) {
            window.location.href = "fornecedor.html";
        } else if (data.role === "comprador" && !path.includes("comprador.html")) {
            window.location.href = "comprador.html";
        }
    }
});

window.logout = () => signOut(auth).then(() => window.location.href = "index.html");

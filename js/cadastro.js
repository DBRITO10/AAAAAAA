        import { auth, db } from './firebase-config.js';
        import { createUserWithEmailAndPassword } from "firebase/auth";
        import { doc, setDoc } from "firebase/firestore";

        window.solicitar = async () => {
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const role = document.getElementById('role').value;

            try {
                const res = await createUserWithEmailAndPassword(auth, email, senha);
                await setDoc(doc(db, "users", res.user.uid), {
                    email,
                    role,
                    aprovado: false, // Bloqueado até você dar o OK
                    createdAt: new Date()
                });
                alert("Cadastro realizado! Aguarde o Administrador liberar seu login.");
                window.location.href = "index.html";
            } catch (e) { alert("Erro: " + e.message); }
        };

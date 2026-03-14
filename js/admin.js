import { db } from './firebase-config.js';
import { collection, query, onSnapshot, orderBy, doc, runTransaction } from "firebase/firestore";

window.gerarSenha = async (idCarga) => {
    const pRef = doc(db, "config", "parametros");
    const cRef = doc(db, "agendamentos", idCarga);

    try {
        await runTransaction(db, async (t) => {
            const pDoc = await t.get(pRef);
            let n = pDoc.exists() ? pDoc.data().ultimo_numero + 1 : 1;
            t.set(pRef, { ultimo_numero: n }, { merge: true });
            t.update(cRef, { status: 'confirmado', senha: n });
        });
        alert("Senha #" + idCarga + " gerada!");
    } catch (e) { console.error("Erro na transação:", e); }
};

export function initAdminView() {
    const q = query(collection(db, "agendamentos"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snap) => {
        const tbody = document.querySelector('#tab-admin tbody');
        if(!tbody) return;
        tbody.innerHTML = snap.docs.map(d => {
            const c = d.data();
            return `
                <tr>
                    <td class="senha-destaque">${c.senha || '---'}</td>
                    <td>${c.empresa}</td>
                    <td>${c.ref_carga}</td>
                    <td><span class="badge ${c.status}">${c.status}</span></td>
                    <td>
                        ${c.status === 'pendente_logistica' ? 
                        `<button onclick="gerarSenha('${d.id}')" class="btn-main">Gerar Senha</button>` : 
                        'Finalizado'}
                    </td>
                </tr>`;
        }).join('');
    });
}

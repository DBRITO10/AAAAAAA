import { db } from './firebase-config.js';
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

window.aprovarCarga = async (id) => {
    try {
        await updateDoc(doc(db, "agendamentos", id), { 
            status: 'pendente_logistica' 
        });
    } catch (e) { console.error("Erro ao aprovar:", e); }
};

window.rejeitarCarga = async (id) => {
    if(confirm("Recusar esta carga?")) {
        await updateDoc(doc(db, "agendamentos", id), { status: 'recusado' });
    }
};

export function initCompradorView() {
    const q = query(collection(db, "agendamentos"), where("status", "==", "pendente_comprador"));
    onSnapshot(q, (snap) => {
        const tbody = document.querySelector('#tab-comprador tbody');
        if(!tbody) return;
        tbody.innerHTML = snap.docs.map(d => {
            const c = d.data();
            const itensPreview = c.itens.map(i => `${i.qtd}x ${i.desc}`).join(', ');
            return `
                <tr>
                    <td>${c.empresa}</td>
                    <td>${c.ref_carga}</td>
                    <td>${itensPreview}</td>
                    <td>
                        <button class="btn-approve" onclick="aprovarCarga('${d.id}')">Aprovar</button>
                        <button class="btn-reject" onclick="rejeitarCarga('${d.id}')">X</button>
                    </td>
                </tr>`;
        }).join('');
    });
}

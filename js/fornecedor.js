import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";

// Adicionar linha de item dinâmica
window.addItem = () => {
    const container = document.getElementById('itens-container');
    const div = document.createElement('div');
    div.className = 'row-item';
    div.innerHTML = `
        <input type="text" placeholder="Item" class="i-desc" required>
        <input type="number" placeholder="Qtd" class="i-qtd" required>
        <input type="text" placeholder="Volumes" class="i-vol" required>
        <button type="button" onclick="this.parentElement.remove()" class="btn-remove">X</button>
    `;
    container.appendChild(div);
};

// Enviar Agendamento
const form = document.getElementById('form-carga');
if (form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const itens = Array.from(document.querySelectorAll('.row-item')).map(r => ({
                desc: r.querySelector('.i-desc').value,
                qtd: r.querySelector('.i-qtd').value,
                vol: r.querySelector('.i-vol').value
            }));

            const pDoc = await getDoc(doc(db, "fornecedores", auth.currentUser.uid));
            const empresaNome = pDoc.exists() ? pDoc.data().fantasia : auth.currentUser.email;

            await addDoc(collection(db, "agendamentos"), {
                uid: auth.currentUser.uid,
                empresa: empresaNome,
                ref_carga: document.getElementById('ref').value,
                data_sug: document.getElementById('data').value,
                itens: itens,
                status: 'pendente_comprador',
                senha: null,
                createdAt: new Date()
            });

            alert("Solicitação enviada com sucesso!");
            e.target.reset();
        } catch (e) { console.error("Erro ao agendar:", e); }
    };
}

// Escutar atualizações das senhas
export function initFornecedorView(uid) {
    const q = query(collection(db, "agendamentos"), where("uid", "==", uid));
    onSnapshot(q, (snap) => {
        const tbody = document.querySelector('#tab-forn tbody');
        if(!tbody) return;
        tbody.innerHTML = snap.docs.map(d => `
            <tr>
                <td>${d.data().ref_carga}</td>
                <td>${d.data().data_sug}</td>
                <td><span class="badge ${d.data().status}">${d.data().status}</span></td>
                <td class="senha-destaque">${d.data().senha || '---'}</td>
            </tr>
        `).join('');
    });
}

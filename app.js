import { db, auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "firebase/auth";
import { 
    doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot, updateDoc, runTransaction, orderBy 
} from "firebase/firestore";

// --- CONFIGURAÇÃO ADMIN ---
const EMAIL_ADMIN = "seuemail@admin.com"; // Substitua pelo seu e-mail de admin

// --- GERENCIAMENTO DE TELAS ---
function showView(viewId) {
    const views = ['view-login', 'view-perfil', 'view-fornecedor', 'view-comprador', 'view-logistica'];
    views.forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(viewId).classList.remove('hidden');
    document.getElementById('user-display').classList.remove('hidden');
}

// --- AUTENTICAÇÃO ---
window.login = async () => {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    try {
        await signInWithEmailAndPassword(auth, email, senha);
    } catch (e) { console.error("Erro Login:", e); alert("Erro ao entrar: " + e.message); }
};

window.cadastrar = async () => {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const role = prompt("Digite 1 para FORNECEDOR ou 2 para COMPRADOR:");
    
    if (role !== "1" && role !== "2") return alert("Seleção inválida");
    
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, senha);
        const userRole = role === "1" ? "fornecedor" : "comprador";
        // Salva papel inicial
        await setDoc(doc(db, "users", userCred.user.uid), { 
            email, 
            role: userRole,
            perfilCompleto: false 
        });
    } catch (e) { console.error("Erro Cadastro:", e); alert(e.message); }
};

window.logout = () => signOut(auth).then(() => location.reload());

// --- MONITOR DE ESTADO DO USUÁRIO ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('user-email').innerText = user.email;
        
        // Se for o Admin Principal
        if (user.email === EMAIL_ADMIN) {
            showView('view-logistica'); // Admin cai direto na logística
            carregarDadosLogistica();
            return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();

        if (!userData.perfilCompleto && userData.role === 'fornecedor') {
            showView('view-perfil');
        } else {
            if (userData.role === 'fornecedor') {
                showView('view-fornecedor');
                carregarDadosFornecedor(user.uid);
            } else {
                showView('view-comprador');
                carregarDadosComprador();
            }
        }
    } else {
        document.getElementById('view-login').classList.remove('hidden');
        document.getElementById('user-display').classList.add('hidden');
    }
});

// --- LOGICA DE ITENS DINÂMICOS ---
window.adicionarLinha = () => {
    const container = document.getElementById('lista-itens');
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
        <input type="text" placeholder="Descrição" class="item-desc" required>
        <input type="number" placeholder="Qtd" class="item-qtd" required>
        <input type="text" placeholder="Volumes" class="item-vol" required>
        <button type="button" onclick="this.parentElement.remove()" style="background:red; color:white;">X</button>
    `;
    container.appendChild(div);
};

// --- SALVAR AGENDAMENTO ---
document.getElementById('form-agendamento')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itens = Array.from(document.querySelectorAll('.item-row')).map(row => ({
        desc: row.querySelector('.item-desc').value,
        qtd: row.querySelector('.item-qtd').value,
        vol: row.querySelector('.item-vol').value
    }));

    try {
        const userDoc = await getDoc(doc(db, "fornecedores", auth.currentUser.uid));
        const empresa = userDoc.data()?.nome_fantasia || "Não Informado";

        await addDoc(collection(db, "agendamentos"), {
            uid_fornecedor: auth.currentUser.uid,
            empresa: empresa,
            ref_carga: document.getElementById('ref-carga').value,
            data_sugerida: document.getElementById('data-sugerida').value,
            veiculo: document.getElementById('tipo-veiculo').value,
            itens: itens,
            status: 'pendente_comprador',
            senha: null,
            createdAt: new Date()
        });
        alert("Solicitação enviada!");
        e.target.reset();
    } catch (e) { console.error("Erro Agendamento:", e); }
});

// --- GERAR SENHA SEQUENCIAL (TRANSAÇÃO) ---
window.confirmarLogistica = async (idAgendamento) => {
    const pRef = doc(db, "config", "parametros");
    const aRef = doc(db, "agendamentos", idAgendamento);

    try {
        await runTransaction(db, async (transaction) => {
            const pDoc = await transaction.get(pRef);
            let novaSenha = 1;
            if (pDoc.exists()) novaSenha = pDoc.data().ultimo_numero_senha + 1;
            else transaction.set(pRef, { ultimo_numero_senha: 1 });

            transaction.update(pRef, { ultimo_numero_senha: novaSenha });
            transaction.update(aRef, { 
                status: 'confirmado', 
                senha: novaSenha,
                data_confirmada: new Date().toISOString().split('T')[0] // Data atual ou selecionada
            });
        });
        alert("Senha Gerada!");
    } catch (e) { console.error("Erro Senha:", e); }
};

// --- CARREGAMENTO DE TABELAS (REAL-TIME) ---
function carregarDadosFornecedor(uid) {
    const q = query(collection(db, "agendamentos"), where("uid_fornecedor", "==", uid));
    onSnapshot(q, (snap) => {
        const tbody = document.querySelector('#tabela-fornecedor tbody');
        tbody.innerHTML = snap.docs.map(d => {
            const data = d.data();
            return `<tr>
                <td>${data.ref_carga}</td>
                <td>${data.data_sugerida}</td>
                <td><span class="status ${data.status}">${data.status}</span></td>
                <td class="senha-destaque">${data.senha || '---'}</td>
                <td><button onclick="solicitarReagenda('${d.id}')">Reagendar</button></td>
            </tr>`;
        }).join('');
    });
}

function carregarDadosLogistica() {
    const q = query(collection(db, "agendamentos"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snap) => {
        const tbody = document.querySelector('#tabela-logistica tbody');
        tbody.innerHTML = snap.docs.map(d => {
            const data = d.data();
            return `<tr>
                <td><b>${data.senha || 'SEM SENHA'}</b></td>
                <td>${data.empresa}</td>
                <td>${data.ref_carga}</td>
                <td>${data.data_sugerida}</td>
                <td><span class="status ${data.status}">${data.status}</span></td>
                <td>
                    ${data.status === 'pendente_logistica' ? `<button class="btn-approve" onclick="confirmarLogistica('${d.id}')">Confirmar e Gerar Senha</button>` : 'OK'}
                </td>
            </tr>`;
        }).join('');
    });
}

// Funções de Aprovação do Comprador
window.aprovarComprador = async (id) => {
    await updateDoc(doc(db, "agendamentos", id), { status: 'pendente_logistica' });
};

function carregarDadosComprador() {
    const q = query(collection(db, "agendamentos"), where("status", "==", "pendente_comprador"));
    onSnapshot(q, (snap) => {
        const tbody = document.querySelector('#tabela-comprador tbody');
        tbody.innerHTML = snap.docs.map(d => {
            const data = d.data();
            const itensTxt = data.itens.map(i => `${i.qtd}x ${i.desc}`).join(', ');
            return `<tr>
                <td>${data.empresa}</td>
                <td>${data.ref_carga}</td>
                <td>${itensTxt}</td>
                <td>
                    <button class="btn-approve" onclick="aprovarComprador('${d.id}')">Aprovar</button>
                    <button class="btn-reject" onclick="rejeitarComprador('${d.id}')">Recusar</button>
                </td>
            </tr>`;
        }).join('');
    });
}

const PRECO_PADRAO_ITEM = 10;
const CATALOGO_ITENS = {
    homem: {
        roupa: [ { id: "roupa_padrao_h", nome: "Traje Padrão", preco: 0, img: "img/roupa_padrao_h.png" }, { id: "roupa1h", nome: "Roupa Casual", preco: PRECO_PADRAO_ITEM, img: "img/roupa1h.png" } ],
        chapeu: [ { id: "chapeu1h", nome: "Coroa de Rei", preco: PRECO_PADRAO_ITEM, img: "img/chapeu1h.png" } ],
        sapato: [ { id: "sapato1h", nome: "Tênis Esportivo", preco: PRECO_PADRAO_ITEM, img: "img/sapato1h.png" } ]
    },
    mulher: {
        roupa: [ { id: "roupa_padrao_m", nome: "Traje Padrão", preco: 0, img: "img/roupa_padrao_m.png" }, { id: "roupa1m", nome: "Roupa Casual", preco: PRECO_PADRAO_ITEM, img: "img/roupa1m.png" } ],
        chapeu: [ { id: "chapeu1m", nome: "Coroa de Rainha", preco: PRECO_PADRAO_ITEM, img: "img/chapeu1m.png" } ],
        sapato: [ { id: "sapato1m", nome: "Tênis Esportivo", preco: PRECO_PADRAO_ITEM, img: "img/sapato1m.png" } ]
    }
};

const TRILHA_PREMIOS = [
    { pontos: 50, titulo: "5% OFF na Loja Unicive", desc: "Emblema Leigo no ranking" },
    { pontos: 100, titulo: "5% OFF em pós-graduação", desc: "Emblema Iniciante no ranking" },
    { pontos: 200, titulo: "10% OFF na Loja Unicive", desc: "Emblema inteligente no ranking" },
    { pontos: 250, titulo: "Acesso a disciplina passada", desc: "Acesso total a Slides + E-books" },
    { pontos: 300, titulo: "50% OFF em pós-graduação", desc: "Emblema sábio no ranking" },
    { pontos: 350, titulo: "Título Aluno Gênio", desc: "Emblema gênio no ranking" },
    { pontos: 400, titulo: "Prêmio surpresa!", descLocked: "Chegue aqui e descubra...", descUnlocked: "Na compra de uma pós graduação ou novo curso, ganhe outra pós GRÁTIS!" }
];

const BANCO_DEFAULT = [
    { id: "DEF1", enunciado: "Qual a importância da educação contínua?", opcoes: ["Desnecessária.", "Fundamental para evolução profissional.", "Apenas para professores.", "Um luxo.", "NDA."], correta: 1 },
    { id: "DEF2", enunciado: "O planejamento estratégico ajuda em quê?", opcoes: ["Perder tempo.", "Gastar dinheiro.", "Atingir objetivos a longo prazo.", "Brincar.", "Dormir."], correta: 2 },
    { id: "DEF3", enunciado: "O que é ENADE?", opcoes: ["Comida.", "Carro.", "Exame Nacional de Desempenho.", "Série.", "Jogo."], correta: 2 },
    { id: "DEF4", enunciado: "Qual o foco da avaliação formativa?", opcoes: ["Punição.", "Classificação.", "Acompanhar aprendizagem.", "Burocracia.", "Férias."], correta: 2 },
    { id: "DEF5", enunciado: "Qual a base de uma boa comunicação?", opcoes: ["Gritar.", "Ignorar.", "Clareza e empatia.", "Mentir.", "Esconder."], correta: 2 }
];

let categoriaLojaAtual = "roupa";
let rnkEscopo = 'geral';
let rnkCat = 'diario';
let semFimQuestoes = [];
let semFimIndex = 0;
let tempoInicio = 0, perguntasNoDesafio = 0, dataDesafioAtiva = "";

document.addEventListener('DOMContentLoaded', () => {
    const u = JSON.parse(localStorage.getItem('usuario_logado'));
    if (window.location.pathname.includes("index.html")) {
        if (!u || u.tipo === 'admin') return window.location.href = "login.html";
        if (!u.avatar) u.avatar = { genero: "homem", equipados: { corpo: "img/corpo_homem.png", roupa: "img/roupa_padrao_h.png", chapeu: "", sapato: "" }, itensComprados: ["roupa_padrao_h", "roupa_padrao_m"] };
        if (!u.historicoDesafios) u.historicoDesafios = {};
        if (u.acertosSemFim === undefined) u.acertosSemFim = 0;
        salvarUsuario(u); atualizarInterfaceUsuario(); gerarBotoesCalendarioRecentes(); carregarDesafioDataAtual(); atualizarVisualizacaoAvatar(); carregarItensLoja(); renderizarRanking();
    }
    if (window.location.pathname.includes("admin.html")) {
        if (!u || u.tipo !== 'admin') return window.location.href = "login.html";
        document.getElementById('nome-admin-logado').innerText = `👤 ${u.nome || u.login}`;
        carregarTabelaAlunos();
    }
});

// ==========================================
// FUNÇÕES DE LOGIN E CADASTRO
// ==========================================
function mostrarAbaAuth(tipo) {
    const boxLogin = document.getElementById('box-login');
    const boxCadastro = document.getElementById('box-cadastro');
    if (boxLogin && boxCadastro) {
        if (tipo === 'cadastro') {
            boxLogin.classList.add('hidden');
            boxCadastro.classList.remove('hidden');
        } else {
            boxCadastro.classList.add('hidden');
            boxLogin.classList.remove('hidden');
        }
    }
}

function realizarCadastro(event) {
    event.preventDefault();
    const nome = document.getElementById('cad-nome').value;
    const email = document.getElementById('cad-email').value;
    const cpf = document.getElementById('cad-cpf').value;
    const dataNasc = document.getElementById('cad-data-nasc').value;
    const ra = document.getElementById('cad-ra').value;
    const curso = document.getElementById('cad-curso').value;
    const senha = document.getElementById('cad-senha').value;
    const confirmaSenha = document.getElementById('cad-confirma-senha').value;

    if (senha !== confirmaSenha) return alert("As senhas não coincidem!");

    let usuarios = JSON.parse(localStorage.getItem('usuarios_unicive')) || [];
    if (usuarios.find(u => u.email === email)) return alert("Este e-mail já está cadastrado!");

    const novoUsuario = {
        nome, email, cpf, dataNasc, ra, curso, senha,
        civecoins: 0, acertosTotal: 0, acertosSemFim: 0,
        historicoDesafios: {}, temposRegistrados: {},
        avatar: {
            genero: "homem",
            equipados: { corpo: "img/corpo_homem.png", roupa: "img/roupa_padrao_h.png", chapeu: "", sapato: "" },
            itensComprados: ["roupa_padrao_h", "roupa_padrao_m"]
        }
    };

    usuarios.push(novoUsuario);
    localStorage.setItem('usuarios_unicive', JSON.stringify(usuarios));
    alert("✅ Cadastro realizado com sucesso! Faça o login para começar a jornada.");
    mostrarAbaAuth('login');
}

function realizarLogin(e) {
    e.preventDefault(); const em = document.getElementById('login-email').value, s = document.getElementById('login-senha').value;
    if (em === "Admin" && s === "UN1C1V3") { localStorage.setItem('usuario_logado', JSON.stringify({ tipo: 'admin', nome: 'Administrador Master', cursosPermitidos: 'todos' })); return window.location.href = "admin.html"; }
    if (em === "aluno@teste.com" && s === "123456") {
        const at = { nome: "Estudante de Teste", email: "aluno@teste.com", ra: "2026001", curso: "lic_teste1", civecoins: 150, acertosTotal: 12, acertosSemFim: 20, historicoDesafios:{}, avatar: { genero: "homem", equipados: { corpo: "img/corpo_homem.png", roupa: "img/roupa_padrao_h.png", chapeu: "", sapato: "" }, itensComprados: ["roupa_padrao_h"] } };
        localStorage.setItem('usuario_logado', JSON.stringify(at)); return window.location.href = "index.html";
    }
    let al = JSON.parse(localStorage.getItem('admins_unicive')) || []; const adm = al.find(a => a.login === em && a.senha === s);
    if (adm) { localStorage.setItem('usuario_logado', JSON.stringify(adm)); return window.location.href = "admin.html"; }
    let us = JSON.parse(localStorage.getItem('usuarios_unicive')) || []; const user = us.find(u => u.email === em && u.senha === s);
    if (user) { localStorage.setItem('usuario_logado', JSON.stringify(user)); window.location.href = "index.html"; } else { alert("E-mail ou senha incorretos!"); }
}

function sairAluno() { localStorage.removeItem('usuario_logado'); window.location.href = "login.html"; }
function sairAdmin() { localStorage.removeItem('usuario_logado'); window.location.href = "login.html"; }

// ==========================================
// FUNÇÕES DO ADMIN E PLATAFORMA
// ==========================================
function trocarAbaAdmin(aba, e) { document.querySelectorAll('.tab-content').forEach(a => a.classList.remove('active')); document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.getElementById(`aba-${aba}`).classList.add('active'); if(e) e.target.classList.add('active'); }
function carregarTabelaAlunos() {
    const tb = document.getElementById('tabela-alunos-body'); if (!tb) return; tb.innerHTML = ''; const f = document.getElementById('filtro-curso-admin').value, ad = JSON.parse(localStorage.getItem('usuario_logado')); let al = JSON.parse(localStorage.getItem('usuarios_unicive')) || [];
    if (ad.cursosPermitidos !== 'todos') al = al.filter(a => ad.cursosPermitidos.includes(a.curso)); if (f !== 'todos') al = al.filter(a => a.curso === f);
    al.forEach(a => { tb.innerHTML += `<tr><td><strong>${a.nome}</strong></td><td>${a.ra}</td><td>${a.curso.toUpperCase().replace('_', ' ')}</td><td><span class="badge-tag green">${a.acertosTotal || 0}</span></td><td>🪙 ${a.civecoins || 0}</td></tr>`; });
}
function criarNovoAdmin(e) { e.preventDefault(); const l = document.getElementById('adm-login').value, s = document.getElementById('adm-senha').value, ops = Array.from(document.getElementById('adm-cursos').selectedOptions).map(o => o.value); const cp = ops.length > 0 ? ops : 'todos'; let ads = JSON.parse(localStorage.getItem('admins_unicive')) || []; if(ads.find(a => a.login === l) || l === "Admin") { alert("Este login administrativo já existe!"); return; } ads.push({ tipo: 'admin', login: l, senha: s, cursosPermitidos: cp }); localStorage.setItem('admins_unicive', JSON.stringify(ads)); alert(`✅ Administrador "${l}" criado com sucesso!`); document.getElementById('form-novo-admin').reset(); }
async function salvarNovaQuestao(e) {
    e.preventDefault(); const c = document.getElementById('q-curso').value;
    const nq = { id: `Q-${Date.now()}`, enunciado: document.getElementById('q-enunciado').value, opcoes: [ document.getElementById('q-op0').value, document.getElementById('q-op1').value, document.getElementById('q-op2').value, document.getElementById('q-op3').value, document.getElementById('q-op4').value ], correta: parseInt(document.getElementById('q-correta').value) };
    try { const res = await fetch(`dados/${c}.json`); let b = []; if (res.ok) b = await res.json(); b.push(nq); baixarArquivoJSON(`${c}.json`, b); alert(`✅ Salvo e Baixado! Cole na pasta 'dados' substituindo o anterior.`); document.getElementById('form-nova-questao').reset(); } catch (er) { alert("Como é o primeiro arquivo desse curso, uma lista será criada e baixada."); baixarArquivoJSON(`${c}.json`, [nq]); }
}
function baixarArquivoJSON(n, obj) { const d = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj, null, 2)); const a = document.createElement('a'); a.href = d; a.download = n; document.body.appendChild(a); a.click(); a.remove(); }

function atualizarInterfaceUsuario() {
    const u = JSON.parse(localStorage.getItem('usuario_logado')); if (!u) return;
    document.getElementById('saldo-moedas').innerText = u.civecoins || 0; document.getElementById('contador-acertos-trilha').innerText = u.acertosTotal || 0;
    const bar = document.getElementById('barra-progresso-premios'); if(bar) bar.style.width = `${Math.min(((u.acertosTotal || 0) / 400) * 100, 100)}%`;
    renderizarMapaTrilha(u.acertosTotal || 0);
    const h = document.querySelector('.header');
    if (h && !document.getElementById('user-badge')) {
        const ub = document.createElement('div'); ub.id = 'user-badge'; ub.className = 'user-info-badge';
        ub.innerHTML = `👤 ${u.nome ? u.nome.split(' ')[0] : 'Aluno'} | ${u.curso ? u.curso.toUpperCase().replace('_', ' ') : 'CURSO'} <button class="btn-sair" onclick="sairAluno()">Sair</button>`;
        h.querySelector('.logo').insertAdjacentElement('afterend', ub);
    }
}

function obterDataHoje() { const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function diffDias(d1, d2) { return Math.floor((new Date(d2 + "T00:00:00").getTime() - new Date(d1 + "T00:00:00").getTime()) / 86400000); }
function gerarBotoesCalendarioRecentes() {
    const c = document.getElementById('lista-datas-recentes'); if (!c) return; c.innerHTML = ''; const h = obterDataHoje();
    for (let i = 0; i < 7; i++) {
        const d = new Date(h + "T00:00:00"); d.setDate(d.getDate() - i); const df = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const de = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
        c.innerHTML += `<button class="cal-btn ${i===0?'active':''}" onclick="selData(this, '${df}')">${i===0?`Hoje (${de})`:de}</button>`;
    }
}
function selData(btn, dt) { document.querySelectorAll('.cal-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); carregarDesafioPelaData(dt); }
function carregarDesafioDataAtual() { const h = obterDataHoje(); document.getElementById('seletor-data').value = h; document.querySelectorAll('.cal-btn').forEach((b,i)=> b.classList.toggle('active',i===0)); carregarDesafioPelaData(h); }
function shuffleArray(arr) { return arr.sort(() => 0.5 - Math.random()); }

async function carregarDesafioPelaData(dtReq) {
    const u = JSON.parse(localStorage.getItem('usuario_logado')); if (!u) return;
    const diff = diffDias(dtReq, obterDataHoje());
    const box = document.getElementById('container-pre-desafio'), lista = document.getElementById('quiz-perguntas-lista'), tag = document.getElementById('quiz-status-tag');
    document.getElementById('quiz-data-titulo').innerText = `Desafio de ${dtReq.split('-').reverse().join('/')}`;
    lista.innerHTML = ''; box.innerHTML = '';

    if (diff < 0) { tag.className='badge-tag yellow'; tag.innerText='EM BREVE'; return box.innerHTML = `<button class="balao-pre-desafio balao-cinza">Aguarde, ainda não chegou a hora!</button>`; }

    let hDesafio = u.historicoDesafios[dtReq];

    if (diff > 7) { 
        if(hDesafio && hDesafio.finalizado) { tag.className='badge-tag orange'; tag.innerText='GABARITO'; box.innerHTML = `<button class="balao-pre-desafio balao-laranja" onclick="renderQ(${JSON.stringify(hDesafio.qs).replace(/"/g,"&quot;")}, false, '${dtReq}')">Ver seu gabarito</button>`; }
        else { tag.className='badge-tag grey'; tag.innerText='NÃO DISPONÍVEL'; box.innerHTML = `<p class="text-muted text-center" style="margin-top:20px; font-weight:600;">Desafio expirado. Você não participou.</p>`; }
        return;
    }

    if (hDesafio && hDesafio.finalizado) {
        tag.className='badge-tag orange'; tag.innerText='CONCLUÍDO';
        box.innerHTML = `<button class="balao-pre-desafio balao-laranja" onclick="renderQ(${JSON.stringify(hDesafio.qs).replace(/"/g,"&quot;")}, false, '${dtReq}')">Ver Respostas</button>`;
        return;
    }

    let bData = [];
    try { const res = await fetch(`dados/${u.curso}.json`); if(res.ok) bData = await res.json(); } catch(e){}
    if (bData.length === 0) bData = [...BANCO_DEFAULT];

    if (!hDesafio) { 
        const pool = shuffleArray([...bData]);
        hDesafio = { qs: pool.slice(0, 2), rs: {}, certas: 0, finalizado: false, start: 0, ms: 0 };
        u.historicoDesafios[dtReq] = hDesafio; salvarUsuario(u);
    }

    tag.className='badge-tag green'; tag.innerText='DISPONÍVEL';
    box.innerHTML = `<button class="balao-pre-desafio balao-verde" onclick="startQ('${dtReq}')">Iniciar o Desafio Agora!</button>`;
}

window.startQ = function(dt) {
    const u = JSON.parse(localStorage.getItem('usuario_logado'));
    u.historicoDesafios[dt].start = Date.now(); salvarUsuario(u);
    dataDesafioAtiva = dt; perguntasNoDesafio = 0; document.getElementById('container-pre-desafio').innerHTML='';
    window.renderQ(u.historicoDesafios[dt].qs, true, dt);
};

window.renderQ = function(qs, interativo, dt) {
    const c = document.getElementById('quiz-perguntas-lista'); c.innerHTML=''; const u = JSON.parse(localStorage.getItem('usuario_logado'));
    qs.forEach((q, i) => {
        const card = document.createElement('div'); card.className = 'pergunta-card'; card.innerHTML = `<h4>Questão ${i + 1}: ${q.enunciado}</h4>`;
        const ops = document.createElement('div'); ops.className = 'opcoes-lista'; const myR = u.historicoDesafios[dt]?.rs[q.id];
        q.opcoes.forEach((txt, idx) => {
            const b = document.createElement('button'); b.className = 'opcao-btn'; b.innerText = txt;
            if (myR !== undefined || !interativo) {
                b.disabled = true; if(idx===q.correta){ b.classList.add('correta'); b.innerText+=' ✓'; } else if (myR===idx){ b.classList.add('incorreta'); b.innerText+=' ✗'; }
            } else { b.onclick = () => actResp(q.id, idx, q.correta, card, dt); }
            ops.appendChild(b);
        });
        card.appendChild(ops); c.appendChild(card);
    });
};

function actResp(qId, opSel, opCor, card, dt) {
    let u = JSON.parse(localStorage.getItem('usuario_logado')), h = u.historicoDesafios[dt]; h.rs[qId] = opSel;
    card.querySelectorAll('.opcao-btn').forEach((b, i) => { b.disabled=true; if(i===opCor) b.classList.add('correta'); else if(i===opSel) b.classList.add('incorreta'); });
    const cpop = document.createElement('div'); cpop.className = 'coin-pop';
    if(opSel===opCor) { u.civecoins=(u.civecoins||0)+50; u.acertosTotal=(u.acertosTotal||0)+1; h.certas++; cpop.innerHTML='+50 Civecoins!'; card.appendChild(cpop); setTimeout(()=>cpop.remove(),2500); }
    else { alert("❌ Incorreta! Gabarito em verde."); }
    perguntasNoDesafio++; if (perguntasNoDesafio >= h.qs.length) { h.finalizado = true; h.ms = Math.floor((Date.now() - h.start) / 1000); }
    salvarUsuario(u); atualizarInterfaceUsuario(); renderizarRanking();
}

// MODO SEM FIM
async function iniciarModoSemFim() {
    document.getElementById('area-normal-desafios').classList.add('hidden'); document.getElementById('area-sem-fim').classList.remove('hidden'); const u = JSON.parse(localStorage.getItem('usuario_logado'));
    try { const res = await fetch(`dados/${u.curso}.json`); if(res.ok){ semFimQuestoes = shuffleArray(await res.json()); } else semFimQuestoes = shuffleArray([...BANCO_DEFAULT]); } catch(e){ semFimQuestoes = shuffleArray([...BANCO_DEFAULT]); }
    semFimIndex=0; mostrarQuestaoSemFim();
}
function encerrarModoSemFim() { document.getElementById('area-normal-desafios').classList.remove('hidden'); document.getElementById('area-sem-fim').classList.add('hidden'); }
function mostrarQuestaoSemFim() {
    const c = document.getElementById('sem-fim-pergunta-container'); c.innerHTML=''; document.getElementById('btn-proxima-sem-fim').classList.add('hidden');
    if(semFimIndex >= semFimQuestoes.length) { semFimQuestoes = shuffleArray(semFimQuestoes); semFimIndex = 0; }
    const q = semFimQuestoes[semFimIndex], card = document.createElement('div'); card.className = 'pergunta-card'; card.innerHTML = `<h4>Treino Aleatório: ${q.enunciado}</h4>`;
    const ops = document.createElement('div'); ops.className = 'opcoes-lista';
    q.opcoes.forEach((txt, idx) => {
        const b = document.createElement('button'); b.className = 'opcao-btn'; b.innerText = txt;
        b.onclick = () => {
            let u = JSON.parse(localStorage.getItem('usuario_logado')); card.querySelectorAll('.opcao-btn').forEach((bx,i) => { bx.disabled=true; if(i===q.correta) bx.classList.add('correta'); else if(i===idx) bx.classList.add('incorreta'); });
            const cpop = document.createElement('div'); cpop.className = 'coin-pop';
            if(idx===q.correta){ u.civecoins=(u.civecoins||0)+5; u.acertosSemFim=(u.acertosSemFim||0)+1; cpop.innerHTML='+5 Civecoins!'; card.appendChild(cpop); }
            else { u.civecoins=(u.civecoins||0)+1; cpop.innerHTML='+1 Consolação'; cpop.classList.add('bad'); card.appendChild(cpop); }
            setTimeout(()=>cpop.remove(),2500); salvarUsuario(u); atualizarInterfaceUsuario(); renderizarRanking(); document.getElementById('btn-proxima-sem-fim').classList.remove('hidden');
        }; ops.appendChild(b);
    }); card.appendChild(ops); c.appendChild(card);
}
function mostrarProximaSemFim() { semFimIndex++; mostrarQuestaoSemFim(); }

// RANKING TRIPLO
function formatarNome(n) { if(!n) return "Aluno"; const p = n.trim().split(' '); if(p.length===1) return p[0]; return `${p[0]} ${p.slice(1).map(x=>x[0].toUpperCase()+'.').join(' ')}`; }
function mudarRankingEscopo(e) { rnkEscopo = e; document.querySelectorAll('#filter-scope button').forEach(b=>b.classList.remove('active')); event.target.classList.add('active'); renderizarRanking(); }
function mudarRankingCategoria(c) { rnkCat = c; document.querySelectorAll('#filter-cat button').forEach(b=>b.classList.remove('active')); event.target.classList.add('active'); renderizarRanking(); }

function renderizarRanking() {
    const box = document.getElementById('lista-ranking-alunos'), desc = document.getElementById('ranking-desc'), myBox = document.getElementById('meu-ranking-pos');
    if(!box) return; box.innerHTML = ''; myBox.innerHTML = '';
    let uL = JSON.parse(localStorage.getItem('usuario_logado')), users = JSON.parse(localStorage.getItem('usuarios_unicive')) || [];
    if (!users.find(u => u.email === uL.email)) users.push(uL);
    if (rnkEscopo === 'curso') users = users.filter(u => u.curso === uL.curso);
    let list = []; const hoje = obterDataHoje();

    if (rnkCat === 'diario') {
        desc.innerText = "Velocidade e Precisão! Veja quem acertou as questões de HOJE no menor tempo.";
        users.forEach(u => { const h = u.historicoDesafios?.[hoje]; if(h && h.finalizado && h.certas > 0) list.push({ u, val: h.certas, t: h.ms }); });
        list.sort((a,b) => b.val - a.val || a.t - b.t);
    } else if (rnkCat === 'semanal') {
        desc.innerText = "Consistência! Os alunos com mais acertos nos últimos 7 dias. O tempo total é o critério de desempate.";
        users.forEach(u => {
            let pts = 0, tm = 0;
            for(let i=0; i<7; i++){ const d = new Date(hoje+"T00:00:00"); d.setDate(d.getDate()-i); const df = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; const h = u.historicoDesafios?.[df]; if(h && h.finalizado) { pts+=h.certas; tm+=h.ms; } }
            if(pts > 0) list.push({ u, val: pts, t: tm });
        });
        list.sort((a,b) => b.val - a.val || a.t - b.t);
    } else {
        desc.innerText = "Fôlego inesgotável! Os maiores pontuadores do Treinamento.";
        users.forEach(u => { if(u.acertosSemFim > 0) list.push({ u, val: u.acertosSemFim, t: null }); });
        list.sort((a,b) => b.val - a.val);
    }

    if (list.length === 0) return box.innerHTML = '<p class="text-center text-muted" style="font-weight:600; padding:20px;">Nenhum jogador se qualificou nesta categoria.</p>';
    list.slice(0, 10).forEach((itm, idx) => { box.appendChild(buildRankRow(itm, idx+1)); });
    const myIdx = list.findIndex(x => x.u.email === uL.email);
    if(myIdx !== -1) { myBox.innerHTML = `<span style="display:block;margin-bottom:8px;font-size:12px;font-weight:800;color:var(--text-muted);">SUA POSIÇÃO</span>`; myBox.appendChild(buildRankRow(list[myIdx], myIdx+1)); }
}
function buildRankRow(itm, pos) {
    const d = document.createElement('div'); d.className = 'ranking-row';
    d.innerHTML = `<span class="rank-pos">${pos}º</span><span class="rank-name">${formatarNome(itm.u.nome)}</span><span class="rank-acertos">${itm.val} pts</span>${itm.t !== null ? `<span class="rank-tempo">⏱️ ${itm.t}s</span>` : ''}<div class="ranking-avatar-tooltip"><div class="ranking-avatar-mini"><img src="${itm.u.avatar.equipados.corpo}"><img src="${itm.u.avatar.equipados.sapato}"><img src="${itm.u.avatar.equipados.roupa}"><img src="${itm.u.avatar.equipados.chapeu}"></div><div class="ranking-curso-nome">${itm.u.curso.toUpperCase().replace('_',' ')}</div></div>`;
    return d;
}

// AVATAR E LOJA
function alterarGenero(g) { let u=JSON.parse(localStorage.getItem('usuario_logado')); u.avatar.genero=g; u.avatar.equipados.corpo=`img/corpo_${g}.png`; u.avatar.equipados.roupa=`img/roupa_padrao_${g==='homem'?'h':'m'}.png`; document.querySelectorAll('.btn-genero').forEach(b=>b.classList.remove('active')); document.getElementById(g==='homem'?'btn-gen-h':'btn-gen-m').classList.add('active'); u.avatar.equipados.chapeu=""; u.avatar.equipados.sapato=""; salvarUsuario(u); atualizarVisualizacaoAvatar(); carregarItensLoja(); renderizarRanking(); }
function atualizarVisualizacaoAvatar() { const u=JSON.parse(localStorage.getItem('usuario_logado')); if(!u||!u.avatar)return; ['corpo','roupa','chapeu','sapato'].forEach(p=>{const e=document.getElementById(`layer-${p}`), e2=document.getElementById(`home-layer-${p}`); if(e){e.src=u.avatar.equipados[p]; e.classList.toggle('hidden',!u.avatar.equipados[p]);} if(e2){e2.src=u.avatar.equipados[p]; e2.classList.toggle('hidden',!u.avatar.equipados[p]);}}); }
function trocarCategoriaLoja(cat, ev) { categoriaLojaAtual=cat; document.querySelectorAll('.loja-tab-btn').forEach(b=>b.classList.remove('active')); ev.target.classList.add('active'); carregarItensLoja(); }
function carregarItensLoja() { const c=document.getElementById('grid-itens-loja'); if(!c)return; c.innerHTML=''; const u=JSON.parse(localStorage.getItem('usuario_logado')); const it=CATALOGO_ITENS[u.avatar.genero]?.[categoriaLojaAtual]||[]; it.forEach(i=>{ const card=document.createElement('div'); card.className='item-card'; const jp=u.avatar.itensComprados.includes(i.id), eq=u.avatar.equipados[categoriaLojaAtual]===i.img; card.innerHTML=`<div class="item-img-preview"><img src="${i.img}"></div><h4>${i.nome}</h4>${eq?`<button class="btn-equipado">✓ Equipado</button>`:jp?`<button class="btn-equipar" onclick="equiparItem('${categoriaLojaAtual}','${i.img}')">Equipar</button>`:`<button class="btn-comprar" onclick="comprarItem('${i.id}',${i.preco},'${categoriaLojaAtual}','${i.img}')">Comprar (${i.preco} 🪙)</button>`}`; c.appendChild(card); }); }
function comprarItem(id, p, cat, img) { let u=JSON.parse(localStorage.getItem('usuario_logado')); if((u.civecoins||0)<p)return alert("❌ Saldo insuficiente!"); u.civecoins-=p; u.avatar.itensComprados.push(id); u.avatar.equipados[cat]=img; salvarUsuario(u); atualizarInterfaceUsuario(); atualizarVisualizacaoAvatar(); carregarItensLoja(); renderizarRanking(); }
function equiparItem(cat, img) { let u=JSON.parse(localStorage.getItem('usuario_logado')); u.avatar.equipados[cat]=img; salvarUsuario(u); atualizarVisualizacaoAvatar(); carregarItensLoja(); renderizarRanking(); }
function renderizarMapaTrilha(pts) { const m=document.getElementById('trilha-mapa-conteudo'); if(!m)return; m.innerHTML=''; const r1=document.createElement('div'); r1.className='trilha-row'; const r2=document.createElement('div'); r2.className='trilha-row row-reverse'; TRILHA_PREMIOS.forEach((p,i)=>{ const u=pts>=p.pontos; const n=document.createElement('div'); n.className=`trilha-node ${u?'unlocked':''} ${p.pontos===400?'special-node':''}`; n.innerHTML=`<span class="node-icon">${p.pontos===400&&u?'🏆':u?'🔓':'🔒'}</span><span class="node-pontos">${p.pontos}</span><div class="trilha-tooltip"><span class="tooltip-titulo">${p.titulo}</span><span class="tooltip-subtitulo">${p.pontos===400?(u?p.descUnlocked:p.descLocked):p.desc}</span></div>`; (i<4?r1:r2).appendChild(n); }); m.append(r1, Object.assign(document.createElement('div'),{className:'linha-vertical-conector'}), r2); }

function salvarUsuario(u) { localStorage.setItem('usuario_logado', JSON.stringify(u)); let us = JSON.parse(localStorage.getItem('usuarios_unicive')) || []; const i = us.findIndex(x => x.email === u.email); if (i !== -1) { us[i] = u; localStorage.setItem('usuarios_unicive', JSON.stringify(us)); } }
function trocarAba(aba, ev) { document.querySelectorAll('.tab-content').forEach(a => a.classList.remove('active')); document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); document.getElementById(`aba-${aba}`).classList.add('active'); if (ev) ev.target.classList.add('active'); }
function trocarAbaDirect(aba) { trocarAba(aba, null); const b=document.querySelectorAll('.tab-btn'); if(aba==='personagem'&&b[2]) b[2].classList.add('active'); }

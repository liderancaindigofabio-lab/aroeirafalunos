// ============================================
// AROEIRA G FITNESS - SITE DOS ALUNOS
// v2 - designer profissional + persistência
// ============================================

let dados = null;
let alunoLogado = null;
let respostasFiltro = {};
let editAvaliacaoId = null;
let editChamadoId = null;

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    if (window.location.pathname.includes('dashboard')) {
        verificarLogin();
    }
});

// === CARREGAR DADOS (servidor + localStorage) ===
async function carregarDados() {
    try {
        const resp = await fetch('dados.json');
        dados = await resp.json();
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
        dados = { alunos: [], academia: {}, exercicios: {} };
    }
    // Sobrescreve com dados do localStorage (se houver alterações)
    const local = localStorage.getItem('aroeira_alunos_dados');
    if (local) {
        try {
            const localData = JSON.parse(local);
            dados.alunos = localData;
        } catch (e) { console.error('Erro ao parsear localStorage:', e); }
    }
}

// === SALVAR NO LOCALSTORAGE (persistência real) ===
function salvarLocal() {
    if (!alunoLogado) return;
    const idx = dados.alunos.findIndex(a => a.id === alunoLogado.id);
    if (idx >= 0) {
        dados.alunos[idx] = JSON.parse(JSON.stringify(alunoLogado));
        localStorage.setItem('aroeira_alunos_dados', JSON.stringify(dados.alunos));
    }
}

// === MODAIS ===
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// === TOAST ===
function toast(msg, erro = false) {
    const t = document.createElement('div');
    t.className = 'toast' + (erro ? ' error' : '');
    t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

// ============================================
// LOGIN / LOGOUT
// ============================================
function fazerLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const senha = document.getElementById('loginSenha').value;

    const aluno = dados.alunos.find(a => a.email.toLowerCase() === email && a.senha === senha);
    if (!aluno) {
        toast('❌ E-mail ou senha inválidos', true);
        return false;
    }

    localStorage.setItem('aroeira_aluno_id', aluno.id);
    window.location.href = 'dashboard.html';
    return false;
}

function recuperarSenha(e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
    const aluno = dados.alunos.find(a => a.email.toLowerCase() === email);

    if (!aluno) {
        toast('❌ E-mail não encontrado no sistema', true);
        return false;
    }

    toast(`✅ Link de recuperação enviado para ${email}. Verifique sua caixa de entrada!`);
    closeModal('forgotModal');
    openModal('loginModal');
    return false;
}

function verificarLogin() {
    const id = localStorage.getItem('aroeira_aluno_id');
    if (!id) {
        window.location.href = 'index.html';
        return;
    }
    alunoLogado = dados.alunos.find(a => a.id == id);
    if (!alunoLogado) {
        localStorage.removeItem('aroeira_aluno_id');
        window.location.href = 'index.html';
        return;
    }
    // Garante que arrays existem
    if (!alunoLogado.evaluations) alunoLogado.evaluations = [];
    if (!alunoLogado.chamados) alunoLogado.chamados = [];
    if (!alunoLogado.treinos) alunoLogado.treinos = [];

    carregarPerfil();
    carregarAvaliacoes();
    carregarChamados();
    carregarTreinos();
}

function logout() {
    if (confirm('Sair da sua conta?')) {
        localStorage.removeItem('aroeira_aluno_id');
        window.location.href = 'index.html';
    }
}

// ============================================
// TABS
// ============================================
function abrirTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

// ============================================
// PERFIL
// ============================================
function carregarPerfil() {
    if (!alunoLogado) return;

    const inicial = alunoLogado.nome.charAt(0).toUpperCase();
    const av = document.getElementById('headerAvatar');
    const pav = document.getElementById('perfilAvatar');
    if (alunoLogado.foto) {
        av.innerHTML = `<img src="${alunoLogado.foto}">`;
        pav.innerHTML = `<img src="${alunoLogado.foto}">`;
    } else {
        av.textContent = inicial;
        pav.textContent = inicial;
    }

    document.getElementById('perfilNome').textContent = alunoLogado.nome;
    document.getElementById('perfilEmail').textContent = alunoLogado.email;
    document.getElementById('statPlano').textContent = alunoLogado.plano || '-';
    document.getElementById('statValor').textContent = alunoLogado.valor || '-';
    document.getElementById('statVencimento').textContent = alunoLogado.vencimento ? formatarData(alunoLogado.vencimento) : '-';
    document.getElementById('statStatus').innerHTML = `<span class="badge ${classeStatus(alunoLogado.status)}">${alunoLogado.status || '-'}</span>`;
    document.getElementById('perfilMatricula').textContent = alunoLogado.dataMatricula ? formatarData(alunoLogado.dataMatricula) : '-';
    document.getElementById('perfilObjetivo').textContent = alunoLogado.objetivo || '-';
    document.getElementById('perfilTelefone').textContent = alunoLogado.telefone || '-';
}

function classeStatus(st) {
    const map = { 'Em Dia': 'badge-green', 'Pendente': 'badge-yellow', 'Vencido': 'badge-red', 'Atrasado': 'badge-darkred' };
    return map[st] || 'badge-gold';
}

function formatarData(iso) {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function trocarFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) { // LIMITE 1MB
        toast('❌ Foto muito grande! Máximo 1MB', true);
        e.target.value = '';
        return;
    }
    if (!file.type.startsWith('image/')) {
        toast('❌ Selecione um arquivo de imagem', true);
        return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
        alunoLogado.foto = ev.target.result;
        salvarLocal();
        carregarPerfil();
        toast('✅ Foto atualizada!');
    };
    reader.readAsDataURL(file);
}

function trocarSenha(e) {
    e.preventDefault();
    const atual = document.getElementById('senhaAtual').value;
    const nova = document.getElementById('senhaNova').value;
    const confirma = document.getElementById('senhaConfirma').value;

    if (atual !== alunoLogado.senha) {
        toast('❌ Senha atual incorreta', true);
        return false;
    }
    if (nova !== confirma) {
        toast('❌ As senhas novas não conferem', true);
        return false;
    }

    alunoLogado.senha = nova;
    salvarLocal();
    toast('✅ Senha alterada com sucesso!');
    e.target.reset();
    return false;
}

// ============================================
// CHAMADOS (com persistência + editar/excluir)
// ============================================
function carregarChamados() {
    if (!alunoLogado.chamados) alunoLogado.chamados = [];
    const div = document.getElementById('listaChamados');
    if (alunoLogado.chamados.length === 0) {
        div.innerHTML = '<p class="text-muted text-center" style="padding:20px;">Nenhum chamado aberto ainda.</p>';
        return;
    }
    div.innerHTML = alunoLogado.chamados.map(c => `
        <div class="chamado-item">
            <div class="assunto">
                <span>📌 ${escapeHtml(c.assunto)}</span>
                <div class="avaliacao-actions">
                    <span class="badge ${c.status === 'Resolvido' ? 'badge-green' : 'badge-yellow'}">${c.status}</span>
                    <button class="btn btn-danger btn-sm" onclick="excluirChamado(${c.id})" title="Excluir">🗑️</button>
                </div>
            </div>
            <div class="data">Aberto em ${formatarData(c.data)}</div>
            <div class="chat-container" style="height:200px;">
                <div class="chat-messages">
                    <div class="msg msg-me">${escapeHtml(c.mensagem)}<div class="msg-time">${formatarData(c.data)}</div></div>
                    ${(c.respostas || []).map(r => `
                        <div class="msg msg-them">${escapeHtml(r.texto)}<div class="msg-time">${formatarData(r.data)} • Gestão</div></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function abrirChamado(e) {
    e.preventDefault();
    const assunto = document.getElementById('chamadoAssunto').value.trim();
    const mensagem = document.getElementById('chamadoMensagem').value.trim();
    if (!assunto || !mensagem) return false;

    alunoLogado.chamados.unshift({
        id: Date.now(),
        assunto,
        mensagem,
        data: new Date().toISOString().split('T')[0],
        status: 'Aberto',
        respostas: []
    });
    salvarLocal();
    carregarChamados();
    toast('✅ Chamado aberto! A gestão recebeu por e-mail.');
    e.target.reset();
    return false;
}

function excluirChamado(id) {
    if (!confirm('Excluir este chamado?')) return;
    alunoLogado.chamados = alunoLogado.chamados.filter(c => c.id !== id);
    salvarLocal();
    carregarChamados();
    toast('🗑️ Chamado excluído');
}

// ============================================
// AVALIAÇÃO FÍSICA (mesmos campos da gestão + editar/excluir)
// ============================================
function carregarAvaliacoes() {
    if (!alunoLogado.evaluations) alunoLogado.evaluations = [];
    const div = document.getElementById('listaAvaliacoes');
    if (alunoLogado.evaluations.length === 0) {
        div.innerHTML = '<p class="text-muted text-center" style="padding:20px;">Nenhuma avaliação cadastrada.</p>';
        return;
    }
    // Mais recente primeiro
    const avs = [...alunoLogado.evaluations].sort((a, b) => b.date.localeCompare(a.date));
    div.innerHTML = avs.map(a => `
        <div class="avaliacao-item">
            <div class="data">
                <span>📅 ${formatarData(a.date)}</span>
                <div class="avaliacao-actions">
                    <button class="btn btn-outline btn-sm" onclick="editarAvaliacao(${a.id})">✏️ Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirAvaliacao(${a.id})">🗑️</button>
                </div>
            </div>
            <div class="eval-display-grid">
                <div class="eval-data-item"><b>Peso</b><span>${a.peso}kg</span></div>
                ${a.imc ? `<div class="eval-data-item"><b>IMC</b><span>${a.imc}</span></div>` : ''}
                ${a.gordura ? `<div class="eval-data-item"><b>% Gordura</b><span>${a.gordura}%</span></div>` : ''}
                ${a.massa ? `<div class="eval-data-item"><b>Massa Magra</b><span>${a.massa}</span></div>` : ''}
                ${a.busto ? `<div class="eval-data-item"><b>Busto</b><span>${a.busto}cm</span></div>` : ''}
                ${a.cintura ? `<div class="eval-data-item"><b>Cintura</b><span>${a.cintura}cm</span></div>` : ''}
                ${a.barriga ? `<div class="eval-data-item"><b>Barriga</b><span>${a.barriga}cm</span></div>` : ''}
                ${a.quadril ? `<div class="eval-data-item"><b>Quadril</b><span>${a.quadril}cm</span></div>` : ''}
                ${a.perna ? `<div class="eval-data-item"><b>Perna</b><span>${a.perna}cm</span></div>` : ''}
                ${a.braco ? `<div class="eval-data-item"><b>Braço</b><span>${a.braco}cm</span></div>` : ''}
                ${a.visceral ? `<div class="eval-data-item"><b>Visceral</b><span>${a.visceral}</span></div>` : ''}
                ${a.basal ? `<div class="eval-data-item"><b>Metab. Basal</b><span>${a.basal}</span></div>` : ''}
                ${a.idade ? `<div class="eval-data-item"><b>Idade Metab.</b><span>${a.idade}</span></div>` : ''}
            </div>
        </div>
    `).join('');
}

function salvarAvaliacao(e) {
    e.preventDefault();
    const data = {
        date: document.getElementById('av_date').value,
        peso: parseFloat(document.getElementById('av_peso').value) || null,
        imc: parseFloat(document.getElementById('av_imc').value) || null,
        busto: parseFloat(document.getElementById('av_busto').value) || null,
        cintura: parseFloat(document.getElementById('av_cintura').value) || null,
        barriga: parseFloat(document.getElementById('av_barriga').value) || null,
        quadril: parseFloat(document.getElementById('av_quadril').value) || null,
        perna: parseFloat(document.getElementById('av_perna').value) || null,
        braco: parseFloat(document.getElementById('av_braco').value) || null,
        gordura: parseFloat(document.getElementById('av_gordura').value) || null,
        massa: parseFloat(document.getElementById('av_massa').value) || null,
        visceral: parseFloat(document.getElementById('av_visceral').value) || null,
        basal: parseFloat(document.getElementById('av_basal').value) || null,
        idade: parseFloat(document.getElementById('av_idade').value) || null
    };

    if (editAvaliacaoId) {
        // EDITAR
        const idx = alunoLogado.evaluations.findIndex(a => a.id === editAvaliacaoId);
        if (idx >= 0) {
            alunoLogado.evaluations[idx] = { ...alunoLogado.evaluations[idx], ...data };
            toast('✅ Avaliação atualizada!');
        }
        editAvaliacaoId = null;
        document.getElementById('avFormTitulo').textContent = 'Adicionar avaliação';
        document.getElementById('avSubmitBtn').textContent = '💾 Salvar avaliação';
        document.getElementById('avCancelarBtn').classList.add('hidden');
    } else {
        // ADICIONAR NOVA
        data.id = Date.now();
        alunoLogado.evaluations.push(data);
        toast('✅ Avaliação salva! A gestão recebeu a atualização.');
    }

    salvarLocal();
    carregarAvaliacoes();
    e.target.reset();
    return false;
}

function editarAvaliacao(id) {
    const a = alunoLogado.evaluations.find(x => x.id === id);
    if (!a) return;

    document.getElementById('av_date').value = a.date || '';
    document.getElementById('av_peso').value = a.peso || '';
    document.getElementById('av_busto').value = a.busto || '';
    document.getElementById('av_cintura').value = a.cintura || '';
    document.getElementById('av_barriga').value = a.barriga || '';
    document.getElementById('av_quadril').value = a.quadril || '';
    document.getElementById('av_perna').value = a.perna || '';
    document.getElementById('av_braco').value = a.braco || '';
    document.getElementById('av_imc').value = a.imc || '';
    document.getElementById('av_gordura').value = a.gordura || '';
    document.getElementById('av_massa').value = a.massa || '';
    document.getElementById('av_visceral').value = a.visceral || '';
    document.getElementById('av_basal').value = a.basal || '';
    document.getElementById('av_idade').value = a.idade || '';

    editAvaliacaoId = id;
    document.getElementById('avFormTitulo').textContent = 'Editar avaliação';
    document.getElementById('avSubmitBtn').textContent = '💾 Atualizar avaliação';
    document.getElementById('avCancelarBtn').classList.remove('hidden');
    document.getElementById('av_date').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelarEdicaoAvaliacao() {
    editAvaliacaoId = null;
    document.getElementById('avFormTitulo').textContent = 'Adicionar avaliação';
    document.getElementById('avSubmitBtn').textContent = '💾 Salvar avaliação';
    document.getElementById('avCancelarBtn').classList.add('hidden');
    document.querySelector('#avaliacao form').reset();
}

function excluirAvaliacao(id) {
    if (!confirm('Excluir esta avaliação?')) return;
    alunoLogado.evaluations = alunoLogado.evaluations.filter(a => a.id !== id);
    salvarLocal();
    carregarAvaliacoes();
    toast('🗑️ Avaliação excluída');
}

// ============================================
// GERADOR DE TREINO (um dia por vez)
// ============================================
function selecionarOpcao(el, campo, valor) {
    el.parentElement.querySelectorAll('.opcao').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    respostasFiltro[campo] = valor;
}

function gerarTreino() {
    const f = respostasFiltro;
    if (!f.experiencia || !f.objetivo || !f.frequencia || !f.grupo || !f.genero) {
        toast('❌ Responda todas as perguntas!', true);
        return;
    }
    f.dataGeracao = new Date().toISOString().split('T')[0];

    const treino = montarTreino(f);

    alunoLogado.treinos.unshift({
        id: Date.now(),
        filtros: JSON.parse(JSON.stringify(f)),
        exercicios: treino
    });
    salvarLocal();

    document.getElementById('filtrosTreino').classList.add('hidden');
    document.getElementById('resultadoTreino').classList.remove('hidden');
    renderizarTreino(treino, f);
    carregarTreinos();
    toast('🔥 Treino de hoje gerado!');
}

function montarTreino(f) {
    const ex = dados.exercicios || {};
    const grupo = f.grupo;
    let exercicios = [...(ex[grupo] || [])];

    // Ajustes por experiência
    const isIniciante = f.experiencia === 'iniciante';
    if (isIniciante) {
        exercicios = exercicios.slice(0, 4); // menos exercícios
        exercicios.forEach(e => {
            if (e.series.includes('x')) {
                const [qtd, reps] = e.series.split('x');
                e.series = `3x${reps}`;
            }
        });
    }

    // Ajustes por objetivo
    if (f.objetivo === 'emagrecimento' || f.objetivo === 'resistencia') {
        if (ex.cardio) {
            exercicios.push({ nome: 'Cardio (final do treino)', aparelho: 'Esteira ou Bicicleta', series: '15-20 min', descanso: '-', grupo: 'cardio' });
        }
    }

    return exercicios;
}

function renderizarTreino(exercicios, f) {
    const grupoNomes = {
        peito: 'Peito', costas: 'Costas', pernas: 'Pernas', gluteos: 'Glúteos',
        ombros: 'Ombros', bracos: 'Braços', core: 'Core/Abdômen', cardio: 'Cardio'
    };
    const objetivoTxt = {
        hipertrofia: '💪 Ganho de massa', emagrecimento: '🔥 Emagrecimento',
        resistencia: '⚡ Resistência', forca: '💪 Força'
    };
    const expTxt = {
        iniciante: '🆕 Iniciante', intermediario: '🔄 Intermediário', avancado: '💪 Avançado'
    };

    let html = `
        <div class="card">
            <div class="card-header"><h3>🎯 Treino de ${grupoNomes[f.grupo]}</h3></div>
            <div class="info-row"><strong>Experiência:</strong> <span>${expTxt[f.experiencia]}</span></div>
            <div class="info-row"><strong>Objetivo:</strong> <span>${objetivoTxt[f.objetivo]}</span></div>
            <div class="info-row"><strong>Frequência:</strong> <span>${f.frequencia}x por semana</span></div>
            <div class="info-row"><strong>Gerado em:</strong> <span>${formatarData(f.dataGeracao)}</span></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🏋️ Exercícios do dia</h3></div>
            ${exercicios.map((e, i) => `
                <div class="exercicio-card">
                    <div class="nome">${i + 1}. ${e.nome}</div>
                    <div class="detalhes">
                        <span>🔁 ${e.series}</span>
                        <span>⏱️ ${e.descanso}</span>
                        <span>🏋️ ${e.aparelho}</span>
                    </div>
                    <div class="grupo-musculer">💪 ${grupoNomes[e.grupo] || e.grupo}</div>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-outline btn-block" onclick="novoTreino()">🔄 Gerar treino de outro dia</button>
    `;

    document.getElementById('resultadoTreino').innerHTML = html;
}

function novoTreino() {
    respostasFiltro = {};
    document.querySelectorAll('.opcao.selected').forEach(o => o.classList.remove('selected'));
    document.getElementById('resultadoTreino').classList.add('hidden');
    document.getElementById('filtrosTreino').classList.remove('hidden');
    document.getElementById('filtrosTreino').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function carregarTreinos() {
    if (!alunoLogado.treinos) alunoLogado.treinos = [];
    const div = document.getElementById('listaTreinos');
    if (alunoLogado.treinos.length === 0) {
        div.innerHTML = '<p class="text-muted text-center" style="padding:20px;">Nenhum treino gerado ainda.</p>';
        return;
    }
    const grupoNomes = {
        peito: 'Peito', costas: 'Costas', pernas: 'Pernas', gluteos: 'Glúteos',
        ombros: 'Ombros', bracos: 'Braços', core: 'Core', cardio: 'Cardio'
    };
    div.innerHTML = alunoLogado.treinos.map(t => `
        <div class="avaliacao-item">
            <div class="data">
                <span>🏋️ ${grupoNomes[t.filtros.grupo] || t.filtros.grupo} — ${formatarData(t.filtros.dataGeracao)}</span>
                <div class="avaliacao-actions">
                    <button class="btn btn-outline btn-sm" onclick="verTreino(${t.id})">👁️ Ver</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirTreino(${t.id})">🗑️</button>
                </div>
            </div>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:6px;">
                ${t.exercicios.length} exercícios • ${t.filtros.objetivo} • ${t.filtros.experiencia}
            </div>
        </div>
    `).join('');
}

function verTreino(id) {
    const t = alunoLogado.treinos.find(x => x.id === id);
    if (!t) return;
    document.getElementById('filtrosTreino').classList.add('hidden');
    document.getElementById('resultadoTreino').classList.remove('hidden');
    renderizarTreino(t.exercicios, t.filtros);
    document.getElementById('resultadoTreino').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function excluirTreino(id) {
    if (!confirm('Excluir este treino do histórico?')) return;
    alunoLogado.treinos = alunoLogado.treinos.filter(t => t.id !== id);
    salvarLocal();
    carregarTreinos();
    toast('🗑️ Treino excluído');
}

// ============================================
// CONTATO (página inicial)
// ============================================
function enviarContato(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    console.log('Contato:', Object.fromEntries(fd));
    toast('✅ Mensagem enviada! Responderemos em breve.');
    e.target.reset();
    return false;
}

// === UTILITÁRIOS ===
function escapeHtml(t) {
    if (!t) return '';
    return String(t)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

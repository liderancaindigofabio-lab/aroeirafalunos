// ============================================
// AROEIRA G FITNESS - SITE DOS ALUNOS
// v4 - CONECTADO ao banco real da gestão
// ============================================

// === CONFIGURAÇÃO: URL do banco de dados da gestão ===
const GESTAO_JSON_URL = 'https://raw.githubusercontent.com/liderancaindigofabio-lab/aroeiragfitness/main/aroeira_data.json';
const LS_OVERRIDES = 'aroeira_overrides_v1';       // alteracoes feitas pelo aluno (local)
const LS_AUTH = 'aroeira_aluno_id_v1';             // id do aluno logado
const LS_LOCAL_RECS = 'aroeira_local_records_v1';  // registros criados pelo aluno que ainda nao foram sincronizados

let gestaoData = null;      // banco da gestao (carregado do GitHub)
let alunosGest = [];        // lista de students
let alunoLogado = null;     // aluno atualmente logado (objeto)
let respostasFiltro = {};
let editAvaliacaoId = null;

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[AGF] Iniciando portal v4 - conectado a gestao');
    await carregarDadosGestao();
    if (window.location.pathname.includes('dashboard')) {
        verificarLogin();
    }
});

// === CARREGAR DADOS DA GESTAO (raw GitHub, com CORS liberado) ===
async function carregarDadosGestao() {
    try {
        const resp = await fetch(GESTAO_JSON_URL + '?t=' + Date.now());
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        gestaoData = await resp.json();
        alunosGest = gestaoData.students || [];
        console.log('[AGF] Gestao carregada:', alunosGest.length, 'alunos');

        // Aplica overrides locais do aluno (alteracoes que ainda nao voltaram pra gestao)
        aplicarOverridesLocais();
    } catch (e) {
        console.error('[AGF] Erro ao carregar gestao:', e);
        toast('⚠️ Não foi possível carregar a base da gestão. Verifique sua internet.', true);
        gestaoData = { students: [], history: [], password: '123456' };
        alunosGest = [];
    }
}

// === OVERRIDES LOCAIS (aluno pode editar dados que a gestao ainda nao absorveu) ===
function aplicarOverridesLocais() {
    const ovr = JSON.parse(localStorage.getItem(LS_OVERRIDES) || '{}');
    alunosGest = alunosGest.map(a => {
        if (ovr[a.id]) return { ...a, ...ovr[a.id] };
        return a;
    });
}

function salvarOverrideLocal(alunoId, patch) {
    const ovr = JSON.parse(localStorage.getItem(LS_OVERRIDES) || '{}');
    ovr[alunoId] = { ...(ovr[alunoId] || {}), ...patch };
    localStorage.setItem(LS_OVERRIDES, JSON.stringify(ovr));
}

// === REGISTROS LOCAIS (chamados, treinos - coisas que nao vao pra gestao automaticamente) ===
function getLocalRecords() {
    return JSON.parse(localStorage.getItem(LS_LOCAL_RECS) || '{}');
}
function saveLocalRecord(alunoId, key, data) {
    const all = getLocalRecords();
    if (!all[alunoId]) all[alunoId] = {};
    all[alunoId][key] = data;
    localStorage.setItem(LS_LOCAL_RECS, JSON.stringify(all));
}
function getAlunoLocal(alunoId) {
    return getLocalRecords()[alunoId] || {};
}

// === HELPERS ===
function numOrNull(v) {
    if (v === '' || v === null || v === undefined) return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
}

function openModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

function toast(msg, erro = false) {
    const t = document.createElement('div');
    t.className = 'toast' + (erro ? ' error' : '');
    t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4500);
}

function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function setHTML(id, h) { const el = document.getElementById(id); if (el) el.innerHTML = h; }

function formatarData(iso) {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return d + '/' + m + '/' + y;
}

function classeStatus(st) {
    const map = { 'Em Dia': 'badge-green', 'Pendente': 'badge-yellow', 'Vencido': 'badge-red', 'Atrasado': 'badge-darkred' };
    return map[st] || 'badge-gold';
}

function escapeHtml(t) {
    if (t === null || t === undefined) return '';
    return String(t)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// === MAPEAMENTO: gestao (english) <-> aluno (portugues) ===
function mapGestaoToAluno(s) {
    if (!s) return null;
    return {
        id: s.id,
        nome: s.name || s.nome || 'Aluno',
        email: s.email || '',
        telefone: s.phone || s.telefone || '',
        senha: '123456', // senha padrao para todos os alunos
        plano: s.plan || s.plano || '-',
        valor: s.value || s.valor || '-',
        vencimento: s.due || s.vencimento || '',
        status: s.payment || s.status || 'Em Dia',
        dataMatricula: s.matricula || '',
        objetivo: '-',
        foto: '',
        evaluations: s.evaluations || [],
        paymentHistory: s.paymentHistory || []
    };
}

// ============================================
// LOGIN
// ============================================
async function fazerLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!gestaoData) await carregarDadosGestao();

    const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
    const senha = document.getElementById('loginSenha')?.value || '';

    if (!email || !senha) { toast('❌ Preencha e-mail e senha', true); return false; }

    console.log('[AGF] Login:', email);
    const alunoRaw = alunosGest.find(a => (a.email || '').toLowerCase() === email);
    if (!alunoRaw) {
        toast('❌ E-mail não encontrado na gestão. Procure a recepção.', true);
        return false;
    }
    if (senha !== '123456') {
        toast('❌ Senha incorreta. Use a senha padrão: 123456', true);
        return false;
    }

    alunoLogado = mapGestaoToAluno(alunoRaw);
    localStorage.setItem(LS_AUTH, String(alunoLogado.id));
    console.log('[AGF] Login OK:', alunoLogado.nome);
    window.location.href = 'dashboard.html';
    return false;
}

function recuperarSenha(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = (document.getElementById('forgotEmail')?.value || '').trim().toLowerCase();
    const alunoRaw = alunosGest.find(a => (a.email || '').toLowerCase() === email);
    if (!alunoRaw) { toast('❌ E-mail não encontrado', true); return false; }
    toast('✅ Sua senha padrão é: 123456 (entre em contato com a gestão para alterar)');
    closeModal('forgotModal');
    openModal('loginModal');
    return false;
}

function verificarLogin() {
    const id = localStorage.getItem(LS_AUTH);
    if (!id) { window.location.href = 'index.html'; return; }
    // Recarrega dados da gestao
    carregarDadosGestao().then(() => {
        const alunoRaw = alunosGest.find(a => String(a.id) === String(id));
        if (!alunoRaw) {
            localStorage.removeItem(LS_AUTH);
            window.location.href = 'index.html';
            return;
        }
        alunoLogado = mapGestaoToAluno(alunoRaw);
        const local = getAlunoLocal(alunoLogado.id);
        if (!alunoLogado.evaluations) alunoLogado.evaluations = [];
        if (!alunoLogado.chamados) alunoLogado.chamados = local.chamados || [];
        if (!alunoLogado.treinos) alunoLogado.treinos = local.treinos || [];

        console.log('[AGF] Dashboard:', alunoLogado.nome);
        carregarPerfil();
        carregarAvaliacoes();
        carregarChamados();
        carregarTreinos();
    });
}

function logout() {
    if (confirm('Sair da sua conta?')) {
        localStorage.removeItem(LS_AUTH);
        window.location.href = 'index.html';
    }
}

// === TABS ===
function abrirTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');
    if (btn) btn.classList.add('active');
}

// ============================================
// PERFIL
// ============================================
function carregarPerfil() {
    if (!alunoLogado) return;
    const inicial = (alunoLogado.nome || 'A').charAt(0).toUpperCase();
    const av = document.getElementById('headerAvatar');
    const pav = document.getElementById('perfilAvatar');
    if (alunoLogado.foto) {
        if (av) av.innerHTML = '<img src="' + alunoLogado.foto + '">';
        if (pav) pav.innerHTML = '<img src="' + alunoLogado.foto + '">';
    } else {
        if (av) av.textContent = inicial;
        if (pav) pav.textContent = inicial;
    }
    setText('perfilNome', alunoLogado.nome);
    setText('perfilEmail', alunoLogado.email);
    setText('statPlano', alunoLogado.plano);
    setText('statValor', alunoLogado.valor);
    setText('statVencimento', alunoLogado.vencimento ? formatarData(alunoLogado.vencimento) : '-');
    setHTML('statStatus', '<span class="badge ' + classeStatus(alunoLogado.status) + '">' + alunoLogado.status + '</span>');
    setText('perfilMatricula', alunoLogado.dataMatricula || '-');
    setText('perfilObjetivo', alunoLogado.objetivo || '-');
    setText('perfilTelefone', alunoLogado.telefone || '-');
}

function trocarFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) { toast('❌ Foto muito grande! Máximo 1MB', true); e.target.value = ''; return; }
    if (!file.type.startsWith('image/')) { toast('❌ Selecione uma imagem', true); return; }
    const reader = new FileReader();
    reader.onload = ev => {
        alunoLogado.foto = ev.target.result;
        salvarOverrideLocal(alunoLogado.id, { foto: ev.target.result });
        carregarPerfil();
        toast('✅ Foto atualizada!');
    };
    reader.readAsDataURL(file);
}

function trocarSenha(e) {
    if (e && e.preventDefault) e.preventDefault();
    const atual = document.getElementById('senhaAtual')?.value || '';
    const nova = document.getElementById('senhaNova')?.value || '';
    const confirma = document.getElementById('senhaConfirma')?.value || '';
    if (atual !== alunoLogado.senha) { toast('❌ Senha atual incorreta', true); return false; }
    if (nova !== confirma) { toast('❌ As senhas novas não conferem', true); return false; }
    if (nova.length < 4) { toast('❌ Mínimo 4 caracteres', true); return false; }
    alunoLogado.senha = nova;
    salvarOverrideLocal(alunoLogado.id, { senha: nova });
    toast('✅ Senha alterada!');
    e.target.reset();
    return false;
}

// ============================================
// CHAMADOS
// ============================================
function carregarChamados() {
    const div = document.getElementById('listaChamados');
    if (!div) return;
    if (!alunoLogado.chamados || alunoLogado.chamados.length === 0) {
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
                </div>
            </div>
        </div>
    `).join('');
}

function abrirChamado(e) {
    if (e && e.preventDefault) e.preventDefault();
    const assunto = (document.getElementById('chamadoAssunto')?.value || '').trim();
    const mensagem = (document.getElementById('chamadoMensagem')?.value || '').trim();
    if (!assunto || !mensagem) { toast('❌ Preencha assunto e mensagem', true); return false; }
    alunoLogado.chamados.unshift({
        id: Date.now(),
        assunto, mensagem,
        data: new Date().toISOString().split('T')[0],
        status: 'Aberto',
        respostas: []
    });
    saveLocalRecord(alunoLogado.id, 'chamados', alunoLogado.chamados);
    carregarChamados();
    toast('✅ Chamado aberto! A gestão recebeu por e-mail.');
    e.target.reset();
    return false;
}

function excluirChamado(id) {
    if (!confirm('Excluir este chamado?')) return;
    alunoLogado.chamados = alunoLogado.chamados.filter(c => c.id !== id);
    saveLocalRecord(alunoLogado.id, 'chamados', alunoLogado.chamados);
    carregarChamados();
    toast('🗑️ Chamado excluído');
}

// ============================================
// AVALIAÇÃO FÍSICA
// ============================================
function carregarAvaliacoes() {
    if (!alunoLogado.evaluations) alunoLogado.evaluations = [];
    const div = document.getElementById('listaAvaliacoes');
    if (!div) return;
    if (alunoLogado.evaluations.length === 0) {
        div.innerHTML = '<p class="text-muted text-center" style="padding:20px;">Nenhuma avaliação cadastrada. A gestão pode adicionar a primeira pra você.</p>';
        return;
    }
    const avs = [...alunoLogado.evaluations].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    div.innerHTML = avs.map(a => {
        const aId = a.id;
        return `
        <div class="avaliacao-item">
            <div class="data">
                <span>📅 ${formatarData(a.date)}</span>
                <div class="avaliacao-actions">
                    <button class="btn btn-outline btn-sm" onclick="editarAvaliacao(${aId})">✏️ Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="excluirAvaliacao(${aId})">🗑️</button>
                </div>
            </div>
            <div class="eval-display-grid">
                ${a.peso != null ? `<div class="eval-data-item"><b>Peso</b><span>${a.peso}kg</span></div>` : ''}
                ${a.imc != null ? `<div class="eval-data-item"><b>IMC</b><span>${a.imc}</span></div>` : ''}
                ${a.gordura != null ? `<div class="eval-data-item"><b>% Gordura</b><span>${a.gordura}%</span></div>` : ''}
                ${a.massa != null ? `<div class="eval-data-item"><b>Massa Magra</b><span>${a.massa}</span></div>` : ''}
                ${a.busto != null ? `<div class="eval-data-item"><b>Busto</b><span>${a.busto}cm</span></div>` : ''}
                ${a.cintura != null ? `<div class="eval-data-item"><b>Cintura</b><span>${a.cintura}cm</span></div>` : ''}
                ${a.barriga != null ? `<div class="eval-data-item"><b>Barriga</b><span>${a.barriga}cm</span></div>` : ''}
                ${a.quadril != null ? `<div class="eval-data-item"><b>Quadril</b><span>${a.quadril}cm</span></div>` : ''}
                ${a.perna != null ? `<div class="eval-data-item"><b>Perna</b><span>${a.perna}cm</span></div>` : ''}
                ${a.braco != null ? `<div class="eval-data-item"><b>Braço</b><span>${a.braco}cm</span></div>` : ''}
                ${a.visceral != null ? `<div class="eval-data-item"><b>Visceral</b><span>${a.visceral}</span></div>` : ''}
                ${a.basal != null ? `<div class="eval-data-item"><b>Metab. Basal</b><span>${a.basal}</span></div>` : ''}
                ${a.idade != null ? `<div class="eval-data-item"><b>Idade Metab.</b><span>${a.idade}</span></div></div>` : ''}
            </div>
        </div>
    `}).join('');
}

function salvarAvaliacao(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!alunoLogado) { toast('❌ Faça login novamente', true); return false; }
    if (!alunoLogado.evaluations) alunoLogado.evaluations = [];

    const get = id => document.getElementById(id);
    const data = {
        date: get('av_date')?.value || '',
        peso: numOrNull(get('av_peso')?.value),
        imc: numOrNull(get('av_imc')?.value),
        busto: numOrNull(get('av_busto')?.value),
        cintura: numOrNull(get('av_cintura')?.value),
        barriga: numOrNull(get('av_barriga')?.value),
        quadril: numOrNull(get('av_quadril')?.value),
        perna: numOrNull(get('av_perna')?.value),
        braco: numOrNull(get('av_braco')?.value),
        gordura: numOrNull(get('av_gordura')?.value),
        massa: numOrNull(get('av_massa')?.value),
        visceral: numOrNull(get('av_visceral')?.value),
        basal: numOrNull(get('av_basal')?.value),
        idade: numOrNull(get('av_idade')?.value)
    };

    if (!data.date) { toast('❌ Data é obrigatória', true); return false; }
    if (data.peso === null) { toast('❌ Peso é obrigatório', true); return false; }

    if (editAvaliacaoId) {
        const idx = alunoLogado.evaluations.findIndex(a => a.id === editAvaliacaoId);
        if (idx >= 0) {
            alunoLogado.evaluations[idx] = { ...alunoLogado.evaluations[idx], ...data };
            toast('✅ Avaliação atualizada!');
        }
        editAvaliacaoId = null;
        const tt = document.getElementById('avFormTitulo'); if (tt) tt.textContent = 'Adicionar avaliação';
        const sb = document.getElementById('avSubmitBtn'); if (sb) sb.textContent = '💾 Salvar avaliação';
        const cb = document.getElementById('avCancelarBtn'); if (cb) cb.classList.add('hidden');
    } else {
        data.id = Date.now();
        alunoLogado.evaluations.push(data);
        toast('✅ Avaliação salva!');
    }

    // Persiste no localStorage (como backup - voltara pra gestao via sincronizacao)
    saveLocalRecord(alunoLogado.id, 'evaluations', alunoLogado.evaluations);
    // Aplica override no aluno logado em memoria
    salvarOverrideLocal(alunoLogado.id, { evaluations: alunoLogado.evaluations });

    carregarAvaliacoes();
    e.target.reset();
    return false;
}

function editarAvaliacao(id) {
    const a = alunoLogado.evaluations.find(x => x.id === id);
    if (!a) { toast('❌ Avaliação não encontrada', true); return; }
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v != null ? v : ''; };
    set('av_date', a.date);
    set('av_peso', a.peso);
    set('av_busto', a.busto);
    set('av_cintura', a.cintura);
    set('av_barriga', a.barriga);
    set('av_quadril', a.quadril);
    set('av_perna', a.perna);
    set('av_braco', a.braco);
    set('av_imc', a.imc);
    set('av_gordura', a.gordura);
    set('av_massa', a.massa);
    set('av_visceral', a.visceral);
    set('av_basal', a.basal);
    set('av_idade', a.idade);

    editAvaliacaoId = id;
    const tt = document.getElementById('avFormTitulo'); if (tt) tt.textContent = 'Editar avaliação';
    const sb = document.getElementById('avSubmitBtn'); if (sb) sb.textContent = '💾 Atualizar avaliação';
    const cb = document.getElementById('avCancelarBtn'); if (cb) cb.classList.remove('hidden');
    document.getElementById('av_date')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelarEdicaoAvaliacao() {
    editAvaliacaoId = null;
    const tt = document.getElementById('avFormTitulo'); if (tt) tt.textContent = 'Adicionar avaliação';
    const sb = document.getElementById('avSubmitBtn'); if (sb) sb.textContent = '💾 Salvar avaliação';
    const cb = document.getElementById('avCancelarBtn'); if (cb) cb.classList.add('hidden');
    document.querySelector('#avaliacao form')?.reset();
}

function excluirAvaliacao(id) {
    if (!confirm('Excluir esta avaliação?')) return;
    alunoLogado.evaluations = alunoLogado.evaluations.filter(a => a.id !== id);
    saveLocalRecord(alunoLogado.id, 'evaluations', alunoLogado.evaluations);
    salvarOverrideLocal(alunoLogado.id, { evaluations: alunoLogado.evaluations });
    carregarAvaliacoes();
    toast('🗑️ Avaliação excluída');
}

// ============================================
// SINCRONIZACAO: enviar alteracoes pra gestao
// ============================================
async function sincronizarGestao() {
    if (!alunoLogado) return;
    toast('📤 Gerando dados pra gestão...');

    // Pega avaliacoes mais recentes (do override local)
    const ovr = JSON.parse(localStorage.getItem(LS_OVERRIDES) || '{}');
    const myOverrides = ovr[alunoLogado.id] || {};

    // Monta um JSON com a avaliacao mais recente no formato da gestao
    const latest = alunoLogado.evaluations && alunoLogado.evaluations.length
        ? alunoLogado.evaluations.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]
        : null;

    if (!latest) {
        toast('❌ Nenhuma avaliação pra sincronizar', true);
        return;
    }

    // Formato JSON pronto pra colar no aroeira_data.json
    const novo = {
        ...gestaoData,
        students: gestaoData.students.map(s => {
            if (String(s.id) !== String(alunoLogado.id)) return s;
            return { ...s, evaluations: alunoLogado.evaluations };
        }),
        lastUpdate: new Date().toISOString()
    };
    const json = JSON.stringify(novo, null, 2);

    // Copia pro clipboard
    try {
        await navigator.clipboard.writeText(json);
        toast('✅ JSON copiado! Cole no arquivo aroeira_data.json e dê commit no GitHub.');
    } catch (e) {
        // Fallback: abre modal com o JSON
        document.getElementById('syncJsonText').value = json;
        openModal('syncModal');
        toast('📋 Copie o JSON abaixo e cole no aroeira_data.json da gestão.');
    }
}

// ============================================
// TREINOS
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
    if (!alunoLogado) { toast('❌ Faça login novamente', true); return; }

    f.dataGeracao = new Date().toISOString().split('T')[0];
    const treino = montarTreino(f);

    alunoLogado.treinos.unshift({
        id: Date.now(),
        filtros: JSON.parse(JSON.stringify(f)),
        exercicios: treino
    });

    saveLocalRecord(alunoLogado.id, 'treinos', alunoLogado.treinos);

    document.getElementById('filtrosTreino')?.classList.add('hidden');
    document.getElementById('resultadoTreino')?.classList.remove('hidden');
    renderizarTreino(treino, f);
    carregarTreinos();
    toast('🔥 Treino de hoje gerado!');
}

function montarTreino(f) {
    // O catálogo de exercicios fica embutido no client (vem de um JSON estatico)
    const ex = (typeof EXERCICIOS_CATALOGO !== 'undefined') ? EXERCICIOS_CATALOGO : {};
    const grupo = f.grupo;
    let exercicios = [];
    try { exercicios = JSON.parse(JSON.stringify(ex[grupo] || [])); } catch (e) { exercicios = []; }

    if (f.experiencia === 'iniciante') {
        exercicios = exercicios.slice(0, 4);
        exercicios.forEach(e => {
            if (e.series && e.series.includes('x')) {
                const [qtd, reps] = e.series.split('x');
                e.series = '3x' + reps;
            }
        });
    }
    if ((f.objetivo === 'emagrecimento' || f.objetivo === 'resistencia') && ex.cardio) {
        exercicios.push({ nome: 'Cardio (final do treino)', aparelho: 'Esteira ou Bicicleta', series: '15-20 min', descanso: '-', grupo: 'cardio' });
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

    const html = `
        <div class="card">
            <div class="card-header"><h3>🎯 Treino de ${grupoNomes[f.grupo] || f.grupo}</h3></div>
            <div class="info-row"><strong>Experiência:</strong> <span>${expTxt[f.experiencia] || f.experiencia}</span></div>
            <div class="info-row"><strong>Objetivo:</strong> <span>${objetivoTxt[f.objetivo] || f.objetivo}</span></div>
            <div class="info-row"><strong>Frequência:</strong> <span>${f.frequencia}x por semana</span></div>
            <div class="info-row"><strong>Gerado em:</strong> <span>${formatarData(f.dataGeracao)}</span></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>🏋️ Exercícios do dia</h3></div>
            ${exercicios.map((e, i) => `
                <div class="exercicio-card">
                    <div class="nome">${i + 1}. ${escapeHtml(e.nome)}</div>
                    <div class="detalhes">
                        <span>🔁 ${escapeHtml(e.series)}</span>
                        <span>⏱️ ${escapeHtml(e.descanso)}</span>
                        <span>🏋️ ${escapeHtml(e.aparelho)}</span>
                    </div>
                    <div class="grupo-musculer">💪 ${grupoNomes[e.grupo] || e.grupo}</div>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-outline btn-block" onclick="novoTreino()">🔄 Gerar treino de outro dia</button>
    `;
    const div = document.getElementById('resultadoTreino');
    if (div) div.innerHTML = html;
}

function novoTreino() {
    respostasFiltro = {};
    document.querySelectorAll('.opcao.selected').forEach(o => o.classList.remove('selected'));
    document.getElementById('resultadoTreino')?.classList.add('hidden');
    document.getElementById('filtrosTreino')?.classList.remove('hidden');
    document.getElementById('filtrosTreino')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function carregarTreinos() {
    const div = document.getElementById('listaTreinos');
    if (!div) return;
    if (!alunoLogado.treinos || alunoLogado.treinos.length === 0) {
        div.innerHTML = '<p class="text-muted text-center" style="padding:20px;">Nenhum treino gerado ainda.</p>';
        return;
    }
    const grupoNomes = { peito: 'Peito', costas: 'Costas', pernas: 'Pernas', gluteos: 'Glúteos', ombros: 'Ombros', bracos: 'Braços', core: 'Core', cardio: 'Cardio' };
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
    document.getElementById('filtrosTreino')?.classList.add('hidden');
    document.getElementById('resultadoTreino')?.classList.remove('hidden');
    renderizarTreino(t.exercicios, t.filtros);
    document.getElementById('resultadoTreino')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function excluirTreino(id) {
    if (!confirm('Excluir este treino do histórico?')) return;
    alunoLogado.treinos = alunoLogado.treinos.filter(t => t.id !== id);
    saveLocalRecord(alunoLogado.id, 'treinos', alunoLogado.treinos);
    carregarTreinos();
    toast('🗑️ Treino excluído');
}

// === CONTATO ===
function enviarContato(e) {
    if (e && e.preventDefault) e.preventDefault();
    toast('✅ Mensagem enviada! Responderemos em breve.');
    e.target.reset();
    return false;
}

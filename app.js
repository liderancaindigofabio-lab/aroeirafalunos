// ============================================
// AROEIRA G FITNESS - SITE DOS ALUNOS
// Lógica de autenticação, perfil, chamados, etc.
// ============================================

// === ESTADO GLOBAL ===
let dados = null;
let alunoLogado = null;
let respostasFiltro = {};

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    if (window.location.pathname.includes('dashboard')) {
        verificarLogin();
    }
});

// === CARREGAR JSON ===
async function carregarDados() {
    try {
        const resp = await fetch('dados.json');
        dados = await resp.json();
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
        dados = { alunos: [], academia: {}, exercicios: {} };
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

    // Aqui entraria o envio real de e-mail. Por enquanto simula.
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
    document.getElementById('perfilPlano').textContent = alunoLogado.plano || '-';
    document.getElementById('perfilValor').textContent = alunoLogado.valor || '-';
    document.getElementById('perfilVencimento').textContent = alunoLogado.vencimento ? formatarData(alunoLogado.vencimento) : '-';
    document.getElementById('perfilStatus').innerHTML = badgeStatus(alunoLogado.status);
    document.getElementById('perfilMatricula').textContent = alunoLogado.dataMatricula ? formatarData(alunoLogado.dataMatricula) : '-';
    document.getElementById('perfilObjetivo').textContent = alunoLogado.objetivo || '-';
    document.getElementById('perfilTelefone').textContent = alunoLogado.telefone || '-';
}

function badgeStatus(st) {
    const map = {
        'Em Dia': 'badge-green',
        'Pendente': 'badge-yellow',
        'Vencido': 'badge-red',
        'Atrasado': 'badge-darkred'
    };
    return `<span class="badge ${map[st] || 'badge-gold'}">${st}</span>`;
}

function formatarData(iso) {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function trocarFoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        toast('❌ Foto muito grande! Máximo 2MB', true);
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

// Salva alterações no localStorage (substituir por chamada real à API depois)
function salvarLocal() {
    const idx = dados.alunos.findIndex(a => a.id === alunoLogado.id);
    dados.alunos[idx] = alunoLogado;
    localStorage.setItem('aroeira_dados', JSON.stringify(dados));
}

// ============================================
// CHAMADOS
// ============================================
function carregarChamados() {
    if (!alunoLogado.chamados) alunoLogado.chamados = [];
    const div = document.getElementById('listaChamados');
    if (alunoLogado.chamados.length === 0) {
        div.innerHTML = '<p style="opacity:0.5; text-align:center; padding:20px;">Nenhum chamado aberto ainda.</p>';
        return;
    }
    div.innerHTML = alunoLogado.chamados.map((c, i) => `
        <div class="avaliacao-item">
            <div class="data">📌 ${c.assunto} <span class="badge ${c.status === 'Resolvido' ? 'badge-green' : 'badge-yellow'}" style="float:right;">${c.status}</span></div>
            <div style="font-size:0.85rem; opacity:0.7; margin-bottom:8px;">Aberto em ${formatarData(c.data)}</div>
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

    if (!alunoLogado.chamados) alunoLogado.chamados = [];
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

// ============================================
// AVALIAÇÃO FÍSICA
// ============================================
function carregarAvaliacoes() {
    if (!alunoLogado.avaliacoes) alunoLogado.avaliacoes = [];
    const div = document.getElementById('listaAvaliacoes');
    if (alunoLogado.avaliacoes.length === 0) {
        div.innerHTML = '<p style="opacity:0.5; text-align:center; padding:20px;">Nenhuma avaliação cadastrada.</p>';
        return;
    }
    // Mais recente primeiro
    const avs = [...alunoLogado.avaliacoes].sort((a, b) => b.data.localeCompare(a.data));
    div.innerHTML = avs.map(a => `
        <div class="avaliacao-item">
            <div class="data">📅 ${formatarData(a.data)}</div>
            <div class="avaliacao-grid">
                <div><strong>Peso:</strong> ${a.peso}kg</div>
                <div><strong>Altura:</strong> ${a.altura}m</div>
                <div><strong>IMC:</strong> ${a.imc ? a.imc.toFixed(1) : '-'}</div>
                <div><strong>Gordura:</strong> ${a.gordura}%</div>
                <div><strong>Músculo:</strong> ${a.musculo}%</div>
                <div><strong>Braço:</strong> ${a.braco}cm</div>
                <div><strong>Peito:</strong> ${a.peito}cm</div>
                <div><strong>Cintura:</strong> ${a.cintura}cm</div>
                <div><strong>Coxa:</strong> ${a.coxa}cm</div>
            </div>
        </div>
    `).join('');
}

function adicionarAvaliacao(e) {
    e.preventDefault();
    const peso = parseFloat(document.getElementById('avPeso').value);
    const altura = parseFloat(document.getElementById('avAltura').value);
    const imc = peso / (altura * altura);

    const av = {
        data: document.getElementById('avData').value,
        peso,
        altura,
        imc,
        gordura: parseFloat(document.getElementById('avGordura').value),
        musculo: parseFloat(document.getElementById('avMusculo').value),
        braco: parseFloat(document.getElementById('avBraco').value),
        peito: parseFloat(document.getElementById('avPeito').value),
        cintura: parseFloat(document.getElementById('avCintura').value),
        coxa: parseFloat(document.getElementById('avCoxa').value)
    };
    if (!alunoLogado.avaliacoes) alunoLogado.avaliacoes = [];
    alunoLogado.avaliacoes.push(av);
    salvarLocal();
    carregarAvaliacoes();
    toast('✅ Avaliação salva! A gestão recebeu a atualização.');
    e.target.reset();
    return false;
}

// ============================================
// GERADOR DE TREINO
// ============================================
function selecionarOpcao(el, campo, valor) {
    // desseleciona irmãos
    el.parentElement.querySelectorAll('.opcao').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    respostasFiltro[campo] = valor;
}

function gerarTreino() {
    const f = respostasFiltro;
    if (!f.experiencia || !f.objetivo || !f.frequencia || !f.genero) {
        toast('❌ Responda todas as perguntas!', true);
        return;
    }
    f.limitacao = document.getElementById('limitacao').value.trim();
    f.dataGeracao = new Date().toISOString().split('T')[0];

    const treino = montarTreino(f);

    if (!alunoLogado.treinos) alunoLogado.treinos = [];
    alunoLogado.treinos.unshift({ id: Date.now(), filtros: { ...f }, dias: treino });
    salvarLocal();

    document.getElementById('filtrosTreino').style.display = 'none';
    document.getElementById('resultadoTreino').style.display = 'block';
    renderizarTreino(treino, f);
    carregarTreinos();
    toast('🔥 Treino gerado com sucesso!');
}

function montarTreino(f) {
    const ex = dados.exercicios;
    const fem = f.genero === 'f';
    const isIniciante = f.experiencia === 'iniciante';
    const isEmagrecer = f.objetivo === 'emagrecimento';
    const isResistencia = f.objetivo === 'resistencia';

    let dias = [];

    if (f.frequencia === 3) {
        dias = [
            { nome: 'Treino A - Peito, Ombro e Tríceps', grupos: ['peito', 'ombros', 'bracos'] },
            { nome: 'Treino B - Costas e Bíceps', grupos: ['costas', 'bracos'] },
            { nome: 'Treino C - Pernas e Glúteos', grupos: fem ? ['gluteos', 'pernas'] : ['pernas', 'gluteos'] }
        ];
    } else if (f.frequencia === 4) {
        dias = [
            { nome: 'Treino A - Peito e Tríceps', grupos: ['peito', 'bracos'] },
            { nome: 'Treino B - Costas e Bíceps', grupos: ['costas', 'bracos'] },
            { nome: 'Treino C - Pernas', grupos: ['pernas'] },
            { nome: 'Treino D - Ombros, Glúteos e Core', grupos: ['ombros', 'gluteos', 'core'] }
        ];
    } else {
        dias = [
            { nome: 'Treino A - Peito', grupos: ['peito'] },
            { nome: 'Treino B - Costas', grupos: ['costas'] },
            { nome: 'Treino C - Pernas', grupos: ['pernas'] },
            { nome: 'Treino D - Ombros e Braços', grupos: ['ombros', 'bracos'] },
            { nome: 'Treino E - Glúteos, Core e Cardio', grupos: ['gluteos', 'core', 'cardio'] }
        ];
    }

    if (isIniciante) {
        dias.forEach(d => d.grupos = d.grupos.slice(0, 2));
    }

    if (isEmagrecer || isResistencia) {
        dias.forEach(d => {
            if (!d.grupos.includes('cardio')) d.grupos.push('cardio');
        });
    }

    // Monta exercícios de cada dia
    dias.forEach(dia => {
        dia.exercicios = [];
        dia.grupos.forEach(g => {
            const lista = ex[g] || [];
            lista.forEach(e => dia.exercicios.push({ ...e, grupo: g }));
        });
        // Ajusta séries pra iniciantes
        if (isIniciante) {
            dia.exercicios.forEach(e => {
                if (e.series.includes('x')) {
                    const [qtd, reps] = e.series.split('x');
                    e.series = `3x${reps}`;
                }
            });
        }
    });

    return dias;
}

function renderizarTreino(dias, f) {
    const objetivoTxt = {
        hipertrofia: '💪 Ganho de massa',
        emagrecimento: '🔥 Emagrecimento',
        resistencia: '⚡ Resistência',
        forca: '💪 Força'
    };
    const expTxt = {
        iniciante: '🆕 Iniciante',
        intermediario: '🔄 Intermediário',
        avancado: '💪 Avançado'
    };
    const freqTxt = `${f.frequencia}x por semana`;

    let html = `
        <div class="card">
            <h3>🎯 Seu Treino Personalizado</h3>
            <div class="info-row"><strong>Experiência:</strong> <span>${expTxt[f.experiencia]}</span></div>
            <div class="info-row"><strong>Objetivo:</strong> <span>${objetivoTxt[f.objetivo]}</span></div>
            <div class="info-row"><strong>Frequência:</strong> <span>${freqTxt}</span></div>
            ${f.limitacao ? `<div class="info-row"><strong>⚠️ Limitação:</strong> <span>${escapeHtml(f.limitacao)}</span></div>` : ''}
            <div class="info-row"><strong>Gerado em:</strong> <span>${formatarData(f.dataGeracao)}</span></div>
        </div>
    `;

    dias.forEach((d, i) => {
        html += `
            <div class="treino-dia">
                <h4>📅 ${d.nome}</h4>
                ${d.exercicios.map(e => `
                    <div class="exercicio-card">
                        <div class="nome">${e.nome}</div>
                        <div class="detalhes">🔁 ${e.series} • ⏱️ Descanso: ${e.descanso} • 🏋️ ${e.aparelho}</div>
                        <div class="grupo-musculer">💪 ${e.grupo}</div>
                    </div>
                `).join('')}
            </div>
        `;
    });

    html += `<button class="btn mt-20" onclick="document.getElementById('resultadoTreino').style.display='none'; document.getElementById('filtrosTreino').style.display='block';">🔄 Gerar novo treino</button>`;

    document.getElementById('resultadoTreino').innerHTML = html;
}

function carregarTreinos() {
    if (!alunoLogado.treinos) alunoLogado.treinos = [];
    const div = document.getElementById('listaTreinos');
    if (alunoLogado.treinos.length === 0) {
        div.innerHTML = '<p style="opacity:0.5; text-align:center; padding:20px;">Nenhum treino gerado ainda.</p>';
        return;
    }
    div.innerHTML = alunoLogado.treinos.map(t => `
        <div class="avaliacao-item">
            <div class="data">🏋️ Treino gerado em ${formatarData(t.filtros.dataGeracao)} <span class="badge badge-gold">${t.dias.length} dias</span></div>
            <div style="font-size:0.85rem; opacity:0.7;">
                ${t.filtros.frequencia}x/semana • ${t.filtros.objetivo} • ${t.filtros.experiencia}
            </div>
        </div>
    `).join('');
}

// ============================================
// CONTATO (página inicial)
// ============================================
function enviarContato(e) {
    e.preventDefault();
    const dados_form = new FormData(e.target);
    const msg = `
        <strong>Nova mensagem de contato:</strong><br>
        Nome: ${dados_form.get('nome')}<br>
        E-mail: ${dados_form.get('email')}<br>
        Telefone: ${dados_form.get('telefone') || 'não informado'}<br>
        Mensagem: ${dados_form.get('mensagem')}
    `;
    toast('✅ Mensagem enviada! Responderemos em breve.');
    console.log('Contato:', msg);
    e.target.reset();
    return false;
}

// === UTILITÁRIOS ===
function escapeHtml(t) {
    if (!t) return '';
    return String(t)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

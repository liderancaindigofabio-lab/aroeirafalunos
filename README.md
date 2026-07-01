# Aroeira G Fitness — Site dos Alunos

Site público para os alunos da academia Aroeira G Fitness, com área logada para acessar perfil, chamados, avaliação física e treinos.

## 🔐 Acesso de teste

- **E-mail:** meussegdores@gmail.com
- **Senha:** 123456

## 📁 Estrutura

```
site-alunos/
├── index.html         # Home com WhatsApp, planos, formulário de contato e login
├── dashboard.html     # Área logada do aluno
├── style.css          # Identidade visual preto + dourado
├── app.js             # Lógica de autenticação, perfil, chamados, treinos
├── dados.json         # Base de dados (mock)
└── README.md
```

## ✅ Funcionalidades da v1

### Página pública (index.html)
- [x] Hero com chamada principal + botão WhatsApp
- [x] Cards dos 3 planos (Diário, Mensal, Anual)
- [x] Formulário de contato (envia para `sacaroeiragfitness@gmail.com`)
- [x] Login com e-mail + senha
- [x] Recuperação de senha (link por e-mail)

### Área logada (dashboard.html)
- [x] **Perfil:** dados cadastrais, plano, status, foto
- [x] **Trocar senha** dentro do perfil
- [x] **Chamados:** abrir + visualizar + resposta da gestão
- [x] **Avaliação Física:** adicionar + histórico
- [x] **Gerar Treino:** perguntas filtro + treino personalizado + histórico

## 🔄 Próximos passos

1. Conectar a base de alunos com o sistema de gestão (`/aroeiragfitness/`)
2. Implementar envio real de e-mails (formulário de contato + esqueci senha)
3. Subir fotos reais da academia
4. Adicionar upload de vídeos demonstrativos nos exercícios
5. Sistema de notificações push

// ============================================
// CATÁLOGO DE EXERCÍCIOS (somente leitura)
// Fonte: gestão Aroeira G Fitness
// ============================================
const EXERCICIOS_CATALOGO = {
  peito: [
    { nome: "Supino Reto", aparelho: "Supino Reto / Barra", series: "4x10", descanso: "60s", grupo: "peito" },
    { nome: "Supino Inclinado com Halteres", aparelho: "Halteres + Banco", series: "3x12", descanso: "60s", grupo: "peito" },
    { nome: "Crucifixo na Polia", aparelho: "Polia", series: "3x12", descanso: "60s", grupo: "peito" },
    { nome: "Cross Over", aparelho: "Polia", series: "3x15", descanso: "60s", grupo: "peito" },
    { nome: "Supino Declinado", aparelho: "Barra / Halteres", series: "3x10", descanso: "60s", grupo: "peito" },
    { nome: "Flexão de Braço", aparelho: "Solo", series: "3x15", descanso: "45s", grupo: "peito" }
  ],
  costas: [
    { nome: "Puxada Frontal", aparelho: "Polia", series: "4x10", descanso: "60s", grupo: "costas" },
    { nome: "Remada Curvada", aparelho: "Barra", series: "4x10", descanso: "60s", grupo: "costas" },
    { nome: "Remada Cavalete", aparelho: "Halteres", series: "3x12", descanso: "60s", grupo: "costas" },
    { nome: "Puxada Triângulo", aparelho: "Polia", series: "3x12", descanso: "60s", grupo: "costas" },
    { nome: "Remada Unilateral", aparelho: "Halter", series: "3x10", descanso: "60s", grupo: "costas" },
    { nome: "Pulldown", aparelho: "Polia", series: "3x12", descanso: "60s", grupo: "costas" }
  ],
  pernas: [
    { nome: "Agachamento Livre", aparelho: "Barra", series: "4x10", descanso: "90s", grupo: "pernas" },
    { nome: "Leg Press 45°", aparelho: "Máquina", series: "4x10", descanso: "90s", grupo: "pernas" },
    { nome: "Cadeira Extensora", aparelho: "Máquina", series: "3x12", descanso: "60s", grupo: "pernas" },
    { nome: "Mesa Flexora", aparelho: "Máquina", series: "3x12", descanso: "60s", grupo: "pernas" },
    { nome: "Stiff", aparelho: "Barra / Halter", series: "3x10", descanso: "60s", grupo: "pernas" },
    { nome: "Afundo", aparelho: "Halteres", series: "3x12", descanso: "60s", grupo: "pernas" },
    { nome: "Cadeira Adutora", aparelho: "Máquina", series: "3x12", descanso: "60s", grupo: "pernas" }
  ],
  gluteos: [
    { nome: "Agachamento Sumô", aparelho: "Halter", series: "4x12", descanso: "60s", grupo: "gluteos" },
    { nome: "Hip Thrust", aparelho: "Barra", series: "4x10", descanso: "60s", grupo: "gluteos" },
    { nome: "Cadeira Abdutora", aparelho: "Máquina", series: "3x15", descanso: "60s", grupo: "gluteos" },
    { nome: "Elevação Pélvica", aparelho: "Solo", series: "3x15", descanso: "60s", grupo: "gluteos" },
    { nome: "Coice na Polia", aparelho: "Polia", series: "3x12", descanso: "60s", grupo: "gluteos" }
  ],
  ombros: [
    { nome: "Desenvolvimento com Halteres", aparelho: "Halteres", series: "4x10", descanso: "60s", grupo: "ombros" },
    { nome: "Elevação Lateral", aparelho: "Halteres", series: "3x15", descanso: "60s", grupo: "ombros" },
    { nome: "Elevação Frontal", aparelho: "Halteres", series: "3x12", descanso: "60s", grupo: "ombros" },
    { nome: "Remada Alta", aparelho: "Barra", series: "3x12", descanso: "60s", grupo: "ombros" },
    { nome: "Crucifixo Inverso", aparelho: "Halteres", series: "3x12", descanso: "60s", grupo: "ombros" }
  ],
  bracos: [
    { nome: "Rosca Direta", aparelho: "Barra", series: "4x10", descanso: "60s", grupo: "bracos" },
    { nome: "Rosca Alternada", aparelho: "Halteres", series: "3x12", descanso: "60s", grupo: "bracos" },
    { nome: "Tríceps Testa", aparelho: "Barra W", series: "3x12", descanso: "60s", grupo: "bracos" },
    { nome: "Tríceps na Polia", aparelho: "Polia", series: "3x12", descanso: "60s", grupo: "bracos" },
    { nome: "Rosca Martelo", aparelho: "Halteres", series: "3x12", descanso: "60s", grupo: "bracos" },
    { nome: "Mergulho", aparelho: "Barras paralelas", series: "3x10", descanso: "60s", grupo: "bracos" }
  ],
  core: [
    { nome: "Abdominal Supra", aparelho: "Solo", series: "3x20", descanso: "45s", grupo: "core" },
    { nome: "Prancha", aparelho: "Solo", series: "3x60s", descanso: "45s", grupo: "core" },
    { nome: "Abdominal Oblíquo", aparelho: "Solo", series: "3x20", descanso: "45s", grupo: "core" },
    { nome: "Elevação de Pernas", aparelho: "Barra fixa", series: "3x15", descanso: "45s", grupo: "core" },
    { nome: "Abdominal Infra", aparelho: "Solo", series: "3x15", descanso: "45s", grupo: "core" }
  ],
  cardio: [
    { nome: "Esteira", aparelho: "Esteira", series: "20 min", descanso: "-", grupo: "cardio" },
    { nome: "Bicicleta Ergométrica", aparelho: "Bicicleta", series: "20 min", descanso: "-", grupo: "cardio" },
    { nome: "Elíptico", aparelho: "Elíptico", series: "20 min", descanso: "-", grupo: "cardio" }
  ]
};

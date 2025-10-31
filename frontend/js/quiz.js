/****************************************************
 * SOFTSKILLS INTELLIGENCE ENGINE
 * Autor: El Tata y su compa GPT-5
 * Sistema avanzado de diagnóstico de habilidades blandas
 ****************************************************/

const API_URL = "https://TU_API_RENDER_URL";
const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

document.getElementById("backBtn").onclick = () => {
  window.location.href = "home.html";
};

const form = document.getElementById("quizForm");
const resultDiv = document.getElementById("result");

// ----------------------------------------------
// 🔍 CONFIGURACIÓN: mapa de preguntas a habilidades
// ----------------------------------------------
const questionMap = {
  q1: ["Comunicación"],
  q2: ["Empatía"],
  q3: ["Resolución de conflictos", "Liderazgo"],
  q4: ["Responsabilidad", "Organización"],
  q5: ["Adaptabilidad"],
  q6: ["Liderazgo"],
  q7: ["Paciencia", "Trabajo en equipo"],
  q8: ["Comunicación"],
  q9: ["Creatividad", "Innovación"],
  q10: ["Gestión emocional", "Resiliencia"],
  q11: ["Escucha activa", "Empatía"],
  q12: ["Pensamiento crítico"],
  q13: ["Colaboración", "Trabajo en equipo"],
  q14: ["Planificación", "Orientación a resultados"],
  q15: ["Motivación", "Perseverancia"],
  q16: ["Gestión del tiempo", "Planificación"],
  q17: ["Pensamiento crítico", "Toma de decisiones"],
  q18: ["Autoconocimiento", "Resiliencia"],
  q19: ["Trabajo en equipo", "Comunicación"],
  q20: ["Creatividad", "Adaptabilidad"],
};

// ----------------------------------------------
// ⚙️ Escala de respuestas (Likert 1–5)
// ----------------------------------------------
const answerValue = {
  "Muy en desacuerdo": 1,
  "En desacuerdo": 2,
  "Neutral": 3,
  "De acuerdo": 4,
  "Totalmente de acuerdo": 5,
};

// ----------------------------------------------
// 💡 Descripciones por habilidad
// ----------------------------------------------
const descriptions = {
  Comunicación: "Capacidad para expresar ideas con claridad y escuchar activamente.",
  Empatía: "Habilidad para comprender las emociones y perspectivas de los demás.",
  Liderazgo: "Capacidad de guiar, inspirar y coordinar equipos hacia objetivos comunes.",
  Adaptabilidad: "Facilidad para ajustarse a cambios y mantener el rendimiento.",
  Creatividad: "Generar ideas innovadoras y soluciones originales ante problemas.",
  Resiliencia: "Resistir y recuperarse ante la adversidad con actitud positiva.",
  PensamientoCrítico: "Analizar, evaluar y tomar decisiones con criterio propio.",
  TrabajoEnEquipo: "Colaborar y cooperar efectivamente en entornos grupales.",
  Planificación: "Definir objetivos claros y trazar estrategias para alcanzarlos.",
  GestiónEmocional: "Regular emociones y mantener la calma en situaciones complejas.",
};

// ----------------------------------------------
// 🎯 Procesamiento del formulario
// ----------------------------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const answers = {};
  const scores = {};

  // Inicializar todas las habilidades con 0
  Object.values(questionMap)
    .flat()
    .forEach((skill) => (scores[skill] = 0));

  // Sumar valores por pregunta
  for (let i = 1; i <= 20; i++) {
    const field = `q${i}`;
    const answer = form[field].value;
    if (!answer) {
      alert("Por favor responde todas las preguntas");
      return;
    }
    answers[field] = answer;
    const value = answerValue[answer] || 0;

    const skills = questionMap[field];
    skills.forEach((s) => (scores[s] += value));
  }

  // Calcular promedios
  const normalized = Object.entries(scores).map(([skill, total]) => {
    const relatedCount = Object.values(questionMap).filter((arr) =>
      arr.includes(skill)
    ).length;
    const score = (total / (relatedCount * 5)) * 100;
    return { skill, score: Math.round(score) };
  });

  // Ordenar y clasificar
  const sorted = normalized.sort((a, b) => b.score - a.score);
  const top5 = sorted.slice(0, 5);
  const low2 = sorted.slice(-2);

  // Determinar perfil general
  const personality = getProfile(sorted);

  // Generar recomendaciones personalizadas
  const recommendations = generateRecommendations(top5, low2);

  // Mostrar resultados
  displayResults(top5, low2, personality, recommendations);

  // Guardar en backend
  const payload = {
    answers,
    softSkills: top5.map((s) => s.skill),
    profile: personality.title,
  };

  await fetch(`${API_URL}/api/quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
});

// ----------------------------------------------
// 🧩 Generador de perfil general según habilidades
// ----------------------------------------------
function getProfile(sorted) {
  const highest = sorted[0].skill;
  let title, description;

  switch (highest) {
    case "Liderazgo":
      title = "El Estratega Visionario 🧭";
      description =
        "Eres una persona que guía a los demás con claridad, motivación y propósito. Inspiras confianza y sabes tomar decisiones bajo presión.";
      break;
    case "Comunicación":
      title = "El Comunicador Nato 🎤";
      description =
        "Tu capacidad para expresarte y conectar con los demás te convierte en un puente entre personas e ideas. Ideal para entornos colaborativos.";
      break;
    case "Empatía":
      title = "El Conector Emocional 💞";
      description =
        "Tu sensibilidad y comprensión hacia los demás te hacen una persona valiosa en equipos humanos y relaciones personales.";
      break;
    case "Creatividad":
      title = "El Innovador 🌈";
      description =
        "Tu mente curiosa y abierta te permite encontrar soluciones originales. Siempre buscas nuevas perspectivas y caminos diferentes.";
      break;
    case "Planificación":
      title = "El Estratega Organizado 📅";
      description =
        "Tienes un enfoque estructurado y claro hacia tus metas. Eres confiable, metódico y orientado a resultados.";
      break;
    case "Resiliencia":
      title = "El Guerrero Sereno ⚔️";
      description =
        "Mantienes la calma ante los desafíos y aprendes de cada tropiezo. Tu fortaleza mental inspira a los demás.";
      break;
    default:
      title = "El Colaborador Integral 💪";
      description =
        "Tu equilibrio entre distintas habilidades te convierte en una persona adaptable y valiosa en cualquier entorno.";
  }

  return { title, description };
}

// ----------------------------------------------
// 🧠 Recomendaciones personalizadas
// ----------------------------------------------
function generateRecommendations(top, low) {
  const recs = [];

  top.forEach((s) => {
    recs.push(`✅ Fortalece tu ${s.skill}: ${descriptions[s.skill]}`);
  });

  low.forEach((s) => {
    recs.push(
      `⚡ Te sugerimos trabajar en ${s.skill}: ${
        descriptions[s.skill]
      }. Puedes hacerlo mediante ejercicios de introspección, feedback o cursos específicos.`
    );
  });

  recs.push(
    "🧘‍♂️ Consejo general: Mantén un equilibrio entre tus emociones, tu comunicación y tu capacidad de adaptación. Las habilidades blandas se desarrollan con práctica constante."
  );

  return recs;
}

// ----------------------------------------------
// 🎨 Mostrar resultados con estilo
// ----------------------------------------------
function displayResults(top, low, profile, recs) {
  resultDiv.innerHTML = `
    <h2>Resultados del Test de Habilidades Blandas</h2>
    <h3>${profile.title}</h3>
    <p>${profile.description}</p>

    <h4>🏆 Tus habilidades más fuertes:</h4>
    <ul>${top.map((s) => `<li>${s.skill} (${s.score}%)</li>`).join("")}</ul>

    <h4>⚠️ Áreas a mejorar:</h4>
    <ul>${low.map((s) => `<li>${s.skill} (${s.score}%)</li>`).join("")}</ul>

    <h4>🧭 Recomendaciones:</h4>
    <ul>${recs.map((r) => `<li>${r}</li>`).join("")}</ul>

    <button class="cta" onclick="window.location.href='home.html'">
      Volver al inicio
    </button>
  `;

  form.style.display = "none";
}

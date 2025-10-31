const API_URL = "https://TU_API_RENDER_URL";
const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

document.getElementById("logoutBtn").onclick = () => {
  localStorage.clear();
  window.location.href = "index.html";
};

document.getElementById("goQuiz").onclick = () => {
  window.location.href = "quiz.html";
};

// Obtener datos del usuario
async function loadUser() {
  const res = await fetch(`${API_URL}/api/user`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  document.getElementById("userName").innerText = data.name;
}

// Obtener quizzes anteriores
async function loadResults() {
  const res = await fetch(`${API_URL}/api/quizzes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const quizzes = await res.json();
  const container = document.getElementById("pastResults");

  if (quizzes.length === 0) {
    container.innerHTML = "<p>Aún no tienes resultados guardados.</p>";
  } else {
    container.innerHTML = `
      <h3>Tus resultados anteriores:</h3>
      <ul>
        ${quizzes.map(q => `<li>${q.softSkills.join(", ")}</li>`).join("")}
      </ul>
    `;
  }
}

loadUser();
loadResults();

const API_URL = "https://encuestaa.onrender.com"; // ¡URL REAL DE TU API DE RENDER!
const token = localStorage.getItem("token");

// Si no hay token, redirigir a la página de login
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
  try {
    const res = await fetch(`${API_URL}/api/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      document.getElementById("userName").innerText = data.name;
    } else {
      // Manejar token expirado o inválido
      localStorage.clear();
      alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error al cargar datos del usuario:", error);
    // Podrías poner un mensaje en la UI si la conexión falla completamente
  }
}

// Obtener quizzes anteriores
async function loadResults() {
  const container = document.getElementById("pastResults");
  try {
    const res = await fetch(`${API_URL}/api/quizzes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const quizzes = await res.json();
      
      if (quizzes.length === 0) {
        container.innerHTML = "<p class='text-center'>Aún no tienes resultados guardados.</p>";
      } else {
        container.innerHTML = `
          <h3>Tus resultados anteriores:</h3>
          <ul class="results-list">
            ${quizzes.map(q => `<li>${q.softSkills.join(", ")}</li>`).join("")}
          </ul>
        `;
      }
    } else {
       // Si la API devuelve un error (ej: 401 Unauthorized), simplemente mostrar que no hay resultados
       container.innerHTML = "<p class='error-message'>No se pudieron cargar los resultados. Intenta iniciar sesión de nuevo.</p>";
    }
  } catch (error) {
    console.error("Error de red al cargar resultados:", error);
    container.innerHTML = "<p class='error-message'>No se pudo conectar con el servidor para obtener los resultados.</p>";
  }
}

loadUser();
loadResults();

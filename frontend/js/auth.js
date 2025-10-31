const API_URL = "https://TU_API_RENDER_URL"; // tu URL de FastAPI

document.getElementById("toRegister").onclick = () => {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
};
document.getElementById("toLogin").onclick = () => {
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
};

// ---- Registro ----
document.getElementById("registerBtn").onclick = async () => {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  const res = await fetch(`${API_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (res.ok) alert("Registro exitoso. Ahora inicia sesión.");
  else alert("Error al registrar.");
};

// ---- Login ----
document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("name", data.name);
    window.location.href = "quiz.html";
  } else {
    alert(data.detail || "Error al iniciar sesión.");
  }
};

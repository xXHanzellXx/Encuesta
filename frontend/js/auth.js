const API_URL = "https://encuestaa.onrender.com"; // ¡URL REAL DE TU API DE RENDER!

// Lógica de cambio de formulario (se mantiene igual)
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

  try {
    const res = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("✅ Registro exitoso. ¡Ahora puedes iniciar sesión!");
      // Cambiar a la vista de login automáticamente
      document.getElementById("toLogin").click();
    } else {
      // Muestra el detalle del error que viene del backend (ej: "El usuario ya existe")
      alert(`❌ Error al registrar: ${data.detail || "Error desconocido."}`);
    }
  } catch (error) {
    alert("🚨 Error de conexión con la API. Verifica si la URL es correcta.");
  }
};

// ---- Login ----
document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name);
      alert(`🎉 Inicio de sesión exitoso. ¡Bienvenido, ${data.name}!`);
      // Redirige al usuario a la página principal
      window.location.href = "home.html"; 
    } else {
      // Muestra el detalle del error que viene del backend (ej: "Contraseña incorrecta")
      alert(`❌ Error al iniciar sesión: ${data.detail || "Email o contraseña incorrectos."}`);
    }
  } catch (error) {
    alert("🚨 Error de conexión con la API. Verifica si la URL es correcta.");
  }
};

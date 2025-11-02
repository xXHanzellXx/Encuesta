const API_URL = "https://encuestaa.onrender.com"; // ¡URL REAL DE TU API DE RENDER!

// Referencias a elementos del DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toRegisterLink = document.getElementById('toRegister');
const toLoginLink = document.getElementById('toLogin');

const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');

const regNameInput = document.getElementById('regName');
const regEmailInput = document.getElementById('regEmail');
const regPasswordInput = document.getElementById('regPassword');
const registerBtn = document.getElementById('registerBtn');


// ------------------------------------------
// 🚀 VALIDACIONES Y FUNCIONES DE UTILIDAD
// ------------------------------------------

/** Muestra un mensaje de error o sugerencia temporal debajo de un input o botón. */
const displayMessage = (inputOrBtnElement, message, isError = true) => {
    // Busca y elimina el mensaje anterior
    let messageElement = inputOrBtnElement.nextElementSibling;
    if (messageElement && messageElement.classList.contains('validation-message')) {
        messageElement.remove();
    }

    // Crea y añade el nuevo mensaje
    messageElement = document.createElement('p');
    messageElement.classList.add('validation-message');
    // Aseguramos que los estilos no afecten otros <p>
    messageElement.style.fontSize = '0.85rem';
    messageElement.style.marginTop = '0.4rem';
    messageElement.style.marginBottom = '0';
    messageElement.style.textAlign = inputOrBtnElement.id.includes('Btn') ? 'center' : 'left'; // Centra en botones
    messageElement.style.color = isError ? '#ef4444' : '#facc15'; // Rojo para error, Amarillo para sugerencia
    messageElement.textContent = message;
    
    // Inserta después del elemento
    inputOrBtnElement.parentNode.insertBefore(messageElement, inputOrBtnElement.nextSibling);
};

/** Elimina cualquier mensaje de validación existente para un input. */
const clearMessage = (inputElement) => {
    const messageElement = inputElement.nextElementSibling;
    if (messageElement && messageElement.classList.contains('validation-message')) {
        messageElement.remove();
    }
};

/** Valida el formato de un correo electrónico. */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/** Valida la seguridad de la contraseña y retorna un mensaje de sugerencia si es débil. */
const validatePasswordSecurity = (password) => {
    if (password.length === 0) {
        return { valid: false, message: 'La contraseña no puede estar vacía.', isCritical: true };
    }
    
    let score = 0;
    let suggestion = '';

    if (password.length < 8) {
        suggestion = 'Debe tener al menos 8 caracteres.';
    } else {
        score += 1;
    }

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9\s]/.test(password);

    if (hasLower) score++; else suggestion += (suggestion ? ' ' : '') + 'Incluye minúsculas.';
    if (hasUpper) score++; else suggestion += (suggestion ? ' ' : '') + 'Incluye mayúsculas.';
    if (hasNumber) score++; else suggestion += (suggestion ? ' ' : '') + 'Incluye números.';
    if (hasSymbol) score++; else suggestion += (suggestion ? ' ' : '') + 'Incluye símbolos (ej. !, @).';

    // Se considera seguro con un score de 4 o más (cumple 4 tipos + longitud)
    if (score >= 4) {
         return { valid: true, message: '' };
    } else {
        return { valid: false, message: suggestion, isCritical: password.length < 8 };
    }
};

// ------------------------------------------
// 📝 LÓGICA DE VALIDACIÓN EN TIEMPO REAL (ON BLUR)
// ------------------------------------------

// Validar Email
[loginEmailInput, regEmailInput].forEach(input => {
    input.addEventListener('blur', () => {
        clearMessage(input);
        if (input.value.trim() === '') {
            displayMessage(input, 'El correo electrónico no puede estar vacío.', true);
        } else if (!isValidEmail(input.value)) {
            displayMessage(input, 'Por favor, introduce un correo electrónico válido.', true);
        }
    });
    input.addEventListener('focus', () => clearMessage(input));
});

// Validar Contraseña y dar sugerencias
[loginPasswordInput, regPasswordInput].forEach(input => {
    input.addEventListener('blur', () => {
        clearMessage(input);
        const validation = validatePasswordSecurity(input.value);
        if (!validation.valid) {
            // isCritical true = error (rojo), isCritical false = sugerencia (amarillo)
            displayMessage(input, validation.message, validation.isCritical);
        }
    });
    input.addEventListener('focus', () => clearMessage(input));
});

// Validar Nombre para registro
regNameInput.addEventListener('blur', () => {
    clearMessage(regNameInput);
    if (regNameInput.value.trim().length < 2) {
        displayMessage(regNameInput, 'El nombre debe tener al menos 2 caracteres.', true);
    }
});
regNameInput.addEventListener('focus', () => clearMessage(regNameInput));


// ------------------------------------------
// 🔒 MANEJO DE AUTENTICACIÓN (LOGIN Y REGISTER)
// ------------------------------------------

/** Función para validar todos los campos de Registro antes de la llamada a la API. */
const isRegisterFormValid = () => {
    let isValid = true;
    
    // 1. Nombre
    if (regNameInput.value.trim().length < 2) {
        displayMessage(regNameInput, 'El nombre es obligatorio (min. 2 caracteres).', true);
        isValid = false;
    } else {
        clearMessage(regNameInput);
    }
    
    // 2. Email
    if (!isValidEmail(regEmailInput.value)) {
        displayMessage(regEmailInput, 'Formato de email incorrecto.', true);
        isValid = false;
    } else {
        clearMessage(regEmailInput);
    }
    
    // 3. Contraseña
    if (!validatePasswordSecurity(regPasswordInput.value).valid) {
        displayMessage(regPasswordInput, 'La contraseña no es segura. Corrige los requisitos.', true);
        isValid = false;
    } else {
        clearMessage(regPasswordInput);
    }

    return isValid;
};

/** Función de Registro - Integración con API. */
const handleRegister = async () => {
    if (!isRegisterFormValid()) {
        // Enfocamos el primer campo inválido para guiar al usuario
        if (regNameInput.value.trim().length < 2) regNameInput.focus();
        else if (!isValidEmail(regEmailInput.value)) regEmailInput.focus();
        else if (!validatePasswordSecurity(regPasswordInput.value).valid) regPasswordInput.focus();
        return;
    }

    clearMessage(registerBtn); // Limpiamos mensajes anteriores del botón

    const name = regNameInput.value;
    const email = regEmailInput.value;
    const password = regPasswordInput.value;

    displayMessage(registerBtn, '⌛ Registrando...', false);

    try {
        const res = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        clearMessage(registerBtn); // Limpiamos el mensaje de "Registrando..."

        if (res.ok) {
            alert("✅ Registro exitoso. ¡Ahora puedes iniciar sesión!");
            // Cambiar a la vista de login automáticamente
            toLoginLink.click();
        } else {
            displayMessage(registerBtn, `❌ Error: ${data.detail || "Usuario ya existe o error desconocido."}`, true);
        }
    } catch (error) {
        clearMessage(registerBtn);
        displayMessage(registerBtn, "🚨 Error de conexión con la API.", true);
    }
};

/** Función para validar todos los campos de Login antes de la llamada a la API. */
const isLoginFormValid = () => {
    let isValid = true;
    
    // 1. Email
    if (!isValidEmail(loginEmailInput.value)) {
        displayMessage(loginEmailInput, 'Formato de email incorrecto.', true);
        isValid = false;
    } else {
        clearMessage(loginEmailInput);
    }
    
    // 2. Contraseña (solo verificamos que no esté vacía o muy corta para la llamada)
    if (loginPasswordInput.value.length < 8) { 
        displayMessage(loginPasswordInput, 'Contraseña muy corta o vacía.', true);
        isValid = false;
    } else {
        clearMessage(loginPasswordInput);
    }

    return isValid;
};


/** Función de Login - Integración con API. */
const handleLogin = async () => {
    if (!isLoginFormValid()) {
        // Enfocamos el primer campo inválido
        if (!isValidEmail(loginEmailInput.value)) loginEmailInput.focus();
        else if (loginPasswordInput.value.length < 8) loginPasswordInput.focus();
        return;
    }

    clearMessage(loginBtn); // Limpiamos mensajes anteriores del botón

    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    displayMessage(loginBtn, '⌛ Iniciando sesión...', false);

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        clearMessage(loginBtn); // Limpiamos el mensaje de "Iniciando..."

        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("userName", data.name);
            alert(`🎉 Inicio de sesión exitoso. ¡Bienvenido, ${data.name}!`);
            window.location.href = "home.html";
        } else {
            // La API maneja la lógica de "email no existe" o "contraseña incorrecta"
            displayMessage(loginBtn, `❌ Error: ${data.detail || "Email o contraseña incorrectos."}`, true);
        }
    } catch (error) {
        clearMessage(loginBtn);
        displayMessage(loginBtn, "🚨 Error de conexión con la API.", true);
    }
};


// ------------------------------------------
// 🖱️ ASIGNACIÓN DE EVENTOS FINALES
// ------------------------------------------

// 1. Asignar las funciones a los botones (ahora son handlers)
loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);

// 2. Lógica para alternar formularios
toRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    // Opcional: Enfocar el primer input
    regNameInput.focus(); 
});

toLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    // Opcional: Enfocar el primer input
    loginEmailInput.focus();
});


// 3. Manejo de la tecla ENTER para ambos formularios

// Login: Si se presiona Enter, se intenta el login.
loginForm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        handleLogin();
    }
});

// Registro: Si se presiona Enter, se intenta el registro.
registerForm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleRegister();
    }
});

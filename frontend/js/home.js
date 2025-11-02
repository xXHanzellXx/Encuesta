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
                    // Usar un modal o mensaje en la UI en lugar de alert()
                    console.error("Sesión expirada o inválida.");
                    window.location.href = "index.html";
                }
            } catch (error) {
                console.error("Error al cargar datos del usuario:", error);
            }
        }

        // Obtener quizzes anteriores (FUNCIÓN ACTUALIZADA)
        async function loadResults() {
            const container = document.getElementById("pastResults");
            container.innerHTML = `<p class="text-center text-gray-500 p-8">Cargando resultados...</p>`; // Mensaje de carga

            try {
                const res = await fetch(`${API_URL}/api/quizzes`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const quizzes = await res.json();
                    
                    if (quizzes.length === 0) {
                        container.innerHTML = "<div class='bg-white p-8 rounded-xl shadow-md'><p class='text-center text-gray-600 font-medium'>Aún no tienes resultados guardados. ¡Realiza el quiz para empezar!</p></div>";
                    } else {
                        // --- LÓGICA DE RENDERING ACTUALIZADA ---
                        // 'q.softSkills' es una lista de objetos {skill: str, score: int}
                        const resultsListHTML = quizzes.map(q => {
                            // Formatear la fecha para que se vea bien
                            const date = new Date(q.date).toLocaleDateString('es-ES', { 
                                year: 'numeric', month: 'long', day: 'numeric' 
                            });

                            // Generar los badges de habilidades con sus puntajes
                            const skillsHTML = q.softSkills.map(s => `
                                <span class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800 shadow-sm">
                                    ${s.skill}: <strong>${s.score}%</strong>
                                </span>
                            `).join('');

                            return `
                                <li class="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 mb-4 border-l-4 border-indigo-500">
                                    <div class="flex justify-between items-start mb-3">
                                        <h4 class="text-2xl font-extrabold text-indigo-700">${q.profile}</h4>
                                        <span class="text-sm font-semibold text-gray-500 pt-1">Realizado el ${date}</span>
                                    </div>
                                    <p class="text-gray-700 mb-4 font-semibold">Tus habilidades clave:</p>
                                    <div class="flex flex-wrap gap-2">
                                        ${skillsHTML}
                                    </div>
                                </li>
                            `;
                        }).join("");
                        // --- FIN DE LÓGICA DE RENDERING ACTUALIZADA ---

                        container.innerHTML = `
                            <h2 class="text-3xl font-bold mb-6 text-gray-800">Tus Resultados Anteriores (${quizzes.length})</h2>
                            <ul class="space-y-4">
                                ${resultsListHTML}
                            </ul>
                        `;
                    }
                } else {
                    // Manejar error de API, posiblemente token inválido
                    if (res.status === 401) {
                        localStorage.clear();
                        container.innerHTML = "<p class='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg' role='alert'>Tu sesión ha expirado o es inválida. Redirigiendo al inicio de sesión...</p>";
                        setTimeout(() => window.location.href = "index.html", 2000);
                    } else {
                        container.innerHTML = "<p class='bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg' role='alert'>No se pudieron cargar los resultados. Intenta iniciar sesión de nuevo.</p>";
                    }
                }
            } catch (error) {
                console.error("Error de red al cargar resultados:", error);
                container.innerHTML = "<p class='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg' role='alert'>No se pudo conectar con el servidor para obtener los resultados.</p>";
            }
        }

        loadUser();
        loadResults();

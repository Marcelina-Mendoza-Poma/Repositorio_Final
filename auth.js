// --- CONEXIÓN CON SUPABASE ---
// (Son las mismas que usaste en app.js)
const supabaseUrl = 'https://zetgxfyafwyrxoynbarh.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldGd4ZnlhZnd5cnhveW5iYXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDQ3NDksImV4cCI6MjA3NTAyMDc0OX0.5GQyaPjVPRbidMwwKI_3kx8ejydSnOwLbgZbEx8WBjY';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- LÓGICA DE REGISTRO (SIGN UP) ---
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = signupForm.querySelector('[name="email"]').value;
        const password = signupForm.querySelector('[name="password"]').value;
        const formMsg = signupForm.querySelector('#form-msg');

        formMsg.textContent = "Registrando...";
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            formMsg.textContent = `Error: ${error.message}`;
            console.error(error);
        } else {
            formMsg.textContent = "¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.";
            signupForm.reset();
        }
    });
}

// --- LÓGICA DE INICIO DE SESIÓN (LOGIN) ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = loginForm.querySelector('[name="email"]').value;
        const password = loginForm.querySelector('[name="password"]').value;
        const formMsg = loginForm.querySelector('#form-msg');

        formMsg.textContent = "Iniciando sesión...";

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            formMsg.textContent = "Error: Email o contraseña incorrectos.";
            console.error(error);
        } else {
            // Si el login es exitoso, redirigimos al portafolio principal.
            window.location.href = 'index.html';
        }
    });
}
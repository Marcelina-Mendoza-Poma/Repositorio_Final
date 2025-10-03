// --- 1. CONEXIÓN CON SUPABASE ---
const supabaseUrl = 'https://zetgxfyafwyrxoynbarh.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldGd4ZnlhZnd5cnhveW5iYXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDQ3NDksImV4cCI6MjA3NTAyMDc0OX0.5GQyaPjVPRbidMwwKI_3kx8ejydSnOwLbgZbEx8WBjY';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. CÓDIGO PARA LA ANIMACIÓN DE "REVEAL ON SCROLL" ---
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
});

function setupRevealAnimation() {
  const revealElements = document.querySelectorAll('.reveal');
  revealElements.forEach(el => observer.observe(el));
}


// --- 3. CARGAR UNIDADES DESDE SUPABASE --- (SECCIÓN ACTUALIZADA)
const gridContainer = document.getElementById('projectsGrid'); // Seguimos usando el mismo div

async function cargarUnidades() {
  const { data, error } = await supabaseClient
    .from('unidades') // <-- CAMBIO: Ahora leemos de la tabla "unidades"
    .select('*')
    .order('id', { ascending: true }); // Ordenamos por ID para que aparezcan en orden

  if (error) {
    console.error('Error al cargar las unidades:', error);
    return;
  }
  
  gridContainer.innerHTML = data.map(unidad => `
    <div class="card">
      <h4>${unidad.titulo}</h4>
      <p>${unidad.descripcion}</p>
      <a class="btn btn--ghost" href="semanas.html?unidad=${unidad.id}">
        <i class="bi bi-folder2-open"></i> Ver Semanas
      </a>
    </div>
  `).join('');

  setupRevealAnimation();
}

// --- 4. ENVIAR FORMULARIO DE CONTACTO A SUPABASE ---
const contactForm = document.getElementById('contactForm');
// ... (El resto del código del formulario sigue igual) ...
// (Lo omito aquí para no hacer el bloque tan largo, no necesitas cambiarlo)
contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const nombre = formData.get('nombre');
  const email = formData.get('email');
  const mensaje = formData.get('mensaje');

  const formMsg = document.getElementById('formMsg');
  formMsg.textContent = 'Enviando...';
  
  try {
    const { error: insertError } = await supabaseClient
      .from('mensajes')
      .insert([ { nombre: nombre, email: email, mensaje: mensaje } ]);

    if (insertError) throw insertError;

    formMsg.textContent = '¡Mensaje enviado con éxito! Gracias.';
    contactForm.reset();

  } catch (error) {
    console.error('Error al enviar el mensaje:', error.message);
    formMsg.textContent = 'Hubo un error al enviar el mensaje.';
  }
});


// --- INICIO DE LA APLICACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
  cargarUnidades(); // <-- CAMBIO: Llamamos a la nueva función
  setupRevealAnimation();
});
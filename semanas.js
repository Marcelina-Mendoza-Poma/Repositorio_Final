// --- 1. CONEXIÓN CON SUPABASE ---
const supabaseUrl = 'https://zetgxfyafwyrxoynbarh.supabase.co'; // <-- TU URL CORRECTA
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldGd4ZnlhZnd5cnhveW5iYXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDQ3NDksImV4cCI6MjA3NTAyMDc0OX0.5GQyaPjVPRbidMwwKI_3kx8ejydSnOwLbgZbEx8WBjY'; // <-- TU LLAVE ANON CORRECTA
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. LÓGICA PARA MOSTRAR LAS SEMANAS ---
const unidadTituloEl = document.getElementById('unidad-titulo');
const semanasGridEl = document.getElementById('semanas-grid');

// Función para obtener el ID de la unidad desde la URL
function getUnidadId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('unidad'); // Obtiene el valor de "?unidad=X"
}

// Función principal para cargar y mostrar los datos
async function cargarSemanas() {
    const unidadId = getUnidadId();
    if (!unidadId) {
        unidadTituloEl.textContent = "Unidad no encontrada";
        return;
    }

    // Primero, obtenemos el título de la unidad
    const { data: unidadData, error: unidadError } = await supabaseClient
        .from('unidades')
        .select('titulo')
        .eq('id', unidadId)
        .single(); // .single() para obtener solo un resultado

    if (unidadError) {
        console.error('Error al cargar el título de la unidad:', unidadError);
        unidadTituloEl.textContent = "Error al cargar la unidad";
        return;
    }

    unidadTituloEl.textContent = `Semanas de la ${unidadData.titulo}`;

    // Segundo, obtenemos las semanas de esa unidad
    const { data: semanasData, error: semanasError } = await supabaseClient
        .from('semanas')
        .select('id, titulo, numero_semana') // Pedimos el ID de la semana
        .eq('unidad_id', unidadId) // Filtramos las semanas por el ID de la unidad
        .order('numero_semana', { ascending: true }); // Las ordenamos

    if (semanasError) {
        console.error('Error al cargar las semanas:', semanasError);
        semanasGridEl.innerHTML = "<p>No se pudieron cargar las semanas.</p>";
        return;
    }

    // Mostramos las semanas en la página
    semanasGridEl.innerHTML = semanasData.map(semana => `
        <div class="card">
            <h4>${semana.titulo}</h4>
            <p>Contenido de la semana ${semana.numero_semana}</p>
            <a class="btn btn--ghost" href="recursos.html?semana=${semana.id}">
                <i class="bi bi-eye"></i> Ver Recursos
            </a>
        </div>
    `).join('');
}

// --- INICIO DE LA APLICACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    cargarSemanas();
});
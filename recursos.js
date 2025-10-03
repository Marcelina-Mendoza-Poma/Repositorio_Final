// --- 1. CONEXIÓN CON SUPABASE ---
const supabaseUrl = 'https://zetgxfyafwyrxoynbarh.supabase.co'; 
// 🚨 PEGA TU LLAVE ANON PUBLIC MÁS RECIENTE AQUÍ 🚨
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldGd4ZnlhZnd5cnhveW5iYXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDQ3NDksImV4cCI6MjA3NTAyMDc0OX0.5GQyaPjVPRbidMwwKI_3kx8ejydSnOwLbgZbEx8WBjY'; 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// --- 2. ELEMENTOS HTML ---
const tituloSemanaEl = document.getElementById('semana-titulo');
const recursosListEl = document.getElementById('recursos-lista');
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('file-input');
const resourceNameInput = document.getElementById('resource-name');
const uploadStatusEl = document.getElementById('upload-status');
const currentWeekIdEl = document.getElementById('current-week-id');


// Función para obtener el ID de la semana desde la URL
function getSemanaId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('semana'); 
}


// --- 3. LÓGICA PARA CARGAR Y MOSTRAR RECURSOS (SELECT) ---

async function cargarRecursos() {
    const semanaId = getSemanaId();
    if (!semanaId) {
        tituloSemanaEl.textContent = "Semana no especificada.";
        return;
    }
    
    currentWeekIdEl.textContent = semanaId;

    // A. Obtener el título de la semana
    const { data: semanaData, error: semanaError } = await supabaseClient
        .from('semanas')
        .select('titulo')
        .eq('id', semanaId)
        .single();
    
    if (semanaError) {
        tituloSemanaEl.textContent = "Error al cargar la semana.";
        return;
    }
    tituloSemanaEl.textContent = `Recursos de ${semanaData.titulo}`;

    // B. Obtener los recursos asociados a esa semana
    const { data: recursosData, error: recursosError } = await supabaseClient
        .from('recursos')
        .select('id, titulo, url_archivo') 
        .eq('semana_id', semanaId); 

    if (recursosError) {
        console.error('Error al cargar los recursos:', recursosError);
        recursosListEl.innerHTML = "<li><p>Error al cargar los recursos.</p></li>";
        return;
    }

    if (recursosData.length === 0) {
        recursosListEl.innerHTML = "<li><p>No hay recursos disponibles para esta semana.</p></li>";
        return;
    }

    // C. Mostrar la lista de recursos con botón de Eliminar
    recursosListEl.innerHTML = recursosData.map(recurso => `
        <li>
            <a href="${recurso.url_archivo}" target="_blank" class="btn btn--primary" style="margin-right: 15px;">
                ${recurso.titulo} 
            </a>
            
            <button 
                data-recurso-id="${recurso.id}"
                data-recurso-url="${recurso.url_archivo}"
                class="btn btn--danger btn-delete-resource"
            >
                Eliminar
            </button>
        </li>
    `).join('');

    // Asigna los listeners a los nuevos botones
    agregarListenersEliminar();
} 


// --- 4. LÓGICA PARA SUBIR ARCHIVOS (INSERT Y UPLOAD) ---

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const semanaId = getSemanaId();
    const file = fileInput.files[0];
    const resourceName = resourceNameInput.value.trim();

    if (!file || !resourceName) {
        uploadStatusEl.textContent = "Por favor, selecciona un archivo y ponle un nombre.";
        return;
    }

    uploadStatusEl.textContent = "Subiendo archivo... (No cierres la ventana)";

    // 1. Subir el archivo a Supabase Storage
    const BUCKET_NAME = 'recursos'; 
    const fileExtension = file.name.split('.').pop();
    const uniqueName = `${semanaId}/${Date.now()}.${fileExtension}`; 
    
    const { data: storageData, error: storageError } = await supabaseClient.storage
        .from(BUCKET_NAME) 
        .upload(uniqueName, file);

    if (storageError) {
        console.error('Error al subir el archivo:', storageError);
        uploadStatusEl.textContent = `Error de subida: Bucket no encontrado o permisos incorrectos.`; 
        return;
    }

    // 2. Obtener la URL pública del archivo
    const { data: publicUrlData } = supabaseClient.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storageData.path);
    
    const publicUrl = publicUrlData.publicUrl;


    // 3. Registrar los metadatos en la tabla 'recursos'
    
    // Corregido: Convertir el ID a un número entero para la Foreign Key
    const numericSemanaId = parseInt(semanaId, 10); 

    const { error: dbError } = await supabaseClient
        .from('recursos')
        .insert({
            titulo: resourceName, 
            url_archivo: publicUrl, 
            semana_id: numericSemanaId, 
        });

    if (dbError) {
        console.error('Error al registrar en la DB:', dbError);
        uploadStatusEl.textContent = `Error al registrar en la DB: ${dbError.message}`;
        return;
    }

    // Éxito
    uploadStatusEl.textContent = `🎉 Archivo '${resourceName}' subido y registrado con éxito.`;
    fileInput.value = ''; 
    resourceNameInput.value = ''; 
    
    await cargarRecursos(); 
});


// --- 5. LÓGICA PARA ELIMINAR RECURSOS (DELETE) ---

// Función para manejar la eliminación total (Storage y DB)
async function eliminarRecurso(recursoId, recursoUrl) {
    if (!confirm("¿Estás seguro de que quieres eliminar este recurso y su archivo?")) {
        return; 
    }

    const BUCKET_NAME = 'recursos'; 
    
    // Extraemos la ruta del archivo para el Storage
    const pathSegment = `${BUCKET_NAME}/`;
    const pathIndex = recursoUrl.indexOf(pathSegment);
    
    if (pathIndex === -1) {
        alert("Error: No se pudo determinar la ruta del archivo en el Storage.");
        return;
    }
    
    const filePath = recursoUrl.substring(pathIndex + pathSegment.length);

    try {
        // 1. ELIMINAR el REGISTRO de la tabla 'recursos' (DB) primero
        const { error: dbError } = await supabaseClient
            .from('recursos')
            .delete()
            .eq('id', recursoId);

        if (dbError) throw dbError;
        
        // 2. ELIMINAR el ARCHIVO de Supabase Storage
        const { error: storageError } = await supabaseClient.storage
            .from(BUCKET_NAME)
            .remove([filePath]); 

        if (storageError && storageError.message !== 'The resource was not found') {
            throw storageError;
        }

        // Éxito
        alert("Recurso eliminado con éxito.");
        await cargarRecursos();

    } catch (error) {
        console.error('Error al eliminar el recurso:', error);
        alert(`Error al eliminar: ${error.message}`);
    }
}

// Función que asigna el listener a todos los nuevos botones "Eliminar"
function agregarListenersEliminar() {
    document.querySelectorAll('.btn-delete-resource').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-recurso-id');
            const url = button.getAttribute('data-recurso-url'); 
            eliminarRecurso(id, url); 
        });
    });
}


// --- INICIO DE LA APLICACIÓN ---
window.addEventListener('DOMContentLoaded', () => {
    cargarRecursos();
});
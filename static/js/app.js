/**
 * Explorador Chileno - JavaScript Principal
 * Maneja la interacción del usuario y comunicación con el backend
 */

// Estado de la aplicación
const state = {
    selectedType: 'insecto',
    selectedFile: null,
    isAnalyzing: false
};

// Elementos del DOM
const elements = {
    // Botones de tipo
    btnInsecto: document.getElementById('btn-insecto'),
    btnPlanta: document.getElementById('btn-planta'),
    
    // Upload
    uploadZone: document.getElementById('upload-zone'),
    uploadBtn: document.getElementById('upload-btn'),
    fileInput: document.getElementById('file-input'),
    
    // Preview
    previewContainer: document.getElementById('preview-container'),
    previewImage: document.getElementById('preview-image'),
    analyzeBtn: document.getElementById('analyze-btn'),
    
    // Loader
    loaderContainer: document.getElementById('loader-container'),
    
    // Error
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    errorRetryBtn: document.getElementById('error-retry-btn'),
    
    // Resultados
    resultContainer: document.getElementById('result-container'),
    resultIcon: document.getElementById('result-icon'),
    resultName: document.getElementById('result-name'),
    resultScientific: document.getElementById('result-scientific'),
    resultDescription: document.getElementById('result-description'),
    resultHabitat: document.getElementById('result-habitat'),
    resultCuriosity: document.getElementById('result-curiosity'),
    resultDanger: document.getElementById('result-danger'),
    resultPoints: document.getElementById('result-points'),
    newSearchBtn: document.getElementById('new-search-btn')
};

/**
 * Inicializa la aplicación
 */
function init() {
    setupTypeSelector();
    setupUploadZone();
    setupAnalyzeButton();
    setupNewSearchButtons();
}

/**
 * Configura el selector de tipo (insecto/planta)
 */
function setupTypeSelector() {
    elements.btnInsecto.addEventListener('click', () => selectType('insecto'));
    elements.btnPlanta.addEventListener('click', () => selectType('planta'));
}

/**
 * Selecciona el tipo de análisis
 */
function selectType(type) {
    state.selectedType = type;
    
    // Actualizar clases de botones
    elements.btnInsecto.classList.toggle('active', type === 'insecto');
    elements.btnPlanta.classList.toggle('active', type === 'planta');
    
    // Actualizar ícono del upload
    const uploadIcon = elements.uploadZone.querySelector('.upload-icon');
    uploadIcon.textContent = type === 'insecto' ? '🐛' : '🌿';
}

/**
 * Configura la zona de upload con drag & drop
 */
function setupUploadZone() {
    // Click en zona de upload
    elements.uploadZone.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    // Click en botón de upload
    elements.uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.fileInput.click();
    });
    
    // Cambio en input de archivo
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag & Drop
    elements.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.add('dragover');
    });
    
    elements.uploadZone.addEventListener('dragleave', () => {
        elements.uploadZone.classList.remove('dragover');
    });
    
    elements.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

/**
 * Maneja la selección de archivo
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

/**
 * Procesa el archivo seleccionado
 */
function handleFile(file) {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
        showError('¡Ups! Solo puedo analizar imágenes. Intenta con una foto.');
        return;
    }
    
    // Validar tamaño (máximo 16MB)
    if (file.size > 16 * 1024 * 1024) {
        showError('¡La imagen es muy grande! Intenta con una más pequeña (máximo 16MB).');
        return;
    }
    
    state.selectedFile = file;
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImage.src = e.target.result;
        showSection('preview');
    };
    reader.readAsDataURL(file);
}

/**
 * Configura el botón de analizar
 */
function setupAnalyzeButton() {
    elements.analyzeBtn.addEventListener('click', analyzeImage);
}

/**
 * Analiza la imagen con la API
 */
async function analyzeImage() {
    if (!state.selectedFile || state.isAnalyzing) return;
    
    state.isAnalyzing = true;
    showSection('loader');
    
    try {
        const formData = new FormData();
        formData.append('imagen', state.selectedFile);
        formData.append('tipo', state.selectedType);
        
        const response = await fetch('/analizar', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
        } else {
            showResults(data);
        }
    } catch (error) {
        console.error('Error al analizar:', error);
        showError('¡Ups! No pude conectar con el servidor. ¿Tienes internet?');
    } finally {
        state.isAnalyzing = false;
    }
}

/**
 * Muestra los resultados del análisis
 */
function showResults(data) {
    // Ícono según tipo
    elements.resultIcon.textContent = data.tipo === 'planta' ? '🌿' : '🐛';
    
    // Información básica
    elements.resultName.textContent = data.nombre || 'Espécimen desconocido';
    elements.resultScientific.textContent = data.cientifico || 'Nombre científico no disponible';
    elements.resultDescription.textContent = data.descripcion || 'Sin descripción disponible.';
    elements.resultHabitat.textContent = data.habitat || 'Información no disponible.';
    elements.resultCuriosity.textContent = data.dato_curioso || '¡Este espécimen es muy especial!';
    
    // Peligrosidad
    const peligrosidad = (data.peligrosidad || 'baja').toLowerCase();
    elements.resultDanger.className = `danger-indicator ${peligrosidad}`;
    
    let dangerIcon, dangerText;
    switch (peligrosidad) {
        case 'alta':
            dangerIcon = '🚨';
            dangerText = 'Peligrosidad Alta - ¡Ten cuidado!';
            break;
        case 'media':
            dangerIcon = '⚡';
            dangerText = 'Peligrosidad Media - Precaución';
            break;
        default:
            dangerIcon = '✅';
            dangerText = 'Peligrosidad Baja - ¡Es inofensivo!';
    }
    elements.resultDanger.innerHTML = `<span>${dangerIcon}</span><span>${dangerText}</span>`;
    
    // Puntos
    const puntos = parseInt(data.puntos) || 50;
    elements.resultPoints.textContent = puntos;
    
    // Animación de puntos
    animatePoints(puntos);
    
    showSection('result');
}

/**
 * Anima el contador de puntos
 */
function animatePoints(finalValue) {
    let current = 0;
    const increment = Math.ceil(finalValue / 30);
    const interval = setInterval(() => {
        current += increment;
        if (current >= finalValue) {
            current = finalValue;
            clearInterval(interval);
        }
        elements.resultPoints.textContent = current;
    }, 30);
}

/**
 * Configura los botones de nueva búsqueda
 */
function setupNewSearchButtons() {
    elements.newSearchBtn.addEventListener('click', resetSearch);
    elements.errorRetryBtn.addEventListener('click', resetSearch);
}

/**
 * Reinicia la búsqueda
 */
function resetSearch() {
    state.selectedFile = null;
    elements.fileInput.value = '';
    elements.previewImage.src = '';
    showSection('upload');
}

/**
 * Muestra un error
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    showSection('error');
}

/**
 * Muestra una sección específica y oculta las demás
 */
function showSection(section) {
    // Ocultar todas las secciones
    elements.uploadZone.style.display = 'block';
    elements.previewContainer.classList.remove('active');
    elements.loaderContainer.classList.remove('active');
    elements.errorContainer.classList.remove('active');
    elements.resultContainer.classList.remove('active');
    
    switch (section) {
        case 'upload':
            elements.uploadZone.style.display = 'block';
            break;
        case 'preview':
            elements.uploadZone.style.display = 'none';
            elements.previewContainer.classList.add('active');
            break;
        case 'loader':
            elements.uploadZone.style.display = 'none';
            elements.previewContainer.classList.remove('active');
            elements.loaderContainer.classList.add('active');
            break;
        case 'error':
            elements.uploadZone.style.display = 'none';
            elements.loaderContainer.classList.remove('active');
            elements.errorContainer.classList.add('active');
            break;
        case 'result':
            elements.uploadZone.style.display = 'none';
            elements.loaderContainer.classList.remove('active');
            elements.resultContainer.classList.add('active');
            break;
    }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

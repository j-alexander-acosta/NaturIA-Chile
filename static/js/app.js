/**
 * Explorador Chileno - JavaScript Principal
 * Maneja la interacción del usuario y comunicación con el backend
 */

// Estado de la aplicación
const state = {
    selectedType: 'insecto',
    selectedMode: 'foto',
    selectedFile: null,
    isAnalyzing: false,
    isListening: false,
    recognition: null
};

// Elementos del DOM
const elements = {
    // Botones de tipo
    btnInsecto: document.getElementById('btn-insecto'),
    btnPlanta: document.getElementById('btn-planta'),
    
    // Botones de modo
    modeFoto: document.getElementById('mode-foto'),
    modeBuscar: document.getElementById('mode-buscar'),
    
    // Upload
    uploadZone: document.getElementById('upload-zone'),
    uploadBtn: document.getElementById('upload-btn'),
    fileInput: document.getElementById('file-input'),
    
    // Búsqueda
    searchZone: document.getElementById('search-zone'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    voiceBtn: document.getElementById('voice-btn'),
    voiceIcon: document.getElementById('voice-icon'),
    voiceStatus: document.getElementById('voice-status'),
    
    // Preview
    previewContainer: document.getElementById('preview-container'),
    previewImage: document.getElementById('preview-image'),
    analyzeBtn: document.getElementById('analyze-btn'),
    
    // Loader
    loaderContainer: document.getElementById('loader-container'),
    loaderText: document.querySelector('.loader-text'),
    
    // Error
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    errorRetryBtn: document.getElementById('error-retry-btn'),
    
    // Resultados
    resultContainer: document.getElementById('result-container'),
    resultImageContainer: document.getElementById('result-image-container'),
    resultSpeciesImage: document.getElementById('result-species-image'),
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
    setupModeSelector();
    setupUploadZone();
    setupSearchZone();
    setupAnalyzeButton();
    setupNewSearchButtons();
    setupVoiceRecognition();
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
    if (uploadIcon) {
        uploadIcon.textContent = type === 'insecto' ? '🐛' : '🌿';
    }
    
    // Actualizar placeholder del input de búsqueda
    if (elements.searchInput) {
        elements.searchInput.placeholder = type === 'insecto' 
            ? 'Ej: Chinita, Abejorro, Madre de culebra...'
            : 'Ej: Copihue, Araucaria, Nalca...';
    }
}

/**
 * Configura el selector de modo (foto/buscar)
 */
function setupModeSelector() {
    elements.modeFoto.addEventListener('click', () => selectMode('foto'));
    elements.modeBuscar.addEventListener('click', () => selectMode('buscar'));
}

/**
 * Selecciona el modo de búsqueda
 */
function selectMode(mode) {
    state.selectedMode = mode;
    
    // Actualizar clases de botones
    elements.modeFoto.classList.toggle('active', mode === 'foto');
    elements.modeBuscar.classList.toggle('active', mode === 'buscar');
    
    // Mostrar/ocultar zonas según el modo
    if (mode === 'foto') {
        elements.uploadZone.style.display = 'block';
        elements.searchZone.style.display = 'none';
    } else {
        elements.uploadZone.style.display = 'none';
        elements.searchZone.style.display = 'block';
    }
    
    // Reiniciar estados
    resetSearch();
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
 * Configura la zona de búsqueda por texto
 */
function setupSearchZone() {
    // Botón de búsqueda
    elements.searchBtn.addEventListener('click', performTextSearch);
    
    // Enter en el input
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performTextSearch();
        }
    });
    
    // Botón de voz
    elements.voiceBtn.addEventListener('click', toggleVoiceRecognition);
}

/**
 * Configura el reconocimiento de voz
 */
function setupVoiceRecognition() {
    // Verificar soporte de Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        // No hay soporte, ocultar botón de voz
        if (elements.voiceBtn) {
            elements.voiceBtn.style.display = 'none';
        }
        return;
    }
    
    // Crear instancia de reconocimiento
    state.recognition = new SpeechRecognition();
    state.recognition.lang = 'es-CL'; // Español de Chile
    state.recognition.continuous = false;
    state.recognition.interimResults = true;
    
    // Eventos del reconocimiento
    state.recognition.onstart = () => {
        state.isListening = true;
        elements.voiceBtn.classList.add('listening');
        elements.voiceIcon.textContent = '🔴';
        elements.voiceStatus.textContent = '🎤 Escuchando... Habla ahora';
    };
    
    state.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
        
        elements.searchInput.value = transcript;
        
        // Si es resultado final, hacer la búsqueda
        if (event.results[0].isFinal) {
            elements.voiceStatus.textContent = `✅ Entendí: "${transcript}"`;
            setTimeout(() => {
                performTextSearch();
            }, 500);
        }
    };
    
    state.recognition.onerror = (event) => {
        console.error('Error de reconocimiento:', event.error);
        stopVoiceRecognition();
        
        let errorMsg = '❌ Error al escuchar';
        if (event.error === 'not-allowed') {
            errorMsg = '❌ Permiso de micrófono denegado';
        } else if (event.error === 'no-speech') {
            errorMsg = '🤔 No escuché nada. ¿Puedes repetir?';
        }
        elements.voiceStatus.textContent = errorMsg;
    };
    
    state.recognition.onend = () => {
        stopVoiceRecognition();
    };
}

/**
 * Inicia o detiene el reconocimiento de voz
 */
function toggleVoiceRecognition() {
    if (state.isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

/**
 * Inicia el reconocimiento de voz
 */
function startVoiceRecognition() {
    if (!state.recognition) {
        elements.voiceStatus.textContent = '❌ Tu navegador no soporta reconocimiento de voz';
        return;
    }
    
    try {
        state.recognition.start();
    } catch (error) {
        console.error('Error al iniciar reconocimiento:', error);
        elements.voiceStatus.textContent = '❌ Error al iniciar el micrófono';
    }
}

/**
 * Detiene el reconocimiento de voz
 */
function stopVoiceRecognition() {
    state.isListening = false;
    elements.voiceBtn.classList.remove('listening');
    elements.voiceIcon.textContent = '🎤';
    
    if (state.recognition) {
        try {
            state.recognition.stop();
        } catch (error) {
            // Ignorar errores al detener
        }
    }
}

/**
 * Realiza búsqueda por texto
 */
async function performTextSearch() {
    const query = elements.searchInput.value.trim();
    
    if (!query) {
        showError('¡Escribe o di el nombre de lo que quieres buscar!');
        return;
    }
    
    if (state.isAnalyzing) return;
    
    state.isAnalyzing = true;
    elements.loaderText.textContent = `🔍 Buscando información sobre "${query}"...`;
    showSection('loader');
    
    try {
        const response = await fetch('/buscar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                consulta: query,
                tipo: state.selectedType
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
        } else {
            showResults(data);
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        showError('¡Ups! No pude conectar con el servidor. ¿Tienes internet?');
    } finally {
        state.isAnalyzing = false;
    }
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
    elements.loaderText.textContent = '🔍 Analizando tu imagen con IA...';
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
    
    // Imagen de la especie (si está disponible)
    if (data.imagen_url && elements.resultImageContainer && elements.resultSpeciesImage) {
        elements.resultSpeciesImage.src = data.imagen_url;
        elements.resultSpeciesImage.alt = data.nombre || 'Imagen de la especie';
        elements.resultImageContainer.style.display = 'block';
        
        // Manejar error de carga de imagen
        elements.resultSpeciesImage.onerror = () => {
            elements.resultImageContainer.style.display = 'none';
        };
    } else {
        if (elements.resultImageContainer) {
            elements.resultImageContainer.style.display = 'none';
        }
    }
    
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
    elements.searchInput.value = '';
    elements.voiceStatus.textContent = '';
    
    if (state.selectedMode === 'foto') {
        showSection('upload');
    } else {
        showSection('search');
    }
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
    elements.uploadZone.style.display = 'none';
    elements.searchZone.style.display = 'none';
    elements.previewContainer.classList.remove('active');
    elements.loaderContainer.classList.remove('active');
    elements.errorContainer.classList.remove('active');
    elements.resultContainer.classList.remove('active');
    
    switch (section) {
        case 'upload':
            elements.uploadZone.style.display = 'block';
            break;
        case 'search':
            elements.searchZone.style.display = 'block';
            break;
        case 'preview':
            elements.previewContainer.classList.add('active');
            break;
        case 'loader':
            elements.loaderContainer.classList.add('active');
            break;
        case 'error':
            elements.errorContainer.classList.add('active');
            break;
        case 'result':
            elements.resultContainer.classList.add('active');
            break;
    }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

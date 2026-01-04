/**
 * NaturIA Chile - JavaScript Principal
 * Maneja la interacción del usuario, historial, tema oscuro, mapa y sonidos
 */

// ========================================
// ESTADO DE LA APLICACIÓN
// ========================================
const state = {
    selectedType: 'insecto',
    selectedMode: 'foto',
    selectedFile: null,
    isAnalyzing: false,
    isListening: false,
    recognition: null,
    darkMode: false,
    historyOpen: false,
    currentAudio: null,
    isPlaying: false,
    deferredPrompt: null // Para PWA install prompt
};

// ========================================
// ELEMENTOS DEL DOM
// ========================================
const elements = {
    // Tema
    themeToggle: document.getElementById('theme-toggle'),
    
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
    
    // Historial
    historySection: document.getElementById('history-section'),
    historyToggle: document.getElementById('history-toggle'),
    historyContainer: document.getElementById('history-container'),
    historyList: document.getElementById('history-list'),
    historyClearBtn: document.getElementById('history-clear-btn'),
    historyCount: document.getElementById('history-count'),
    
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
    newSearchBtn: document.getElementById('new-search-btn'),
    
    // Mapa
    mapSection: document.getElementById('map-section'),
    chileMap: document.getElementById('chile-map'),
    regionsTags: document.getElementById('regions-tags'),
    
    // Sonido
    soundSection: document.getElementById('sound-section'),
    soundPlayBtn: document.getElementById('sound-play-btn'),
    soundPlayIcon: document.getElementById('sound-play-icon'),
    soundName: document.getElementById('sound-name'),
    soundSource: document.getElementById('sound-source'),
    soundProgressBar: document.getElementById('sound-progress-bar'),
    speciesAudio: document.getElementById('species-audio'),
    
    // PWA
    pwaInstallBanner: document.getElementById('pwa-install-banner'),
    pwaInstallAccept: document.getElementById('pwa-install-accept'),
    pwaInstallDismiss: document.getElementById('pwa-install-dismiss')
};

// ========================================
// MAPA DE CHILE SVG
// ========================================
const CHILE_MAP_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 400" id="chile-svg-map">
  <path id="region-arica" data-region="Arica y Parinacota" d="M40,5 L60,5 L65,15 L55,20 L40,18 Z" class="region"/>
  <path id="region-tarapaca" data-region="Tarapacá" d="M40,18 L55,20 L60,35 L45,40 L38,30 Z" class="region"/>
  <path id="region-antofagasta" data-region="Antofagasta" d="M38,30 L45,40 L55,50 L60,70 L45,75 L35,60 Z" class="region"/>
  <path id="region-atacama" data-region="Atacama" d="M35,60 L45,75 L50,95 L40,100 L30,85 Z" class="region"/>
  <path id="region-coquimbo" data-region="Coquimbo" d="M30,85 L40,100 L45,120 L35,125 L25,110 Z" class="region"/>
  <path id="region-valparaiso" data-region="Valparaíso" d="M25,110 L35,125 L40,145 L30,150 L20,135 Z" class="region"/>
  <path id="region-metropolitana" data-region="Metropolitana" d="M35,125 L50,130 L55,150 L40,155 L30,145 Z" class="region"/>
  <path id="region-ohiggins" data-region="O'Higgins" d="M30,150 L40,155 L45,175 L35,180 L25,165 Z" class="region"/>
  <path id="region-maule" data-region="Maule" d="M25,165 L35,180 L40,200 L30,205 L20,190 Z" class="region"/>
  <path id="region-nuble" data-region="Ñuble" d="M30,205 L40,200 L50,215 L40,220 L30,212 Z" class="region"/>
  <path id="region-biobio" data-region="Biobío" d="M20,190 L30,212 L40,230 L30,240 L18,220 Z" class="region"/>
  <path id="region-araucania" data-region="La Araucanía" d="M18,220 L30,240 L35,260 L25,265 L15,250 Z" class="region"/>
  <path id="region-losrios" data-region="Los Ríos" d="M15,250 L25,265 L30,280 L22,285 L12,270 Z" class="region"/>
  <path id="region-loslagos" data-region="Los Lagos" d="M12,270 L22,285 L28,310 L18,320 L8,295 Z" class="region"/>
  <path id="region-aysen" data-region="Aysén" d="M8,295 L18,320 L25,355 L15,365 L5,335 Z" class="region"/>
  <path id="region-magallanes" data-region="Magallanes" d="M5,335 L15,365 L30,390 L50,395 L45,380 L20,365 L10,350 Z" class="region"/>
</svg>
`;

// Mapeo de nombres de regiones a IDs del SVG
const REGION_MAP = {
    "Arica y Parinacota": "region-arica",
    "Tarapacá": "region-tarapaca",
    "Antofagasta": "region-antofagasta",
    "Atacama": "region-atacama",
    "Coquimbo": "region-coquimbo",
    "Valparaíso": "region-valparaiso",
    "Metropolitana": "region-metropolitana",
    "O'Higgins": "region-ohiggins",
    "Maule": "region-maule",
    "Ñuble": "region-nuble",
    "Biobío": "region-biobio",
    "La Araucanía": "region-araucania",
    "Los Ríos": "region-losrios",
    "Los Lagos": "region-loslagos",
    "Aysén": "region-aysen",
    "Magallanes": "region-magallanes"
};

// ========================================
// INICIALIZACIÓN
// ========================================
function init() {
    setupThemeToggle();
    setupTypeSelector();
    setupModeSelector();
    setupUploadZone();
    setupSearchZone();
    setupAnalyzeButton();
    setupNewSearchButtons();
    setupVoiceRecognition();
    setupHistory();
    setupSoundPlayer();
    setupPWA();
    loadHistory();
    
    // Insertar mapa SVG
    if (elements.chileMap) {
        elements.chileMap.innerHTML = CHILE_MAP_SVG;
    }
}

// ========================================
// MODO OSCURO / CLARO
// ========================================
function setupThemeToggle() {
    // Cargar preferencia guardada
    const savedTheme = localStorage.getItem('naturia-theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    }
    
    // También respetar preferencia del sistema
    if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        enableDarkMode();
    }
    
    // Click en toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    if (state.darkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function enableDarkMode() {
    state.darkMode = true;
    document.documentElement.classList.add('dark-theme');
    localStorage.setItem('naturia-theme', 'dark');
}

function disableDarkMode() {
    state.darkMode = false;
    document.documentElement.classList.remove('dark-theme');
    localStorage.setItem('naturia-theme', 'light');
}

// ========================================
// SELECTOR DE TIPO
// ========================================
function setupTypeSelector() {
    elements.btnInsecto.addEventListener('click', () => selectType('insecto'));
    elements.btnPlanta.addEventListener('click', () => selectType('planta'));
}

function selectType(type) {
    state.selectedType = type;
    
    elements.btnInsecto.classList.toggle('active', type === 'insecto');
    elements.btnPlanta.classList.toggle('active', type === 'planta');
    
    const uploadIcon = elements.uploadZone.querySelector('.upload-icon');
    if (uploadIcon) {
        uploadIcon.textContent = type === 'insecto' ? '🐛' : '🌿';
    }
    
    if (elements.searchInput) {
        elements.searchInput.placeholder = type === 'insecto' 
            ? 'Ej: Chinita, Abejorro, Madre de culebra...'
            : 'Ej: Copihue, Araucaria, Nalca...';
    }
}

// ========================================
// SELECTOR DE MODO
// ========================================
function setupModeSelector() {
    elements.modeFoto.addEventListener('click', () => selectMode('foto'));
    elements.modeBuscar.addEventListener('click', () => selectMode('buscar'));
}

function selectMode(mode) {
    state.selectedMode = mode;
    
    elements.modeFoto.classList.toggle('active', mode === 'foto');
    elements.modeBuscar.classList.toggle('active', mode === 'buscar');
    
    if (mode === 'foto') {
        elements.uploadZone.style.display = 'block';
        elements.searchZone.style.display = 'none';
    } else {
        elements.uploadZone.style.display = 'none';
        elements.searchZone.style.display = 'block';
    }
    
    resetSearch();
}

// ========================================
// ZONA DE UPLOAD
// ========================================
function setupUploadZone() {
    elements.uploadZone.addEventListener('click', () => {
        elements.fileInput.click();
    });
    
    elements.uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.fileInput.click();
    });
    
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

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('¡Ups! Solo puedo analizar imágenes. Intenta con una foto.');
        return;
    }
    
    if (file.size > 16 * 1024 * 1024) {
        showError('¡La imagen es muy grande! Intenta con una más pequeña (máximo 16MB).');
        return;
    }
    
    state.selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImage.src = e.target.result;
        showSection('preview');
    };
    reader.readAsDataURL(file);
}

// ========================================
// ZONA DE BÚSQUEDA
// ========================================
function setupSearchZone() {
    elements.searchBtn.addEventListener('click', performTextSearch);
    
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performTextSearch();
        }
    });
    
    elements.voiceBtn.addEventListener('click', toggleVoiceRecognition);
}

// ========================================
// RECONOCIMIENTO DE VOZ
// ========================================
function setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        if (elements.voiceBtn) {
            elements.voiceBtn.style.display = 'none';
        }
        return;
    }
    
    state.recognition = new SpeechRecognition();
    state.recognition.lang = 'es-CL';
    state.recognition.continuous = false;
    state.recognition.interimResults = true;
    
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

function toggleVoiceRecognition() {
    if (state.isListening) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

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

// ========================================
// BÚSQUEDA POR TEXTO
// ========================================
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
            saveToHistory(data);
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        showError('¡Ups! No pude conectar con el servidor. ¿Tienes internet?');
    } finally {
        state.isAnalyzing = false;
    }
}

// ========================================
// ANÁLISIS DE IMAGEN
// ========================================
function setupAnalyzeButton() {
    elements.analyzeBtn.addEventListener('click', analyzeImage);
}

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
            saveToHistory(data);
        }
    } catch (error) {
        console.error('Error al analizar:', error);
        showError('¡Ups! No pude conectar con el servidor. ¿Tienes internet?');
    } finally {
        state.isAnalyzing = false;
    }
}

// ========================================
// MOSTRAR RESULTADOS
// ========================================
function showResults(data) {
    // Ícono según tipo
    elements.resultIcon.textContent = data.tipo === 'planta' ? '🌿' : '🐛';
    
    // Imagen de la especie
    if (data.imagen_url && elements.resultImageContainer && elements.resultSpeciesImage) {
        elements.resultSpeciesImage.src = data.imagen_url;
        elements.resultSpeciesImage.alt = data.nombre || 'Imagen de la especie';
        elements.resultImageContainer.style.display = 'block';
        
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
    animatePoints(puntos);
    
    // Mapa de distribución
    showDistributionMap(data.regiones || extractRegionsFromHabitat(data.habitat));
    
    // Reproductor de sonido
    showSoundPlayer(data);
    
    showSection('result');
}

// Extraer regiones del texto del hábitat
function extractRegionsFromHabitat(habitat) {
    if (!habitat) return [];
    
    const regiones = [];
    const regionNames = Object.keys(REGION_MAP);
    
    regionNames.forEach(region => {
        if (habitat.toLowerCase().includes(region.toLowerCase())) {
            regiones.push(region);
        }
    });
    
    // Si menciona "todo Chile", agregar todas las regiones
    if (habitat.toLowerCase().includes('todo chile') || 
        habitat.toLowerCase().includes('todo el país')) {
        return regionNames;
    }
    
    // Si menciona "sur de Chile"
    if (habitat.toLowerCase().includes('sur de chile')) {
        return ["Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"];
    }
    
    // Si menciona "norte de Chile"
    if (habitat.toLowerCase().includes('norte de chile')) {
        return ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo"];
    }
    
    // Si menciona "Chile central"
    if (habitat.toLowerCase().includes('chile central') || 
        habitat.toLowerCase().includes('zona central')) {
        return ["Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble"];
    }
    
    return regiones;
}

// ========================================
// MAPA DE DISTRIBUCIÓN
// ========================================
function showDistributionMap(regiones) {
    if (!elements.mapSection || !elements.chileMap || !elements.regionsTags) return;
    
    if (!regiones || regiones.length === 0) {
        elements.mapSection.style.display = 'none';
        return;
    }
    
    elements.mapSection.style.display = 'block';
    
    // Limpiar estados anteriores
    const allPaths = elements.chileMap.querySelectorAll('path');
    allPaths.forEach(path => {
        path.classList.remove('region-active');
    });
    
    // Activar regiones
    regiones.forEach(region => {
        const regionId = REGION_MAP[region];
        if (regionId) {
            const path = elements.chileMap.querySelector(`#${regionId}`);
            if (path) {
                path.classList.add('region-active');
            }
        }
    });
    
    // Mostrar tags de regiones
    elements.regionsTags.innerHTML = regiones.map(region => 
        `<span class="region-tag">${region}</span>`
    ).join('');
}

// ========================================
// REPRODUCTOR DE SONIDO
// ========================================
function setupSoundPlayer() {
    if (!elements.soundPlayBtn || !elements.speciesAudio) return;
    
    elements.soundPlayBtn.addEventListener('click', toggleSound);
    
    elements.speciesAudio.addEventListener('timeupdate', () => {
        if (elements.speciesAudio.duration) {
            const progress = (elements.speciesAudio.currentTime / elements.speciesAudio.duration) * 100;
            elements.soundProgressBar.style.width = `${progress}%`;
        }
    });
    
    elements.speciesAudio.addEventListener('ended', () => {
        stopSound();
    });
    
    elements.speciesAudio.addEventListener('error', (e) => {
        console.error('Error de audio:', e);
        stopSound();
        if (elements.soundSource) {
            elements.soundSource.textContent = '❌ Error al cargar el audio. Intenta de nuevo.';
            elements.soundSource.style.color = 'var(--error-color, #e74c3c)';
        }
    });
}

async function showSoundPlayer(data) {
    if (!elements.soundSection) return;
    
    // Ocultar inicialmente mientras buscamos
    elements.soundSection.style.display = 'none';
    
    // Las plantas no tienen sonido
    if (data.tipo === 'planta') {
        return;
    }
    
    // Si ya tiene URL de sonido, usarla directamente
    if (data.sonido_url) {
        displaySoundPlayer(data.sonido_url, data.nombre, 'Archivo local');
        return;
    }
    
    // Buscar sonido en la API
    try {
        const response = await fetch('/sonido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: data.nombre || '',
                cientifico: data.cientifico || '',
                tipo: data.tipo || 'insecto'
            })
        });
        
        const result = await response.json();
        
        if (result.encontrado && result.sonido) {
            const sonido = result.sonido;
            displaySoundPlayer(
                sonido.url, 
                data.nombre, 
                `${sonido.fuente} • ${sonido.tipo_sonido || 'canto'}`,
                sonido
            );
        }
    } catch (error) {
        console.log('No se pudo buscar sonido:', error);
        // Silenciosamente fallar - no mostrar la sección de sonido
    }
}

function displaySoundPlayer(url, nombre, fuente, metadata = null) {
    if (!url || !elements.soundSection) return;
    
    elements.soundSection.style.display = 'block';
    elements.soundName.textContent = `Sonido de ${nombre || 'la especie'}`;
    
    // Mostrar información de la fuente
    if (elements.soundSource) {
        let sourceText = `Fuente: ${fuente}`;
        if (metadata) {
            if (metadata.calidad) {
                sourceText += ` • Calidad: ${metadata.calidad}`;
            }
            if (metadata.ubicacion && metadata.ubicacion !== 'Desconocido') {
                sourceText += ` • ${metadata.ubicacion}`;
            }
        }
        elements.soundSource.textContent = sourceText;
    }
    
    // Configurar el audio
    elements.speciesAudio.src = url;
    
    // Agregar atributo crossorigin para URLs externas
    if (url.startsWith('http')) {
        elements.speciesAudio.crossOrigin = 'anonymous';
    }
    
    // Reset del estado
    stopSound();
}


function toggleSound() {
    if (state.isPlaying) {
        stopSound();
    } else {
        playSound();
    }
}

function playSound() {
    if (!elements.speciesAudio.src) return;
    
    elements.speciesAudio.play();
    state.isPlaying = true;
    elements.soundPlayBtn.classList.add('playing');
    elements.soundPlayIcon.textContent = '⏸️';
}

function stopSound() {
    elements.speciesAudio.pause();
    elements.speciesAudio.currentTime = 0;
    state.isPlaying = false;
    elements.soundPlayBtn.classList.remove('playing');
    elements.soundPlayIcon.textContent = '▶️';
    elements.soundProgressBar.style.width = '0%';
}

// ========================================
// HISTORIAL
// ========================================
function setupHistory() {
    if (!elements.historyToggle || !elements.historyContainer) return;
    
    elements.historyToggle.addEventListener('click', toggleHistory);
    
    if (elements.historyClearBtn) {
        elements.historyClearBtn.addEventListener('click', clearHistory);
    }
}

function toggleHistory() {
    state.historyOpen = !state.historyOpen;
    elements.historyToggle.classList.toggle('active', state.historyOpen);
    elements.historyContainer.classList.toggle('active', state.historyOpen);
}

function loadHistory() {
    const history = getHistory();
    renderHistory(history);
}

function getHistory() {
    try {
        const data = localStorage.getItem('naturia-history');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error cargando historial:', e);
        return [];
    }
}

function saveToHistory(data) {
    try {
        const history = getHistory();
        
        // Crear entrada de historial
        const entry = {
            id: Date.now(),
            nombre: data.nombre,
            cientifico: data.cientifico,
            tipo: data.tipo,
            imagen_url: data.imagen_url,
            fecha: new Date().toISOString(),
            data: data // Guardar datos completos para poder ver detalles
        };
        
        // Evitar duplicados recientes
        const isDuplicate = history.some(h => 
            h.nombre === entry.nombre && 
            h.cientifico === entry.cientifico
        );
        
        if (!isDuplicate) {
            // Agregar al inicio
            history.unshift(entry);
            
            // Limitar a 20 entradas
            if (history.length > 20) {
                history.pop();
            }
            
            localStorage.setItem('naturia-history', JSON.stringify(history));
            renderHistory(history);
        }
    } catch (e) {
        console.error('Error guardando en historial:', e);
    }
}

// Generar placeholder SVG seguro para historial
function getPlaceholderSvg(tipo) {
    const emoji = tipo === 'planta' ? '🌿' : '🐞';
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#2E8B57"/><text x="50" y="60" font-size="40" text-anchor="middle" fill="white">${emoji}</text></svg>`)}`;
}

function renderHistory(history) {
    if (!elements.historyList || !elements.historyCount) return;
    
    // Actualizar contador
    elements.historyCount.textContent = history.length > 0 ? `(${history.length})` : '';
    
    if (history.length === 0) {
        elements.historyList.innerHTML = `
            <div class="history-empty">
                <div class="history-empty-icon">📭</div>
                <p>Aún no has buscado ninguna especie.<br>¡Tu primera búsqueda aparecerá aquí!</p>
            </div>
        `;
        return;
    }
    
    const defaultPlaceholder = getPlaceholderSvg('insecto');
    
    elements.historyList.innerHTML = history.map(entry => {
        const placeholder = getPlaceholderSvg(entry.tipo);
        const imageSrc = entry.imagen_url || placeholder;
        
        return `
            <div class="history-item" data-id="${entry.id}">
                <img class="history-item-image" 
                     src="${imageSrc}"
                     alt="${entry.nombre}"
                     onerror="this.src='${defaultPlaceholder}'">
                <div class="history-item-info">
                    <div class="history-item-name">${entry.nombre}</div>
                    <div class="history-item-scientific">${entry.cientifico || ''}</div>
                    <div class="history-item-date">${formatDate(entry.fecha)}</div>
                </div>
                <div class="history-item-type">${entry.tipo === 'planta' ? '🌿' : '🐛'}</div>
            </div>
        `;
    }).join('');
    
    // Agregar eventos click
    elements.historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const entry = history.find(h => h.id === id);
            if (entry && entry.data) {
                showResults(entry.data);
                toggleHistory(); // Cerrar historial
            }
        });
    });
}

function formatDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now - date;
    
    // Menos de 1 minuto
    if (diff < 60000) return 'Hace un momento';
    
    // Menos de 1 hora
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `Hace ${mins} minuto${mins > 1 ? 's' : ''}`;
    }
    
    // Menos de 24 horas
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    }
    
    // Más de 24 horas
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

function clearHistory() {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
        localStorage.removeItem('naturia-history');
        renderHistory([]);
    }
}

// ========================================
// PWA
// ========================================
function setupPWA() {
    // Capturar evento de instalación
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.deferredPrompt = e;
        
        // Mostrar banner después de un poco de uso
        setTimeout(() => {
            showPWABanner();
        }, 30000); // Después de 30 segundos
    });
    
    // Botones del banner
    if (elements.pwaInstallAccept) {
        elements.pwaInstallAccept.addEventListener('click', installPWA);
    }
    
    if (elements.pwaInstallDismiss) {
        elements.pwaInstallDismiss.addEventListener('click', dismissPWABanner);
    }
}

function showPWABanner() {
    if (!state.deferredPrompt || !elements.pwaInstallBanner) return;
    
    // No mostrar si ya se descartó recientemente
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed) {
        const dismissedDate = new Date(dismissed);
        const now = new Date();
        // No mostrar por 7 días después de descartado
        if (now - dismissedDate < 7 * 24 * 60 * 60 * 1000) return;
    }
    
    elements.pwaInstallBanner.classList.add('show');
}

async function installPWA() {
    if (!state.deferredPrompt) return;
    
    state.deferredPrompt.prompt();
    const { outcome } = await state.deferredPrompt.userChoice;
    
    console.log(`PWA instalación: ${outcome}`);
    state.deferredPrompt = null;
    elements.pwaInstallBanner.classList.remove('show');
}

function dismissPWABanner() {
    elements.pwaInstallBanner.classList.remove('show');
    localStorage.setItem('pwa-dismissed', new Date().toISOString());
}

// ========================================
// ANIMACIÓN DE PUNTOS
// ========================================
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

// ========================================
// BOTONES DE NUEVA BÚSQUEDA
// ========================================
function setupNewSearchButtons() {
    elements.newSearchBtn.addEventListener('click', resetSearch);
    elements.errorRetryBtn.addEventListener('click', resetSearch);
}

function resetSearch() {
    state.selectedFile = null;
    elements.fileInput.value = '';
    elements.previewImage.src = '';
    elements.searchInput.value = '';
    elements.voiceStatus.textContent = '';
    
    // Detener audio si está reproduciendo
    if (state.isPlaying) {
        stopSound();
    }
    
    if (state.selectedMode === 'foto') {
        showSection('upload');
    } else {
        showSection('search');
    }
}

// ========================================
// MANEJO DE ERRORES Y SECCIONES
// ========================================
function showError(message) {
    elements.errorMessage.textContent = message;
    showSection('error');
}

function showSection(section) {
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

// ========================================
// INICIAR APLICACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', init);

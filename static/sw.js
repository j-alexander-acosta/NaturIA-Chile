/**
 * Service Worker para NaturIA Chile
 * Permite funcionalidad offline y caché de recursos
 */

const CACHE_NAME = 'naturia-chile-v1';
const OFFLINE_URL = '/offline.html';

// Recursos a cachear
const STATIC_CACHE = [
    '/',
    '/static/css/styles.css',
    '/static/js/app.js',
    '/static/manifest.json',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap'
];

// Instalar el service worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker instalándose...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cacheando recursos estáticos');
                return cache.addAll(STATIC_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activar el service worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activado');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Estrategia de caché: Network First con fallback a caché
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Para solicitudes de API (analizar, buscar), intentar red primero
    if (url.pathname.includes('/analizar') || url.pathname.includes('/buscar')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cachear la respuesta exitosa
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            // No cachear respuestas de API por más de una sesión
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Si no hay conexión, devolver error amigable
                    return new Response(
                        JSON.stringify({
                            error: '📵 Sin conexión. Por favor, verifica tu internet e intenta de nuevo.',
                            offline: true
                        }),
                        {
                            status: 503,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
        return;
    }
    
    // Para recursos estáticos, usar caché primero
    if (request.destination === 'style' || 
        request.destination === 'script' || 
        request.destination === 'image' ||
        request.destination === 'font') {
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(request).then((response) => {
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    });
                })
        );
        return;
    }
    
    // Para navegación, red primero con fallback a caché
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cachear página principal
                    if (response.ok && url.pathname === '/') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Si no hay página cacheada, mostrar mensaje offline
                            return new Response(
                                `<!DOCTYPE html>
                                <html lang="es">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>Sin conexión - NaturIA Chile</title>
                                    <style>
                                        body {
                                            font-family: 'Nunito', sans-serif;
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                            justify-content: center;
                                            min-height: 100vh;
                                            margin: 0;
                                            background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
                                            text-align: center;
                                            padding: 20px;
                                        }
                                        .icon { font-size: 4rem; margin-bottom: 20px; }
                                        h1 { color: #2E8B57; margin-bottom: 10px; }
                                        p { color: #4A4A6A; margin-bottom: 20px; }
                                        button {
                                            padding: 15px 30px;
                                            background: #2E8B57;
                                            color: white;
                                            border: none;
                                            border-radius: 25px;
                                            font-size: 1.1rem;
                                            cursor: pointer;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="icon">📵</div>
                                    <h1>Sin conexión</h1>
                                    <p>Parece que no tienes conexión a internet.<br>Conéctate y vuelve a intentar.</p>
                                    <button onclick="location.reload()">🔄 Reintentar</button>
                                </body>
                                </html>`,
                                {
                                    status: 200,
                                    headers: { 'Content-Type': 'text/html' }
                                }
                            );
                        });
                })
        );
        return;
    }
    
    // Para todo lo demás, intentar red y luego caché
    event.respondWith(
        fetch(request)
            .catch(() => caches.match(request))
    );
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

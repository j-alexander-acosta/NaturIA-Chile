"""
NaturIA Chile - Búsqueda de sonidos de especies
Integración con Xeno-Canto API para sonidos de aves
"""

import requests
import urllib.parse

# Base URL de la API de Xeno-Canto (v3 requiere API Key, v2 está descontinuada)
XENO_CANTO_API = "https://xeno-canto.org/api/3/recordings"

# Endpoint de Wikimedia Commons para búsqueda de archivos
WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"

# Headers para las peticiones (Wikimedia requiere User-Agent)
HEADERS = {
    'User-Agent': 'NaturIA-Chile/1.0 (https://github.com/j-alexander-acosta/explorador-chileno; alexander@example.com)'
}

# Mapeo de nombres comunes a nombres científicos para aves chilenas
AVES_CHILE = {
    # Aves comunes
    "chincol": "Zonotrichia capensis",
    "chincolito": "Zonotrichia capensis",
    "gorrión": "Zonotrichia capensis",
    "jilguero": "Spinus barbatus",
    "jote cabeza negra": "Coragyps atratus",
    "jote": "Coragyps atratus",
    "chuncho": "Glaucidium nana",
    "lechuza": "Tyto alba",
    "cóndor": "Vultur gryphus",
    "condor": "Vultur gryphus",
    "cóndor andino": "Vultur gryphus",
    "picaflor": "Sephanoides sephaniodes",
    "picaflor chico": "Sephanoides sephaniodes",
    "colibrí": "Sephanoides sephaniodes",
    "loica": "Leistes loyca",
    "zorzal": "Turdus falcklandii",
    "zorzal patagónico": "Turdus falcklandii",
    "tordo": "Curaeus curaeus",
    "mirlo": "Curaeus curaeus",
    "loro tricahue": "Cyanoliseus patagonus",
    "tricahue": "Cyanoliseus patagonus",
    "catita": "Myiopsitta monachus",
    "choroy": "Enicognathus leptorhynchus",
    "diuca": "Diuca diuca",
    "diuca común": "Diuca diuca",
    "queltehue": "Vanellus chilensis",
    "treile": "Vanellus chilensis",
    "tero": "Vanellus chilensis",
    "traile": "Vanellus chilensis",
    "tiuque": "Phalcoboenus chimango",
    "chimango": "Phalcoboenus chimango",
    "carancho": "Phalcoboenus chimango",
    "aguilucho": "Geranoaetus polyosoma",
    "ñandú": "Rhea pennata",
    "suri": "Rhea pennata",
    "carpintero": "Colaptes pitius",
    "pitío": "Colaptes pitius",
    "fío fío": "Elaenia albiceps",
    "fiofio": "Elaenia albiceps",
    "perdiz": "Nothoprocta perdicaria",
    "perdiz chilena": "Nothoprocta perdicaria",
    "codorniz": "Callipepla californica",
    "huairavo": "Nycticorax nycticorax",
    "garza": "Ardea alba",
    "garza blanca": "Ardea alba",
    "garza chica": "Egretta thula",
    "bandurria": "Theristicus melanopis",
    "flamenco": "Phoenicopterus chilensis",
    "flamenco chileno": "Phoenicopterus chilensis",
    "pelícano": "Pelecanus thagus",
    "piquero": "Sula variegata",
    "cormorán": "Phalacrocorax brasilianus",
    "pingüino": "Spheniscus humboldti",
    "pingüino de humboldt": "Spheniscus humboldti",
    "pingüino magallánico": "Spheniscus magellanicus",
    # Aves marinas
    "gaviota": "Larus dominicanus",
    "gaviota dominicana": "Larus dominicanus",
    "pilpilén": "Haematopus palliatus",
    "zarapito": "Numenius phaeopus",
    "playero": "Calidris alba",
    # Búhos
    "tucúquere": "Bubo magellanicus",
    "pequén": "Athene cunicularia",
    "nuco": "Asio flammeus",
    # Rapaces
    "águila": "Geranoaetus melanoleucus",
    "águila mora": "Geranoaetus melanoleucus",
    "halcón peregrino": "Falco peregrinus",
    "cernícalo": "Falco sparverius",
}

# Sonidos de insectos (archivos locales, ya que no hay API pública)
SONIDOS_INSECTOS = {
    "grillo": "grillo.mp3",
    "cigarra": "cigarra.mp3",
    "chicharra": "cigarra.mp3",
    "abeja": "abeja.mp3",
    "abejorro": "abejorro.mp3",
}


def buscar_sonido_ave(nombre_especie, nombre_cientifico=None):
    """
    Busca un sonido de ave en la API de Xeno-Canto.
    
    Args:
        nombre_especie: Nombre común del ave
        nombre_cientifico: Nombre científico (opcional)
    
    Returns:
        dict con información del sonido o None si no se encuentra
    """
    try:
        # Determinar el nombre científico
        cientifico = nombre_cientifico
        
        # Si no tenemos nombre científico, buscarlo en el mapeo
        if not cientifico:
            nombre_lower = nombre_especie.lower().strip()
            cientifico = AVES_CHILE.get(nombre_lower)
            
            # Buscar coincidencia parcial
            if not cientifico:
                for nombre, sci in AVES_CHILE.items():
                    if nombre in nombre_lower or nombre_lower in nombre:
                        cientifico = sci
                        break
        
        # Si aún no tenemos, usar el nombre común directamente
        query = cientifico if cientifico else nombre_especie
        
        # Preparar la consulta - agregar "cnt:chile" para filtrar por Chile
        query_encoded = urllib.parse.quote(f"{query} cnt:chile")
        url = f"{XENO_CANTO_API}?query={query_encoded}"
        
        # Hacer la petición
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Verificar si hay resultados
        if data.get('numRecordings', '0') == '0' or not data.get('recordings'):
            # Intentar sin filtro de país
            query_encoded = urllib.parse.quote(query)
            url = f"{XENO_CANTO_API}?query={query_encoded}"
            response = requests.get(url, headers=HEADERS, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('numRecordings', '0') == '0' or not data.get('recordings'):
                return None
        
        # Obtener el primer resultado de buena calidad
        recordings = data.get('recordings', [])
        
        # Ordenar por calidad (A es mejor que E)
        quality_order = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4}
        recordings.sort(key=lambda x: quality_order.get(x.get('q', 'E'), 5))
        
        # Tomar el mejor resultado
        recording = recordings[0]
        
        # Construir la URL del archivo de audio
        # Xeno-Canto provee URLs en formato: //xeno-canto.org/sounds/uploaded/...
        file_url = recording.get('file')
        if file_url and not file_url.startswith('http'):
            file_url = 'https:' + file_url
        
        return {
            'url': file_url,
            'nombre': recording.get('en', nombre_especie),  # Nombre en inglés
            'nombre_cientifico': recording.get('gen', '') + ' ' + recording.get('sp', ''),
            'tipo_sonido': recording.get('type', 'canto'),
            'ubicacion': recording.get('loc', 'Desconocido'),
            'grabador': recording.get('rec', 'Desconocido'),
            'calidad': recording.get('q', 'C'),
            'duracion': recording.get('length', ''),
            'licencia': recording.get('lic', 'CC BY-NC-SA 4.0'),
            'xeno_canto_id': recording.get('id', ''),
            'fuente': 'Xeno-Canto'
        }
        
    except requests.exceptions.RequestException as e:
        print(f"Error buscando sonido en Xeno-Canto: {e}")
        return buscar_en_wikimedia(cientifico if cientifico else nombre_especie)
    except Exception as e:
        print(f"Error procesando respuesta de Xeno-Canto: {e}")
        return buscar_en_wikimedia(cientifico if cientifico else nombre_especie)


def buscar_en_wikimedia(query):
    """
    Busca un archivo de audio en Wikimedia Commons como fallback.
    """
    try:
        print(f"Buscando fallback en Wikimedia para: {query}")
        
        # Intentar varias combinaciones de búsqueda
        search_queries = [
            f"{query} audio",
            f"{query} sound",
            query
        ]
        
        search_results = []
        for q in search_queries:
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": q,
                "srnamespace": 6,  # Solo espacio de nombres de archivos
                "srlimit": 5
            }
            
            response = requests.get(WIKIMEDIA_API, params=params, headers=HEADERS, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            results = data.get("query", {}).get("search", [])
            # Filtrar por extensiones de audio comunes
            for res in results:
                title = res.get("title", "").lower()
                if any(ext in title for ext in ['.mp3', '.ogg', '.wav', '.flac']):
                    search_results.append(res)
            
            if search_results:
                break
            
        if not search_results:
            return None
            
        file_title = search_results[0].get("title")
        if not file_title:
            return None
            
        # Obtener la URL real del archivo
        params_file = {
            "action": "query",
            "format": "json",
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "titles": file_title
        }
        
        response_file = requests.get(WIKIMEDIA_API, params=params_file, headers=HEADERS, timeout=10)
        response_file.raise_for_status()
        data_file = response_file.json()
        
        pages = data_file.get("query", {}).get("pages", {})
        for page_id in pages:
            info = pages[page_id].get("imageinfo", [{}])[0]
            url = info.get("url")
            if url:
                metadata = info.get("extmetadata", {})
                return {
                    'url': url,
                    'nombre': query,
                    'tipo_sonido': 'grabación',
                    'fuente': 'Wikimedia Commons',
                    'licencia': metadata.get('LicenseShortName', {}).get('value', 'CC BY-SA'),
                    'grabador': metadata.get('Artist', {}).get('value', 'Colaborador de Wikimedia')
                }
        
        return None
    except Exception as e:
        print(f"Error buscando en Wikimedia: {e}")
        return None


def buscar_sonido_insecto(nombre_especie):
    """
    Busca un sonido de insecto en los archivos locales.
    
    Args:
        nombre_especie: Nombre del insecto
    
    Returns:
        dict con información del sonido o None
    """
    nombre_lower = nombre_especie.lower().strip()
    
    # Buscar coincidencia
    for nombre, archivo in SONIDOS_INSECTOS.items():
        if nombre in nombre_lower:
            return {
                'url': f'/static/sounds/{archivo}',
                'nombre': nombre_especie,
                'tipo_sonido': 'sonido característico',
                'fuente': 'Archivo local'
            }
    
    return None


def buscar_sonido(nombre_especie, nombre_cientifico=None, tipo='insecto'):
    """
    Busca un sonido para la especie dada.
    
    Args:
        nombre_especie: Nombre común de la especie
        nombre_cientifico: Nombre científico (opcional)
        tipo: 'insecto' o 'planta' (las plantas no tienen sonido)
    
    Returns:
        dict con información del sonido o None
    """
    # Las plantas no tienen sonidos
    if tipo == 'planta':
        return None
    
    # Primero intentar con aves (Xeno-Canto)
    resultado = buscar_sonido_ave(nombre_especie, nombre_cientifico)
    
    if resultado:
        return resultado
    
    # Si no es ave, buscar en insectos locales
    return buscar_sonido_insecto(nombre_especie)


# Para pruebas
if __name__ == '__main__':
    print("Probando búsqueda de sonidos...")
    
    # Probar con un ave
    resultado = buscar_sonido("chincol", tipo="insecto")
    if resultado:
        print(f"✅ Encontrado: {resultado['nombre']}")
        print(f"   URL: {resultado['url']}")
    else:
        print("❌ No encontrado")
    
    # Probar con cóndor
    resultado = buscar_sonido("cóndor andino", tipo="insecto")
    if resultado:
        print(f"✅ Encontrado: {resultado['nombre']}")
        print(f"   URL: {resultado['url']}")
    else:
        print("❌ No encontrado")

"""
Utilidad para buscar imágenes de especies en Wikipedia.
"""

import requests
import urllib.parse

def buscar_imagen_wikipedia(nombre_cientifico: str, nombre_comun: str = None) -> str:
    """
    Busca una imagen en Wikipedia para la especie dada.
    
    Args:
        nombre_cientifico: Nombre científico de la especie
        nombre_comun: Nombre común como respaldo
    
    Returns:
        URL de la imagen o None si no se encuentra
    """
    # Intentar primero con el nombre científico
    terminos = [nombre_cientifico]
    if nombre_comun:
        terminos.append(nombre_comun)
    
    for termino in terminos:
        if not termino:
            continue
            
        try:
            # Primero buscar el título del artículo
            search_url = "https://es.wikipedia.org/w/api.php"
            search_params = {
                "action": "query",
                "list": "search",
                "srsearch": termino,
                "format": "json",
                "srlimit": 1
            }
            
            response = requests.get(search_url, params=search_params, timeout=5)
            data = response.json()
            
            if not data.get("query", {}).get("search"):
                # Intentar en Wikipedia en inglés
                search_url = "https://en.wikipedia.org/w/api.php"
                response = requests.get(search_url, params=search_params, timeout=5)
                data = response.json()
            
            if not data.get("query", {}).get("search"):
                continue
            
            # Obtener el título del primer resultado
            titulo = data["query"]["search"][0]["title"]
            
            # Ahora buscar la imagen del artículo
            image_params = {
                "action": "query",
                "titles": titulo,
                "prop": "pageimages",
                "format": "json",
                "pithumbsize": 500  # Tamaño de la miniatura
            }
            
            # Intentar primero en español
            for wiki_url in ["https://es.wikipedia.org/w/api.php", "https://en.wikipedia.org/w/api.php"]:
                img_response = requests.get(wiki_url, params=image_params, timeout=5)
                img_data = img_response.json()
                
                pages = img_data.get("query", {}).get("pages", {})
                for page_id, page_info in pages.items():
                    if "thumbnail" in page_info:
                        return page_info["thumbnail"]["source"]
                    
        except Exception as e:
            print(f"Error buscando imagen para '{termino}': {e}")
            continue
    
    return None


def buscar_imagen_alternativa(consulta: str, tipo: str = "insecto") -> str:
    """
    Busca una imagen alternativa usando una API de búsqueda gratuita.
    
    Args:
        consulta: Término de búsqueda
        tipo: Tipo de especie (insecto/planta)
    
    Returns:
        URL de la imagen o un placeholder
    """
    # Si no encontramos imagen, usar un placeholder SVG bonito
    if tipo == "insecto":
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%232E8B57'/%3E%3Ctext x='50' y='60' font-size='40' text-anchor='middle' fill='white'%3E🐛%3C/text%3E%3C/svg%3E"
    else:
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FF6B35'/%3E%3Ctext x='50' y='60' font-size='40' text-anchor='middle' fill='white'%3E🌿%3C/text%3E%3C/svg%3E"


def obtener_imagen_especie(nombre_cientifico: str, nombre_comun: str = None, tipo: str = "insecto") -> str:
    """
    Obtiene la mejor imagen disponible para una especie.
    
    Args:
        nombre_cientifico: Nombre científico
        nombre_comun: Nombre común
        tipo: Tipo de especie
    
    Returns:
        URL de la imagen
    """
    # Intentar Wikipedia primero
    imagen = buscar_imagen_wikipedia(nombre_cientifico, nombre_comun)
    
    if imagen:
        return imagen
    
    # Si no hay imagen, usar placeholder
    return buscar_imagen_alternativa(nombre_comun or nombre_cientifico, tipo)

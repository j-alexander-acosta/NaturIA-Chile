"""
Utilidad para buscar imágenes de especies en Wikipedia.
"""

import requests
import urllib.parse

# User-Agent requerido por Wikipedia API
HEADERS = {
    "User-Agent": "NaturIA-Chile/1.0 (https://github.com/naturia-chile; naturia@example.com) requests/2.0"
}


def buscar_imagen_wikipedia(nombre_cientifico: str, nombre_comun: str = None) -> str:
    """
    Busca una imagen en Wikipedia para la especie dada.
    Prioriza el nombre científico ya que es más preciso.
    
    Args:
        nombre_cientifico: Nombre científico de la especie
        nombre_comun: Nombre común como respaldo
    
    Returns:
        URL de la imagen o None si no se encuentra
    """
    
    def buscar_imagen_con_titulo(titulo: str, wiki_base: str) -> str:
        """Busca la imagen de un artículo específico en Wikipedia."""
        try:
            image_params = {
                "action": "query",
                "titles": titulo,
                "prop": "pageimages",
                "format": "json",
                "pithumbsize": 500
            }
            img_response = requests.get(
                f"{wiki_base}/w/api.php", 
                params=image_params, 
                headers=HEADERS,
                timeout=10
            )
            
            if img_response.status_code != 200:
                print(f"Error HTTP {img_response.status_code} para '{titulo}'")
                return None
                
            img_data = img_response.json()
            
            pages = img_data.get("query", {}).get("pages", {})
            for page_id, page_info in pages.items():
                if page_id != "-1" and "thumbnail" in page_info:
                    return page_info["thumbnail"]["source"]
        except requests.exceptions.RequestException as e:
            print(f"Error de conexión buscando imagen para '{titulo}': {e}")
        except ValueError as e:
            print(f"Error parseando JSON para '{titulo}': {e}")
        except Exception as e:
            print(f"Error inesperado buscando imagen para '{titulo}': {e}")
        return None
    
    def buscar_articulo_y_obtener_imagen(termino: str, wiki_base: str) -> str:
        """Busca un artículo y obtiene su imagen principal."""
        try:
            search_params = {
                "action": "query",
                "list": "search",
                "srsearch": termino,
                "format": "json",
                "srlimit": 1
            }
            
            response = requests.get(
                f"{wiki_base}/w/api.php", 
                params=search_params, 
                headers=HEADERS,
                timeout=10
            )
            
            if response.status_code != 200:
                print(f"Error HTTP {response.status_code} buscando '{termino}'")
                return None
                
            data = response.json()
            
            if data.get("query", {}).get("search"):
                titulo = data["query"]["search"][0]["title"]
                return buscar_imagen_con_titulo(titulo, wiki_base)
        except requests.exceptions.RequestException as e:
            print(f"Error de conexión buscando artículo para '{termino}': {e}")
        except ValueError as e:
            print(f"Error parseando JSON para '{termino}': {e}")
        except Exception as e:
            print(f"Error inesperado buscando artículo para '{termino}': {e}")
        return None
    
    # ESTRATEGIA 1: Buscar directamente con nombre científico en Wikipedia inglés
    # (mejor fuente para especies biológicas)
    if nombre_cientifico:
        # Intentar acceso directo al artículo con el nombre científico
        imagen = buscar_imagen_con_titulo(nombre_cientifico, "https://en.wikipedia.org")
        if imagen:
            return imagen
        
        # Buscar artículo en inglés
        imagen = buscar_articulo_y_obtener_imagen(nombre_cientifico, "https://en.wikipedia.org")
        if imagen:
            return imagen
        
        # Intentar en español con nombre científico
        imagen = buscar_imagen_con_titulo(nombre_cientifico, "https://es.wikipedia.org")
        if imagen:
            return imagen
        
        imagen = buscar_articulo_y_obtener_imagen(nombre_cientifico, "https://es.wikipedia.org")
        if imagen:
            return imagen
    
    # ESTRATEGIA 2: Si el nombre científico falló, intentar con nombre común
    # pero agregando contexto para evitar ambigüedades
    if nombre_comun:
        # Añadir contexto biológico para búsqueda más precisa
        terminos_busqueda = [
            f"{nombre_comun} insecto",
            f"{nombre_comun} animal",
            nombre_comun
        ]
        
        for termino in terminos_busqueda:
            for wiki_base in ["https://en.wikipedia.org", "https://es.wikipedia.org"]:
                imagen = buscar_articulo_y_obtener_imagen(termino, wiki_base)
                if imagen:
                    return imagen
    
    return None


def buscar_imagen_alternativa(consulta: str, tipo: str = "insecto") -> str:
    """
    Retorna un placeholder bonito si no se encontró imagen.
    
    Args:
        consulta: Término de búsqueda
        tipo: Tipo de especie (insecto/planta)
    
    Returns:
        URL de la imagen placeholder
    """
    # Usar emojis más apropiados para cada tipo
    if tipo == "insecto":
        # Usar emoji de mariquita/catarina que es más representativo
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%232E8B57'/%3E%3Ctext x='50' y='60' font-size='40' text-anchor='middle' fill='white'%3E🐞%3C/text%3E%3C/svg%3E"
    else:
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%2334A853'/%3E%3Ctext x='50' y='60' font-size='40' text-anchor='middle' fill='white'%3E🌿%3C/text%3E%3C/svg%3E"


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


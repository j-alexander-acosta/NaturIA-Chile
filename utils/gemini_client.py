"""
Cliente para interactuar con la API de Google Gemini.
Maneja la identificación de insectos y plantas de Chile.
"""

import os
import json
import re
import time
import google.generativeai as genai
from PIL import Image
import io

# Lista de modelos a probar (en orden de preferencia)
MODELOS_DISPONIBLES = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
]

# Configurar la API de Gemini
def configure_gemini():
    """Configura la API de Gemini con la clave del entorno."""
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        raise ValueError("No se encontró GOOGLE_API_KEY en las variables de entorno")
    genai.configure(api_key=api_key)
    return True

def obtener_prompt(tipo: str) -> str:
    """Obtiene el prompt según el tipo de análisis."""
    if tipo == "insecto":
        return """Eres un experto entomólogo chileno especializado en insectos de Chile. 
        Analiza la imagen y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
        {
            "nombre": "Nombre común en Chile (pueden ser insectos, arácnidos o pequeños bichos urbanos/domésticos)",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde se encuentra comúnmente (hogares, jardines, naturaleza)",
            "peligrosidad": "Baja/Media/Alta",
            "estado_conservacion": "Extinto/En Peligro/Vulnerable/Preocupación Menor/No Evaluado/Domesticado",
            "dato_curioso": "Un dato sorprendente sobre este espécimen",
            "puntos": un número entero entre 10 y 100 basado en la rareza en Chile
        }
        
        Si no hay absolutamente nada identificable en la imagen, devuelve un objeto JSON con una clave "error" y una explicación breve.
        
        IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni markdown."""
    elif tipo == "ave":
        return """Eres un experto ornitólogo chileno especializado en aves de Chile.
        Analiza la imagen y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
        {
            "nombre": "Nombre común en Chile (incluyendo aves domésticas o de granja)",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde vive o se encuentra (plazas, granjas, naturaleza)",
            "peligrosidad": "Baja/Media/Alta",
            "estado_conservacion": "Extinto/En Peligro/Vulnerable/Preocupación Menor/No Evaluado/Domesticado",
            "dato_curioso": "Un dato sorprendente sobre esta ave",
            "puntos": un número entero entre 10 y 100 basado en la rareza en Chile
        }
        
        Si no hay absolutamente nada identificable en la imagen, devuelve un objeto JSON con una clave "error" y una explicación breve.
        
        IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni markdown."""
    elif tipo == "animal":
        return """Eres un experto zoólogo chileno especializado en fauna silvestre de Chile (mamíferos, reptiles, etc.).
        Analiza la imagen y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
        {
            "nombre": "Nombre común en Chile (incluyendo mascotas y animales domésticos)",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde se encuentra (hogares, campos, naturaleza)",
            "peligrosidad": "Baja/Media/Alta",
            "estado_conservacion": "Extinto/En Peligro/Vulnerable/Preocupación Menor/No Evaluado/Domesticado",
            "dato_curioso": "Un dato sorprendente sobre este animal",
            "puntos": un número entero entre 10 y 100 basado en la rareza en Chile
        }
        
        Si no hay absolutamente nada identificable en la imagen, devuelve un objeto JSON con una clave "error" y una explicación breve.
        
        IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni markdown."""
    else:
        return """Eres un experto botánico chileno especializado en flora nativa de Chile.
        Analiza la imagen y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
        {
            "nombre": "Nombre común en Chile (incluyendo plantas de jardín y cultivos)",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde crece (jardines, maceteros, campos, naturaleza)",
            "peligrosidad": "Baja/Media/Alta (si es venenosa o peligrosa)",
            "estado_conservacion": "Extinto/En Peligro/Vulnerable/Preocupación Menor/No Evaluado/Cultivada",
            "dato_curioso": "Un dato sorprendente sobre esta planta",
            "puntos": un número entero entre 10 y 100 basado en la rareza en Chile
        }
        
        Si no hay absolutamente nada identificable en la imagen, devuelve un objeto JSON con una clave "error" y una explicación breve.
        
        IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni markdown."""

def intentar_con_modelo(model_name: str, prompt: str, image) -> tuple:
    """
    Intenta generar contenido con un modelo específico.
    Retorna (éxito, resultado_o_error)
    """
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content([prompt, image])
        return (True, response.text.strip())
    except Exception as e:
        error_str = str(e)
        # Verificar si es error de cuota
        if "429" in error_str or "quota" in error_str.lower():
            return (False, f"quota_exceeded:{model_name}")
        # Verificar si la API key es inválida o expiró
        if "400" in error_str or "API_KEY_INVALID" in error_str or "expired" in error_str.lower():
            return (False, f"key_error:{model_name}")
        # Verificar si el modelo no existe
        if "404" in error_str or "not found" in error_str.lower():
            return (False, f"model_not_found:{model_name}")
        # Otro error
        return (False, error_str)

def analizar_imagen(image_data: bytes, tipo: str = "insecto") -> dict:
    """
    Analiza una imagen usando Gemini, probando varios modelos si es necesario.
    
    Args:
        image_data: Bytes de la imagen a analizar
        tipo: Tipo de análisis ("insecto" o "planta")
    
    Returns:
        dict: Información sobre la especie identificada
    """
    try:
        configure_gemini()
        
        # Cargar la imagen
        image = Image.open(io.BytesIO(image_data))
        
        # Obtener el prompt
        prompt = obtener_prompt(tipo)
        
        # Intentar con cada modelo disponible
        errores = []
        modelos_con_cuota_excedida = []
        
        for modelo in MODELOS_DISPONIBLES:
            exito, resultado = intentar_con_modelo(modelo, prompt, image)
            
            if exito:
                # Limpiar y parsear la respuesta
                response_text = resultado
                
                # Remover posibles marcadores de código markdown
                if response_text.startswith('```'):
                    response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
                    response_text = re.sub(r'\n?```$', '', response_text)
                
                # Parsear JSON
                result = json.loads(response_text)
                
                # Agregar tipo al resultado
                result['tipo'] = tipo
                result['modelo_usado'] = modelo
                
                return result
            else:
                if "quota_exceeded" in resultado:
                    modelos_con_cuota_excedida.append(modelo)
                elif "model_not_found" in resultado:
                    continue  # Silenciosamente probar el siguiente modelo
                else:
                    print(f"❌ Error con {modelo}: {resultado}")
                    errores.append(f"{modelo}: {resultado}")
        
        # Si todos los modelos fallaron, analizar por qué
        if modelos_con_cuota_excedida:
             return {
                "error": "⏰ ¡Has usado todas las consultas gratuitas de hoy! El límite de la API Free de Google Gemini se ha alcanzado. Intenta de nuevo en unos minutos o mañana.",
                "tipo": tipo,
                "codigo_error": "QUOTA_EXCEEDED"
            }
        
        # Revisar si hubo errores de API Key
        if errores and any("key_error" in err or "400" in err for err in errores):
             return {
                "error": "🔑 Tu API Key de Google Gemini parece haber expirado o es inválida. Por favor, genera una nueva en https://aistudio.google.com/app/apikey",
                "tipo": tipo,
                "codigo_error": "API_KEY_ERROR"
            }

        # Si hubo otros errores
        if errores:
            return {
                "error": f"No se pudo analizar la imagen: {errores[0]}",
                "tipo": tipo
            }
        
        return {
            "error": "No hay modelos disponibles para analizar la imagen. Por favor, verifica tu API Key.",
            "tipo": tipo
        }
        
    except json.JSONDecodeError as e:
        return {
            "error": f"Error al procesar la respuesta de la IA: {str(e)}",
            "tipo": tipo
        }
    except Exception as e:
        return {
            "error": f"Error al analizar la imagen: {str(e)}",
            "tipo": tipo
        }


def obtener_prompt_busqueda(tipo: str, consulta: str) -> str:
    """Obtiene el prompt para búsqueda por texto."""
    if tipo == "insecto":
        return f"""Eres un experto entomólogo chileno especializado en insectos de Chile.
        El usuario está buscando información sobre: "{consulta}"
        
        Identifica el insecto y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
        {{
            "nombre": "Nombre común en Chile (si tiene varios, usa el más conocido)",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde vive en Chile (regiones o zonas)",
            "peligrosidad": "Baja/Media/Alta",
            "estado_conservacion": "Extinto/En Peligro/Vulnerable/Preocupación Menor/No Evaluado",
            "dato_curioso": "Un dato sorprendente sobre este insecto",
            "puntos": un número entero entre 10 y 100 basado en la rareza del insecto en Chile,
            "imagen_sugerida": "Una descripción breve para buscar una imagen del insecto"
        }}
        
        Si no puedes identificar el insecto o no existe, devuelve:
        {{"error": "No encontré información sobre '{consulta}'. ¿Puedes verificar el nombre?"}}
        
        IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni markdown."""
    elif tipo == "ave":
        return f"""Eres un experto ornitólogo chileno especializado en aves de Chile.
        El usuario está buscando información sobre: "{consulta}"
        
        Identifica el ave y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
        {{
            "nombre": "Nombre común en Chile",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde vive en Chile (regiones o zonas)",
            "peligrosidad": "Baja/Media/Alta",
            "estado_conservacion": "Extinto/En Peligro/Vulnerable/Preocupación Menor/No Evaluado",
            "dato_curioso": "Un dato sorprendente sobre esta ave",
            "puntos": un número entero entre 10 y 100 basado en la rareza del ave en Chile,
            "imagen_sugerida": "Una descripción breve para buscar una imagen del ave"
        }}
        
        Si no puedes identificar el ave o no existe en Chile, devuelve:
        {{"error": "No encontré información sobre '{consulta}' en Chile. ¿Puedes verificar el nombre?"}}
        
        IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni markdown."""
    elif tipo == "animal":
        return f"""Eres un experto zoólogo chileno especializado en fauna silvestre de Chile.
        El usuario está buscando información sobre: "{consulta}"
        
        Identifica el animal y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
        {{
            "nombre": "Nombre común en Chile",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde vive en Chile (regiones o zonas)",
            "peligrosidad": "Baja/Media/Alta",
            "estado_conservacion": "Extinto/En Peligro/Vulnerable/Preocupación Menor/No Evaluado",
            "dato_curioso": "Un dato sorprendente sobre este animal",
            "puntos": un número entero entre 10 y 100 basado en la rareza del animal en Chile,
            "imagen_sugerida": "Una descripción breve para buscar una imagen del animal"
        }}
        
        Si no puedes identificar el animal o no existe en Chile, devuelve:
        {{"error": "No encontré información sobre '{consulta}' en Chile. ¿Puedes verificar el nombre?"}}
        
        IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni markdown."""
    else:
        return f"""Eres un experto botánico chileno especializado en flora nativa de Chile.
        El usuario está buscando información sobre: "{consulta}"
        
        Identifica la planta y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
        {{
            "nombre": "Nombre común en Chile",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde crece en Chile (regiones o zonas)",
            "peligrosidad": "Baja/Media/Alta (si es venenosa o peligrosa)",
            "estado_conservacion": "Extinto/En Peligro/Vulnerable/Preocupación Menor/No Evaluado",
            "dato_curioso": "Un dato sorprendente sobre esta planta",
            "puntos": un número entero entre 10 y 100 basado en la rareza de la planta en Chile,
            "imagen_sugerida": "Una descripción breve para buscar una imagen de la planta"
        }}
        
        Si no puedes identificar la planta o no existe en Chile, devuelve:
        {{"error": "No encontré información sobre '{consulta}' en Chile. ¿Puedes verificar el nombre?"}}
        
        IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni markdown."""


def intentar_busqueda_con_modelo(model_name: str, prompt: str) -> tuple:
    """
    Intenta generar contenido de búsqueda con un modelo específico.
    Retorna (éxito, resultado_o_error)
    """
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return (True, response.text.strip())
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "quota" in error_str.lower():
            return (False, f"quota_exceeded:{model_name}")
        if "400" in error_str or "API_KEY_INVALID" in error_str or "expired" in error_str.lower():
            return (False, f"key_error:{model_name}")
        if "404" in error_str or "not found" in error_str.lower():
            return (False, f"model_not_found:{model_name}")
        return (False, error_str)


def buscar_por_texto(consulta: str, tipo: str = "insecto") -> dict:
    """
    Busca información sobre un insecto o planta por nombre.
    
    Args:
        consulta: Nombre o descripción del insecto/planta a buscar
        tipo: Tipo de búsqueda ("insecto" o "planta")
    
    Returns:
        dict: Información sobre la especie encontrada
    """
    try:
        configure_gemini()
        
        # Obtener el prompt de búsqueda
        prompt = obtener_prompt_busqueda(tipo, consulta)
        
        # Intentar con cada modelo disponible
        errores = []
        modelos_con_cuota_excedida = []
        
        for modelo in MODELOS_DISPONIBLES:
            exito, resultado = intentar_busqueda_con_modelo(modelo, prompt)
            
            if exito:
                # Limpiar y parsear la respuesta
                response_text = resultado
                
                # Remover posibles marcadores de código markdown
                if response_text.startswith('```'):
                    response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
                    response_text = re.sub(r'\n?```$', '', response_text)
                
                # Parsear JSON
                result = json.loads(response_text)
                
                # Agregar metadata al resultado
                result['tipo'] = tipo
                result['modelo_usado'] = modelo
                result['metodo'] = 'busqueda_texto'
                
                return result
            else:
                if "quota_exceeded" in resultado:
                    modelos_con_cuota_excedida.append(modelo)
                elif "model_not_found" in resultado:
                    continue
                else:
                    errores.append(f"{modelo}: {resultado}")
        
        # Si todos los modelos fallaron, analizar por qué
        if modelos_con_cuota_excedida:
            return {
                "error": "⏰ ¡Has usado todas las consultas gratuitas de hoy! El límite de la API Free de Google Gemini se ha alcanzado. Intenta de nuevo en unos minutos o mañana.",
                "tipo": tipo,
                "codigo_error": "QUOTA_EXCEEDED"
            }
        
        # Revisar si hubo errores de API Key
        if errores and any("key_error" in err or "400" in err for err in errores):
             return {
                "error": "🔑 Tu API Key de Google Gemini parece haber expirado o es inválida. Por favor, genera una nueva en https://aistudio.google.com/app/apikey",
                "tipo": tipo,
                "codigo_error": "API_KEY_ERROR"
            }
        
        if errores:
            return {
                "error": f"No se pudo realizar la búsqueda: {errores[0]}",
                "tipo": tipo
            }
        
        return {
            "error": "No hay modelos disponibles. Verifica tu API Key.",
            "tipo": tipo
        }
        
    except json.JSONDecodeError as e:
        return {
            "error": f"Error al procesar la respuesta: {str(e)}",
            "tipo": tipo
        }
    except Exception as e:
        return {
            "error": f"Error en la búsqueda: {str(e)}",
            "tipo": tipo
        }

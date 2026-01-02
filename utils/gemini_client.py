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
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro-vision',
    'gemini-pro',
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
            "nombre": "Nombre común en Chile (si tiene varios, usa el más conocido)",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde vive en Chile (regiones o zonas)",
            "peligrosidad": "Baja/Media/Alta",
            "dato_curioso": "Un dato sorprendente sobre este insecto",
            "puntos": un número entero entre 10 y 100 basado en la rareza del insecto en Chile
        }
        
        Si no puedes identificar un insecto en la imagen, devuelve:
        {"error": "No pude identificar un insecto en esta imagen. ¡Intenta con otra foto!"}
        
        IMPORTANTE: Responde SOLO con el JSON, sin texto adicional ni markdown."""
    else:
        return """Eres un experto botánico chileno especializado en flora nativa de Chile.
        Analiza la imagen y devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
        {
            "nombre": "Nombre común en Chile",
            "cientifico": "Nombre científico en latín",
            "descripcion": "Explicación divertida y educativa para niños de 8 años, máximo 3 oraciones",
            "habitat": "Dónde crece en Chile (regiones o zonas)",
            "peligrosidad": "Baja/Media/Alta (si es venenosa o peligrosa)",
            "dato_curioso": "Un dato sorprendente sobre esta planta",
            "puntos": un número entero entre 10 y 100 basado en la rareza de la planta en Chile
        }
        
        Si no puedes identificar una planta en la imagen, devuelve:
        {"error": "No pude identificar una planta en esta imagen. ¡Intenta con otra foto!"}
        
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
                    errores.append(f"{modelo}: {resultado}")
        
        # Si todos los modelos fallaron por cuota
        if len(modelos_con_cuota_excedida) == len(MODELOS_DISPONIBLES):
            return {
                "error": "⏰ ¡Has usado todas las consultas gratuitas de hoy! Intenta mañana o usa una nueva API Key. Visita https://aistudio.google.com/app/apikey para obtener una nueva.",
                "tipo": tipo,
                "codigo_error": "QUOTA_EXCEEDED"
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

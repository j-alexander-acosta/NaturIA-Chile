import google.generativeai as genai
import os

# 1. Configura tu clave directamente aquí para probar (luego la borras)
API_KEY = "AIzaSyAj7-oUtkCHdTFv82UEcPdnsGh1XR8qjGs"

try:
    genai.configure(api_key=API_KEY)
    
    # 2. Intentar listar los modelos disponibles
    print("Conectando con Google...")
    print("-" * 30)
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Modelo encontrado: {m.name}")
    
    # 3. Intentar una generación simple
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("¿Qué comen las chinitas? Responde en 1 frase.")
    print("-" * 30)
    print("¡ÉXITO! Respuesta de Gemini:")
    print(response.text)

except Exception as e:
    print("\n❌ ERROR GRAVE:")
    print(e)
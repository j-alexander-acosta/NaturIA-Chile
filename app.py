"""
Explorador Chileno - Aplicación educativa para identificar insectos y plantas de Chile
"""

import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from utils.gemini_client import analizar_imagen

# Cargar variables de entorno
load_dotenv()

# Crear aplicación Flask
app = Flask(__name__)

# Configuración
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Límite de 16MB para uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    """Verifica si la extensión del archivo es permitida."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    """Página principal de la aplicación."""
    return render_template('index.html')


@app.route('/analizar', methods=['POST'])
def analizar():
    """
    Endpoint para analizar imágenes de insectos o plantas.
    Recibe una imagen y el tipo de análisis (insecto/planta).
    Devuelve información sobre la especie identificada.
    """
    try:
        # Verificar que se envió un archivo
        if 'imagen' not in request.files:
            return jsonify({
                'error': '¡Ups! No recibí ninguna imagen. ¿Puedes intentar de nuevo?'
            }), 400
        
        file = request.files['imagen']
        
        # Verificar que el archivo tiene nombre
        if file.filename == '':
            return jsonify({
                'error': '¡Ups! La imagen no tiene nombre. Intenta con otra.'
            }), 400
        
        # Verificar extensión permitida
        if not allowed_file(file.filename):
            return jsonify({
                'error': '¡Ups! Solo acepto imágenes (PNG, JPG, GIF o WEBP).'
            }), 400
        
        # Obtener el tipo de análisis (insecto o planta)
        tipo = request.form.get('tipo', 'insecto')
        if tipo not in ['insecto', 'planta']:
            tipo = 'insecto'
        
        # Leer los bytes de la imagen
        image_data = file.read()
        
        # Analizar con Gemini
        resultado = analizar_imagen(image_data, tipo)
        
        # Verificar si hubo error
        if 'error' in resultado:
            return jsonify(resultado), 200  # Devolvemos 200 porque el error es del contenido, no del servidor
        
        return jsonify(resultado), 200
        
    except Exception as e:
        return jsonify({
            'error': f'¡Algo salió mal! {str(e)}'
        }), 500


@app.route('/salud')
def health_check():
    """Endpoint para verificar que el servidor está funcionando."""
    return jsonify({
        'status': 'ok',
        'mensaje': '¡El Explorador Chileno está listo para la aventura! 🦋🌿'
    })


if __name__ == '__main__':
    # Verificar que existe la API key
    if not os.getenv('GOOGLE_API_KEY'):
        print("⚠️  ADVERTENCIA: No se encontró GOOGLE_API_KEY en el archivo .env")
        print("   Crea un archivo .env con tu API key de Google Gemini")
    
    # Ejecutar en modo debug para desarrollo
    app.run(debug=True, host='0.0.0.0', port=5000)

"""
NaturIA Chile - Identifica insectos y plantas de Chile con IA
© 2026 J. Alexander Acosta Z. Todos los derechos reservados.
"""

import os
from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from datetime import datetime
from dotenv import load_dotenv
from utils.gemini_client import analizar_imagen, buscar_por_texto
from utils.image_search import obtener_imagen_especie
from utils.sound_search import buscar_sonido

# Cargar variables de entorno
load_dotenv()

# Crear aplicación Flask
app = Flask(__name__)

# Configuración
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'naturia-chile-super-secret-key')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Límite de 16MB para uploads
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///naturia.db')
if app.config['SQLALCHEMY_DATABASE_URI'].startswith("postgres://"):
    app.config['SQLALCHEMY_DATABASE_URI'] = app.config['SQLALCHEMY_DATABASE_URI'].replace("postgres://", "postgresql://", 1)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'index'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# ========================================
# MODELOS DE BASE DE DATOS
# ========================================

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    apellido = db.Column(db.String(50), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    telefono = db.Column(db.String(20), nullable=True)
    total_puntos = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relación con descubrimientos
    discoveries = db.relationship('Discovery', backref='explorer', lazy=True)

class Discovery(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    nombre_especie = db.Column(db.String(100), nullable=False)
    nombre_cientifico = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    imagen_url = db.Column(db.String(255), nullable=True)
    puntos = db.Column(db.Integer, default=0)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Crear tablas
with app.app_context():
    db.create_all()

# ========================================
# RUTAS DE AUTENTICACIÓN
# ========================================

@app.route('/registro', methods=['POST'])
def registro():
    """Registro de nuevo usuario."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        # Validar campos requeridos
        required = ['nombre', 'apellido', 'correo']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es obligatorio'}), 400
        
        # Verificar si ya existe el correo
        if User.query.filter_by(correo=data['correo']).first():
            return jsonify({'error': 'Este correo ya está registrado'}), 400
        
        # Crear usuario
        nuevo_usuario = User(
            nombre=data['nombre'],
            apellido=data['apellido'],
            correo=data['correo'],
            telefono=data.get('telefono', ''),
            total_puntos=int(data.get('puntos', 0)) # Sincronizar puntos iniciales si existen
        )
        
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        login_user(nuevo_usuario)
        
        return jsonify({
            'success': True,
            'mensaje': f'¡Bienvenido, {nuevo_usuario.nombre}!',
            'usuario': {
                'nombre': nuevo_usuario.nombre,
                'puntos': nuevo_usuario.total_puntos
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    """Inicio de sesión simple por correo."""
    try:
        data = request.get_json()
        correo = data.get('correo')
        
        if not correo:
            return jsonify({'error': 'Se requiere el correo electrónico'}), 400
            
        usuario = User.query.filter_by(correo=correo).first()
        if not usuario:
            return jsonify({'error': 'Correo no encontrado. ¡Regístrate para comenzar!'}), 404
            
        login_user(usuario)
        
        return jsonify({
            'success': True,
            'mensaje': f'Hola de nuevo, {usuario.nombre}',
            'usuario': {
                'nombre': usuario.nombre,
                'puntos': usuario.total_puntos
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/perfil', methods=['GET'])
@login_required
def obtener_perfil():
    """Obtiene los datos del perfil y descubrimientos."""
    # En el futuro, aquí se consultarán los descubrimientos de la DB
    return jsonify({
        'nombre': current_user.nombre,
        'apellido': current_user.apellido,
        'correo': current_user.correo,
        'puntos': current_user.total_puntos,
        'descubrimientos_count': Discovery.query.filter_by(user_id=current_user.id).count()
    })

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'mensaje': 'Sesión cerrada'})

# Actualizar puntos en la DB
@app.route('/sincronizar_puntos', methods=['POST'])
@login_required
def sincronizar_puntos():
    try:
        data = request.get_json()
        puntos = data.get('puntos')
        if puntos is not None:
            current_user.total_puntos = int(puntos)
            db.session.commit()
            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/guardar_descubrimiento', methods=['POST'])
@login_required
def guardar_descubrimiento():
    """Guarda un nuevo descubrimiento en la base de datos."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
            
        nuevo_descubrimiento = Discovery(
            user_id=current_user.id,
            nombre_especie=data.get('nombre'),
            nombre_cientifico=data.get('cientifico'),
            tipo=data.get('tipo'),
            imagen_url=data.get('imagen_url'),
            puntos=int(data.get('puntos', 0))
        )
        
        db.session.add(nuevo_descubrimiento)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'mensaje': '¡Descubrimiento guardado en tu Naturadex!',
            'descubrimientos_count': Discovery.query.filter_by(user_id=current_user.id).count()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
        
        # Obtener el tipo de análisis (insecto, planta, ave o animal)
        tipo = request.form.get('tipo', 'insecto')
        if tipo not in ['insecto', 'planta', 'ave', 'animal']:
            tipo = 'insecto'
        
        # Leer los bytes de la imagen
        image_data = file.read()
        
        # Analizar con Gemini
        resultado = analizar_imagen(image_data, tipo)
        
        # Verificar si hubo error
        if 'error' in resultado:
            return jsonify(resultado), 200  # Devolvemos 200 porque el error es del contenido, no del servidor
        
        # Buscar imagen de la especie identificada
        imagen_url = obtener_imagen_especie(
            resultado.get('cientifico', ''),
            resultado.get('nombre', ''),
            tipo
        )
        resultado['imagen_url'] = imagen_url
        
        return jsonify(resultado), 200
        
    except Exception as e:
        return jsonify({
            'error': f'¡Algo salió mal! {str(e)}'
        }), 500


@app.route('/buscar', methods=['POST'])
def buscar():
    """
    Endpoint para buscar insectos o plantas por nombre (texto o voz).
    Recibe una consulta de texto y el tipo de búsqueda.
    Devuelve información sobre la especie encontrada.
    """
    try:
        # Obtener datos del JSON
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': '¡Ups! No recibí datos. Intenta de nuevo.'
            }), 400
        
        consulta = data.get('consulta', '').strip()
        tipo = data.get('tipo', 'insecto')
        
        if not consulta:
            return jsonify({
                'error': '¡Escribe o di el nombre de lo que quieres buscar!'
            }), 400
        
        if tipo not in ['insecto', 'planta', 'ave', 'animal']:
            tipo = 'insecto'
        
        # Buscar con Gemini
        resultado = buscar_por_texto(consulta, tipo)
        
        # Si no hay error, buscar imagen
        if 'error' not in resultado:
            imagen_url = obtener_imagen_especie(
                resultado.get('cientifico', ''),
                resultado.get('nombre', ''),
                tipo
            )
            resultado['imagen_url'] = imagen_url
        
        return jsonify(resultado), 200
        
    except Exception as e:
        return jsonify({
            'error': f'¡Algo salió mal! {str(e)}'
        }), 500


@app.route('/sonido', methods=['POST'])
def obtener_sonido():
    """
    Endpoint para buscar sonido de una especie.
    Utiliza la API de Xeno-Canto para aves chilenas.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        nombre = data.get('nombre', '').strip()
        cientifico = data.get('cientifico', '').strip()
        tipo = data.get('tipo', 'insecto')
        
        if not nombre and not cientifico:
            return jsonify({'error': 'Se requiere nombre o nombre científico'}), 400
        
        # Buscar sonido
        resultado = buscar_sonido(nombre, cientifico, tipo)
        
        if resultado:
            return jsonify({
                'encontrado': True,
                'sonido': resultado
            }), 200
        else:
            return jsonify({
                'encontrado': False,
                'mensaje': 'No se encontró sonido para esta especie'
            }), 200
            
    except Exception as e:
        return jsonify({
            'error': f'Error buscando sonido: {str(e)}'
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
    
    # Ejecutar servidor
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=debug_mode, host='0.0.0.0', port=port)

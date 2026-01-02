# 🦋 Explorador Chileno

Una aplicación web educativa para niños que identifica insectos y plantas de Chile usando inteligencia artificial.

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)
![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-orange.svg)

## 🎯 Características

- 🐛 **Identificación de Insectos**: Sube una foto y descubre qué insecto es
- 🌿 **Identificación de Plantas**: Reconoce flora nativa de Chile
- 🎮 **Sistema de Puntos**: Gana puntos según la rareza de la especie
- ⚠️ **Indicador de Peligrosidad**: Sabe si es seguro acercarse
- 📱 **Diseño Responsive**: Funciona en móviles y tablets
- 🧒 **Para Niños**: Explicaciones divertidas y educativas

## 🚀 Instalación

### Requisitos Previos

- Python 3.9 o superior
- Una API Key de Google Gemini ([obtener aquí](https://aistudio.google.com/app/apikey))

### Pasos

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/explorador-chileno.git
   cd explorador-chileno
   ```

2. **Crea el entorno virtual**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. **Instala las dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configura la API Key**
   ```bash
   cp .env.example .env
   # Edita .env y agrega tu GOOGLE_API_KEY
   ```

5. **Ejecuta la aplicación**
   ```bash
   python app.py
   ```

6. **Abre en el navegador**
   ```
   http://127.0.0.1:5000
   ```

## 📁 Estructura del Proyecto

```
explorador-chileno/
├── static/
│   ├── css/
│   │   └── styles.css      # Estilos modernos
│   └── js/
│       └── app.js          # Lógica del frontend
├── templates/
│   └── index.html          # Interfaz principal
├── utils/
│   ├── __init__.py
│   └── gemini_client.py    # Cliente de Gemini AI
├── .env.example            # Ejemplo de variables de entorno
├── .gitignore
├── app.py                  # Servidor Flask
├── requirements.txt        # Dependencias
└── README.md
```

## 🔧 Tecnologías

- **Backend**: Python + Flask
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **IA**: Google Gemini 2.0 Flash
- **Imágenes**: Pillow

## 🎨 Capturas de Pantalla

*Próximamente...*

## 📝 Uso

1. Selecciona si quieres identificar un **Insecto** o una **Planta**
2. Sube una foto desde tu dispositivo o cámara
3. Haz clic en **¡Analizar!**
4. ¡Descubre información fascinante sobre la especie!

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para los pequeños exploradores de Chile.

---

**Powered by [Google Gemini AI](https://ai.google.dev/)**

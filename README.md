# 🌿 NaturIA Chile

Aplicación web que identifica insectos y plantas de Chile usando Inteligencia Artificial.

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0+-green.svg)
![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-orange.svg)

## 🎯 Características

- 🐛 **Identificación de Insectos**: Sube una foto o busca por nombre
- 🌿 **Identificación de Plantas**: Reconoce flora nativa de Chile
- 🎤 **Búsqueda por Voz**: Usa el micrófono para buscar especies
- 📷 **Análisis de Imágenes**: Identifica especies desde fotos
- 🖼️ **Imágenes de Wikipedia**: Muestra fotos reales de las especies
- 🎮 **Sistema de Puntos**: Gana puntos según la rareza de la especie
- ⚠️ **Indicador de Peligrosidad**: Sabe si es seguro acercarse
- 📱 **Diseño Responsive**: Funciona en móviles y tablets

## 🚀 Instalación

### Requisitos Previos

- Python 3.9 o superior
- Una API Key de Google Gemini ([obtener aquí](https://aistudio.google.com/app/apikey))

### Pasos

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/j-alexander-acosta/Explorador-Chileno.git
   cd Explorador-Chileno
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
NaturIA-Chile/
├── static/
│   ├── css/
│   │   └── styles.css          # Estilos modernos
│   └── js/
│       └── app.js              # Lógica del frontend
├── templates/
│   └── index.html              # Interfaz principal
├── utils/
│   ├── __init__.py
│   ├── gemini_client.py        # Cliente de Gemini AI
│   └── image_search.py         # Búsqueda de imágenes Wikipedia
├── .env.example                # Ejemplo de variables de entorno
├── .gitignore
├── app.py                      # Servidor Flask
├── requirements.txt            # Dependencias
└── README.md
```

## 🔧 Tecnologías

- **Backend**: Python + Flask
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **IA**: Google Gemini Flash
- **Imágenes**: Wikipedia API + Pillow
- **Voz**: Web Speech API

## 📝 Uso

### Modo Foto
1. Selecciona **Insectos** o **Plantas**
2. Haz clic en **Subir Foto**
3. Sube una imagen desde tu dispositivo
4. Haz clic en **¡Analizar!**

### Modo Búsqueda
1. Selecciona **Insectos** o **Plantas**
2. Haz clic en **Buscar por Nombre**
3. Escribe el nombre o usa el 🎤 micrófono
4. Haz clic en **¡Buscar!**

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agrega nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

© 2026 NaturIA Chile. Todos los derechos reservados.

## 👨‍💻 Autor

**J. Alexander Acosta Z.**

---

*Desarrollado con 🌿 para los amantes de la naturaleza chilena.*

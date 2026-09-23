# Visor de imágenes 360º con Leaflet y Photo Sphere Viewer

![Galería de fotografías 360° con los puntos de captura en el mapa](https://res.cloudinary.com/dhnr62lyo/image/upload/w_1200,f_auto,q_auto/v1772720368/pedralcg.dev/projects/mmmbvnnsjv74ap7vum54.png)

**[Ver la demo en vivo](https://pedralcg.github.io/visor-360/)** · [Ficha del proyecto en pedralcg.dev](https://pedralcg.dev/projects/galeria-de-fotografias-360)

Este proyecto es un visor web que permite explorar fotografías panorámicas y esféricas capturadas con **dron o dispositivo móvil**. Combina la potencia de **Leaflet** para la visualización cartográfica con **Photo Sphere Viewer** para la navegación interactiva de imágenes 360º.

Está diseñado para representar en un mapa los puntos de captura de las panorámicas y abrirlas en un visualizador inmersivo directamente desde el visor.

---

## 1. 🌍 Funcionalidades principales

- 🗺️ Visualización de un **mapa base** con puntos georreferenciados de fotografías 360º.
- 📷 Exploración inmersiva de imágenes esféricas mediante **Photo Sphere Viewer**.
- 🔍 Popups interactivos en los puntos del mapa con acceso directo a las panorámicas.

---

## 2. 🛠️ Estado actual y hoja de ruta

**Estado actual:**  
El visor es totalmente funcional, mostrando en un mapa los puntos de captura y permitiendo abrir las imágenes 360º en un entorno inmersivo.

**Últimas mejoras:**

- Integración de **Photo Sphere Viewer** para renderizar imágenes esféricas.
- Incorporación de un mapa base con Leaflet y control de capas.

**Próximas mejoras previstas:**

- Incorporar **galerías de imágenes** por punto.
- Soporte para metadatos EXIF de orientación y fecha de captura.
- Posibilidad de recorrer panorámicas en secuencia (modo tour).

---

## 3. 🔗 Demo en línea

Puedes probar el visor directamente en:

🌐 [https://pedralcg.github.io/visor-360](https://pedralcg.github.io/visor-360)

---

## 4. 🛠️ Tecnologías utilizadas

- [Leaflet](https://leafletjs.com/) (JS)
- [Photo Sphere Viewer](https://photo-sphere-viewer.js.org/)
- HTML5 + CSS3
- JavaScript ES6
- Formatos de imagen compatibles: `.jpg`, `.jpeg`, `.png` (proyección equirectangular).

---

## 5. 🚀 Instalación y uso

1. Clona el repositorio completo:

```bash
git clone https://github.com/pedralcg/visor-360.git
```

2. Acceder a la carpeta del proyecto específico:

```bash
cd visor-360
```

3. Abre el archivo index.html en tu navegador favorito (se recomienda usar Firefox o Chrome).  
   ⚠️ No requiere servidor ni instalación adicional. Funciona en local o mediante GitHub Pages.  
   Consejo: Para una mejor experiencia, puedes abrir el proyecto con un servidor local como Live Server para VSCode.

---

## 6. 📁 Estructura del proyecto

- **index.html**: Página principal del visor.

- **style.css**: Estilos CSS para el diseño y la interfaz.

- **script.js**: Lógica de integración entre Leaflet y Photo Sphere Viewer.

- **/lib**: Librerías externas (Leaflet, Photo Sphere Viewer).

- **/assets**: Imágenes 360º y recursos gráficos.

- **/data**: Archivos GeoJSON con la localización de panorámicas.

## 7. 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si quieres colaborar en mejoras, nuevas funcionalidades o corrección de errores:

- Haz un fork del repositorio.
- Crea una rama para tu mejora (`git checkout -b mejora-nueva`).
- Realiza los cambios y haz commit con mensajes claros.
- Envía un pull request describiendo tus cambios.

---

## 8. 🐞 Reportar bugs y solicitar mejoras

Si encuentras algún error o tienes ideas para nuevas funcionalidades, por favor:

- Abre un issue en este repositorio con una descripción detallada.
- O contáctame directamente por email (ver sección de contacto).

Esto ayuda a mantener el proyecto actualizado y útil para todos.

---

## 9. 📬 Contacto

Para dudas, sugerencias o reporte de errores:

**Pedro Alcoba Gómez**  
Técnico ambiental especializado en SIG, teledetección y desarrollo de visores web.  
📧 [pedralcg.dev@gmail.com](mailto:pedralcg.dev@gmail.com)  
🌐 [https://pedralcg.github.io](https://pedralcg.github.io)

---

## 10. 📄 Licencia

Este proyecto está bajo la Licencia **Creative Commons Atribución-NoComercial 4.0 Internacional (CC BY-NC 4.0)**.

Esto significa que puedes:

- **Compartir**: Copiar y redistribuir el material en cualquier medio o formato.
- **Adaptar**: Remezclar, transformar y construir a partir del material.

Bajo las siguientes condiciones:

- **Atribución**: Debes dar crédito de manera adecuada, brindar un enlace a la licencia, e indicar si se han realizado cambios.
- **NoComercial**: No puedes hacer uso del material con propósitos comerciales.

Para ver una copia de esta licencia, visita [http://creativecommons.org/licenses/by-nc/4.0/](http://creativecommons.org/licenses/by-nc/4.0/) o consulta el archivo `LICENSE`.

Para uso comercial, por favor contactar con el autor.

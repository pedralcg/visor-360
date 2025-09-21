# Proyecto QGIS - Visor Fotografías 360

Este archivo `.qgz` contiene el proyecto QGIS utilizado para la edición de los datos del visor web.

## Contenido

- `panoramas.geojson`: ruta principal representada como línea.
- Capa base de fondo para facilitar la localización.

## Uso

1. Abrir el archivo `ubicacion-360.qgz` con QGIS.
2. Realizar modificaciones en las capas GeoJSON:
   - Mover la ubicación de las fotografías panorámicas  360º.
   - Añadir/eliminar/modificar elementos y/o información si fuera necesario.
3. Guardar cambios directamente en los archivos `.geojson` ubicados en `/data/`.

## Notas

- Asegúrate de mantener la estructura de atributos para garantizar la compatibilidad con el visor.
- No es necesario reproyectar las capas: trabajan en EPSG:4326.

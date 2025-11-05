# 🔧 Corrección del Problema de Columnas en Google Sheets

## 📋 Problema Identificado

Las respuestas del formulario se guardaban en columnas incorrectas en Google Sheets porque:

1. **Orden dinámico**: El código anterior usaba `Object.keys(data)` que no garantiza un orden consistente
2. **Headers variables**: Cada envío podía crear headers en diferente orden
3. **Desalineación**: Los valores no coincidían con las columnas correctas

## ✅ Solución Implementada

### 1. **Orden Fijo de Columnas**

Se definió un array `COLUMN_ORDER` con el orden exacto de todas las columnas:

```typescript
const COLUMN_ORDER = [
  "q_1",           // Aceptación de política de datos
  "q_2",           // Nombre completo
  "q_3",           // Género
  "q_4",           // Fecha de nacimiento
  "q_5",           // Número de celular
  "tipoDocumento", // Tipo de documento
  "numeroDocumento", // Número de documento
  "q_7",           // Grupo poblacional
  "q_8",           // Municipio
  "q_8b",          // Barrio
  "q_8c",          // Comuna
  "q_9",           // Dirección
  "q_10",          // Libreta militar
  "q_11",          // ¿Estás estudiando?
  "q_12",          // Qué te gustaría estudiar
  "q_13",          // Qué estás estudiando
  "q_14",          // Actividades deportivas
  "q_15",          // Actividades políticas
  "q_16",          // Actividades sociales
  "q_17",          // Idiomas
  "q_18",          // Redes sociales
  "q_19",          // Conocimientos tecnológicos
  "q_20",          // ¿Tienes emprendimiento?
  "q_21",          // Cuál emprendimiento
  "q_22",          // Tiempo conociendo la iglesia
  "q_23",          // Horario de culto
];
```

### 2. **Headers Legibles**

Se creó un mapeo de claves técnicas a nombres legibles:

```typescript
const COLUMN_HEADERS = {
  "q_1": "Aceptación Política de Datos",
  "q_2": "Nombre Completo",
  "q_3": "Género",
  // ... etc
};
```

### 3. **Mapeo Garantizado**

La función `appendRow` ahora:

- ✅ Usa siempre el mismo orden de columnas
- ✅ Mapea cada valor a su columna correcta
- ✅ Rellena con string vacío si falta un valor
- ✅ Verifica y actualiza headers si no coinciden

## 🎯 Resultado

Ahora **SIEMPRE**:

1. Las columnas están en el mismo orden
2. Cada respuesta va a su columna correcta
3. Los headers son legibles y consistentes
4. No hay desalineación entre registros

## 🔍 Logs de Depuración

El código ahora imprime logs detallados:

```
📊 Orden de columnas: [array con el orden]
📊 Headers: [headers legibles]
📊 Datos recibidos: {objeto con los datos}
📊 Values ordenados: [valores en orden correcto]
```

## 📝 Notas Importantes

### Si ya tienes datos en la hoja:

1. **Opción 1 (Recomendada)**: Crear una nueva hoja limpia
   - Cambia el nombre de la hoja actual (ej: "Sheet1_old")
   - Crea una nueva hoja llamada "Sheet1"
   - Los nuevos registros se guardarán correctamente

2. **Opción 2**: Reorganizar datos existentes
   - Exporta los datos actuales
   - Elimina todo el contenido
   - El próximo registro creará los headers correctos
   - Importa los datos antiguos manualmente

### Verificación

Para verificar que funciona correctamente:

1. Envía un formulario de prueba
2. Revisa los logs en la consola del servidor
3. Verifica que las columnas en Google Sheets coincidan con los headers
4. Confirma que cada respuesta está en su columna correcta

## 🚀 Próximos Pasos

Si necesitas agregar nuevas preguntas al formulario:

1. Agrega la pregunta en `data/questions.ts`
2. Agrega la clave en `COLUMN_ORDER` en `lib/googleSheets.ts`
3. Agrega el header legible en `COLUMN_HEADERS`
4. El orden se mantendrá consistente automáticamente

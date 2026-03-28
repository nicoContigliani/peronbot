# Features del Editor de Árboles

## ✅ Completado (v1)

### Editor Visual
- ✅ Canvas con React Flow (drag & drop)
- ✅ 9 tipos de nodos: TEXT, MENU, INPUT, CONDITION, ACTION, TRANSFER, BROADCAST, AI, END
- ✅ Conexiones entre nodos
- ✅ Panel de propiedades avanzado por tipo de nodo
- ✅ Guardar/cargar árbol desde MongoDB
- ✅ MiniMap y controls

### Editor JSON
- ✅ Vista JSON editable
- ✅ Sincronización bidireccional Canvas ↔ JSON

### Validaciones
- ✅ Detectar nodo raíz faltante
- ✅ Detectar nodos huérfanos
- ✅ Detectar ciclos en el árbol
- ✅ Alertas visuales en el editor

### Nodos Especiales
- ✅ **Broadcast**: Filtros de usuarios (todos, activos, inactivos, por tags), mensaje
- ✅ **IA**: Prompt de sistema, variable de respuesta, selección de modelo (GPT-4, GPT-3.5, Claude 3)

---

## Pendientes (v2)

### Broadcast Avanzado
- [ ] Programación de envío (inmediato/diferido)
- [ ] Métricas (enviados, entregados, fallidos)
- [ ] Rate limiting (límites de WhatsApp)
- [ ] Plantillas de mensaje

### IA Avanzada
- [ ] Integración real con APIs (OpenAI, Anthropic)
- [ ] Contexto de conversación
- [ ] Historial de interacciones
- [ ] Streaming de respuestas

### UX/UI
- [ ] Modo oscuro
- [ ] Keyboard shortcuts
- [ ] Deshacer/Rehacer
- [ ] Zoom automático

### Testing
- [ ] Modo preview (simular conversación)
- [ ] Logs de ejecución

---

## Cómo usar el editor

1. Ir a `/trees` y hacer click en "Editar" en un árbol
2. **Canvas**: Arrastrar nodos, conectar con líneas
3. **Propiedades**: Click en un nodo para editar su contenido
4. **JSON**: Click en botón "JSON" para editar el árbol como código
5. **Validar**: Click en "Validar" para verificar el árbol
6. **Guardar**: Click en "Guardar" para persistir los cambios

### Tipos de nodos

| Tipo | Uso |
|------|-----|
| TEXT | Mensaje simple |
| MENU | Opciones múltiples (1, 2, 3...) |
| INPUT | Pedir dato al usuario |
| CONDITION | branching según variable |
| ACTION | Ejecutar acción (webhook, email...) |
| TRANSFER | Cambiar a otro árbol |
| BROADCAST | Envío masivo |
| IA | Respuesta con LLM |
| END | Fin de conversación |
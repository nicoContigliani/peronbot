// ============================================
// ConversationEngine - Motor de Ejecución de Flujos
// Evalúa input del usuario y determina siguiente nodo
// Soporta: acciones, medios WhatsApp, inicio por cliente
// ============================================

class ConversationEngine {
  constructor(tree) {
    this.tree = tree
    this.nodes = tree.nodes || {}
    this.variables = {} // Variables del usuario
  }
  
  /**
   * Encuentra el siguiente nodo basado en el input del usuario
   * Prioridad: user_options (coincidencia exacta) > logic_conditions (regex/contains)
   * 
   * @param {string} currentNodeId - ID del nodo actual
   * @param {string} userInput - Input del usuario
   * @returns {object|null} - Resultado con nextNodeId y responseText, o null si no hay coincidencia
   */
  findNextNode(currentNodeId, userInput) {
    const currentNode = this.nodes[currentNodeId]
    if (!currentNode) return null
    
    // 1. Primero evaluar user_options (coincidencia exacta)
    if (currentNode.options && Object.keys(currentNode.options).length > 0) {
      for (const [key, option] of Object.entries(currentNode.options)) {
        // Verificar si el input coincide con el texto de la opción
        if (this.matchesOption(userInput, option.text)) {
          return {
            type: 'option',
            key,
            nextNodeId: option.next,
            responseText: option.text
          }
        }
      }
    }
    
    // 2. Si no hay coincidencia exacta, evaluar logic_conditions
    if (currentNode.conditions && currentNode.conditions.length > 0) {
      for (const condition of currentNode.conditions) {
        if (this.matchesCondition(userInput, condition)) {
          return {
            type: 'condition',
            keyword: condition.keyword,
            nextNodeId: condition.next,
            responseText: condition.botMessage
          }
        }
      }
    }
    
    // 3. Si no hay coincidencia, retornar null (mensaje por defecto)
    return null
  }
  
  /**
   * Verifica si el input coincide con una opción
   * Soporta: coincidencia exacta, por número (1, 2, 3), por letra (A, B, C)
   * 
   * @param {string} input - Input del usuario
   * @param {string} optionText - Texto de la opción
   * @returns {boolean} - True si hay coincidencia
   */
  matchesOption(input, optionText) {
    const normalizedInput = input.toLowerCase().trim()
    const normalizedOption = optionText.toLowerCase().trim()
    
    // Coincidencia exacta
    if (normalizedInput === normalizedOption) return true
    
    // Coincidencia por número (1, 2, 3...)
    const numberMatch = normalizedInput.match(/^(\d+)$/)
    if (numberMatch) {
      const optionNumber = normalizedOption.match(/^(\d+)\./)
      if (optionNumber && numberMatch[1] === optionNumber[1]) return true
    }
    
    // Coincidencia por letra (A, B, C...)
    const letterMatch = normalizedInput.match(/^([a-z])$/i)
    if (letterMatch) {
      const optionLetter = normalizedOption.match(/^([a-z])\./i)
      if (optionLetter && letterMatch[1].toLowerCase() === optionLetter[1].toLowerCase()) return true
    }
    
    // Coincidencia por texto parcial (si el input contiene el texto de la opción)
    if (normalizedOption.includes(normalizedInput) || normalizedInput.includes(normalizedOption)) {
      return true
    }
    
    return false
  }
  
  /**
   * Verifica si el input cumple una condición
   * Soporta: contains, equals, startsWith, endsWith
   * 
   * @param {string} input - Input del usuario
   * @param {object} condition - Objeto de condición con keyword y conditionType
   * @returns {boolean} - True si la condición se cumple
   */
  matchesCondition(input, condition) {
    const normalizedInput = input.toLowerCase().trim()
    const normalizedKeyword = condition.keyword.toLowerCase().trim()
    
    switch (condition.conditionType) {
      case 'contains':
        return normalizedInput.includes(normalizedKeyword)
      
      case 'equals':
        return normalizedInput === normalizedKeyword
      
      case 'startsWith':
        return normalizedInput.startsWith(normalizedKeyword)
      
      case 'endsWith':
        return normalizedInput.endsWith(normalizedKeyword)
      
      default:
        return false
    }
  }
  
  /**
   * Procesa un mensaje del usuario y retorna la respuesta del bot
   * Ejecuta acciones si están definidas
   * 
   * @param {string} currentNodeId - ID del nodo actual
   * @param {string} userInput - Input del usuario
   * @returns {Promise<object>} - Resultado con success, message, nextNodeId, responseType
   */
  async processUserInput(currentNodeId, userInput) {
    const currentNode = this.nodes[currentNodeId]
    if (!currentNode) {
      return {
        success: false,
        message: 'Nodo actual no encontrado.',
        nextNodeId: currentNodeId,
        responseType: 'error'
      }
    }
    
    // 1. Evaluar opciones (coincidencia exacta)
    if (currentNode.options && Object.keys(currentNode.options).length > 0) {
      for (const [key, option] of Object.entries(currentNode.options)) {
        if (this.matchesOption(userInput, option.text)) {
          // Ejecutar acciones de la opción
          if (option.actions && option.actions.length > 0) {
            await this.executeActions(option.actions, userInput)
          }
          
          const nextNode = this.nodes[option.next]
          if (!nextNode) {
            return {
              success: false,
              message: 'Error en el flujo de conversación.',
              nextNodeId: currentNodeId,
              responseType: 'error'
            }
          }
          
          return {
            success: true,
            message: nextNode.text,
            nextNodeId: option.next,
            responseType: 'option',
            responseKey: key,
            mediaType: nextNode.mediaType || 'text',
            mediaUrl: nextNode.mediaUrl || null,
            mediaCaption: nextNode.mediaCaption || null,
            location: nextNode.location || null,
            contact: nextNode.contact || null
          }
        }
      }
    }
    
    // 2. Evaluar condiciones (regex/contains)
    if (currentNode.conditions && currentNode.conditions.length > 0) {
      for (const condition of currentNode.conditions) {
        if (this.matchesCondition(userInput, condition)) {
          // Ejecutar acciones de la condición
          if (condition.actions && condition.actions.length > 0) {
            await this.executeActions(condition.actions, userInput)
          }
          
          const nextNode = this.nodes[condition.next]
          if (!nextNode) {
            return {
              success: false,
              message: 'Error en el flujo de conversación.',
              nextNodeId: currentNodeId,
              responseType: 'error'
            }
          }
          
          return {
            success: true,
            message: nextNode.text,
            nextNodeId: condition.next,
            responseType: 'condition',
            responseKey: condition.keyword,
            mediaType: nextNode.mediaType || 'text',
            mediaUrl: nextNode.mediaUrl || null,
            mediaCaption: nextNode.mediaCaption || null,
            location: nextNode.location || null,
            contact: nextNode.contact || null
          }
        }
      }
    }
    
    // 3. Si no hay coincidencia, retornar error
    return {
      success: false,
      message: 'No entendí tu respuesta. Por favor, elegí una opción válida.',
      nextNodeId: currentNodeId,
      responseType: 'error'
    }
  }
  
  /**
   * Ejecuta las acciones de un nodo
   * 
   * @param {array} actions - Array de acciones a ejecutar
   * @param {string} userInput - Input del usuario
   */
  async executeActions(actions, userInput) {
    for (const action of actions) {
      await this.executeAction(action, userInput)
    }
  }
  
  /**
   * Ejecuta una acción individual
   * 
   * @param {object} action - Acción a ejecutar
   * @param {string} userInput - Input del usuario
   */
  async executeAction(action, userInput) {
    switch (action.type) {
      case 'send_message':
        // Enviar mensaje de texto
        console.log('Enviando mensaje:', action.params.text)
        break
      
      case 'send_media':
        // Enviar medio
        console.log('Enviando medio:', action.params.mediaType)
        break
      
      case 'set_variable':
        // Guardar variable
        const value = action.params.value === '{{user_input}}' 
          ? userInput 
          : action.params.value
        this.variables[action.params.variableName] = value
        console.log('Variable guardada:', action.params.variableName, '=', value)
        break
      
      case 'api_call':
        // Llamar a API externa
        try {
          const response = await fetch(action.params.url, {
            method: action.params.method || 'GET',
            headers: action.params.headers || {},
            body: action.params.body ? JSON.stringify(action.params.body) : undefined
          })
          const data = await response.json()
          if (action.params.responseVariable) {
            this.variables[action.params.responseVariable] = data
          }
        } catch (error) {
          console.error('Error en API call:', error)
        }
        break
      
      case 'redirect':
        // Redirigir a otro nodo
        console.log('Redirigiendo a:', action.params.targetNodeId)
        break
      
      case 'notify':
        // Notificar al administrador
        console.log('Notificación:', action.params.message)
        break
      
      default:
        console.warn('Tipo de acción desconocido:', action.type)
    }
  }
  
  /**
   * Verifica si el input del cliente inicia una conversación
   * 
   * @param {string} userInput - Input del usuario
   * @returns {object|null} - Resultado con nextNodeId y keyword, o null
   */
  matchesInitiator(userInput) {
    // Buscar nodos user_initiator
    const initiators = Object.values(this.nodes).filter(n => n.role === 'user_initiator')
    
    for (const initiator of initiators) {
      if (initiator.triggers) {
        for (const trigger of initiator.triggers) {
          if (this.matchesCondition(userInput, trigger)) {
            return {
              nextNodeId: trigger.next,
              keyword: trigger.keyword
            }
          }
        }
      }
    }
    
    return null
  }
  
  /**
   * Procesa un mensaje del cliente que inicia la conversación
   * 
   * @param {string} userInput - Input del usuario
   * @returns {Promise<object>} - Resultado con success, message, nextNodeId
   */
  async processClientInitiation(userInput) {
    const match = this.matchesInitiator(userInput)
    
    if (match) {
      const nextNode = this.nodes[match.nextNodeId]
      if (nextNode) {
        return {
          success: true,
          message: nextNode.text,
          nextNodeId: match.nextNodeId,
          responseType: 'initiation',
          responseKey: match.keyword,
          mediaType: nextNode.mediaType || 'text',
          mediaUrl: nextNode.mediaUrl || null,
          mediaCaption: nextNode.mediaCaption || null,
          location: nextNode.location || null,
          contact: nextNode.contact || null
        }
      }
    }
    
    return {
      success: false,
      message: 'No entendí tu mensaje. Por favor, escribí "hola" para comenzar.',
      nextNodeId: null,
      responseType: 'error'
    }
  }
  
  /**
   * Obtiene las variables del usuario
   * 
   * @returns {object} - Variables del usuario
   */
  getVariables() {
    return { ...this.variables }
  }
  
  /**
   * Establece una variable del usuario
   * 
   * @param {string} name - Nombre de la variable
   * @param {any} value - Valor de la variable
   */
  setVariable(name, value) {
    this.variables[name] = value
  }
  
  /**
   * Obtiene el nodo raíz del árbol
   * 
   * @returns {object|null} - Nodo raíz o null si no existe
   */
  getRootNode() {
    // Buscar nodo con id 'root' o el primer nodo
    return this.nodes['root'] || Object.values(this.nodes)[0] || null
  }
  
  /**
   * Obtiene las opciones disponibles para un nodo
   * 
   * @param {string} nodeId - ID del nodo
   * @returns {array} - Array de opciones disponibles
   */
  getAvailableOptions(nodeId) {
    const node = this.nodes[nodeId]
    if (!node) return []
    
    const options = []
    
    // Añadir opciones del nodo
    if (node.options) {
      Object.entries(node.options).forEach(([key, option]) => {
        options.push({
          type: 'option',
          key,
          text: option.text,
          next: option.next
        })
      })
    }
    
    // Añadir condiciones del nodo
    if (node.conditions) {
      node.conditions.forEach((condition, idx) => {
        options.push({
          type: 'condition',
          key: `cond_${idx}`,
          text: `${condition.conditionType}: ${condition.keyword}`,
          next: condition.next
        })
      })
    }
    
    return options
  }
  
  /**
   * Valida la estructura del árbol
   * 
   * @returns {object} - Resultado de validación con errors y warnings
   */
  validateTree() {
    const errors = []
    const warnings = []
    
    // Verificar que existe nodo raíz
    const rootNode = this.getRootNode()
    if (!rootNode) {
      errors.push('No se encontró nodo raíz en el árbol')
    }
    
    // Verificar nodos huérfanos
    Object.entries(this.nodes).forEach(([nodeId, node]) => {
      // Verificar si tiene salidas
      const hasOutputs = Object.keys(node.options || {}).length > 0 || 
                        (node.conditions || []).length > 0
      
      if (!hasOutputs && node.role === 'system_bot') {
        warnings.push(`Nodo bot ${nodeId} no tiene salidas definidas`)
      }
      
      // Verificar si tiene entrada
      const hasInput = Object.values(this.nodes).some(otherNode => 
        Object.values(otherNode.options || {}).some(opt => opt.next === nodeId) ||
        (otherNode.conditions || []).some(cond => cond.next === nodeId)
      )
      
      if (!hasInput && nodeId !== 'root' && node.role !== 'system_bot') {
        warnings.push(`Nodo ${nodeId} no tiene entrada definida`)
      }
    })
    
    // Verificar nodos referenciados que no existen
    Object.entries(this.nodes).forEach(([nodeId, node]) => {
      if (node.options) {
        Object.entries(node.options).forEach(([key, option]) => {
          if (option.next && !this.nodes[option.next]) {
            errors.push(`Nodo ${nodeId} referencia a nodo inexistente ${option.next} en opción ${key}`)
          }
        })
      }
      
      if (node.conditions) {
        node.conditions.forEach((condition, idx) => {
          if (condition.next && !this.nodes[condition.next]) {
            errors.push(`Nodo ${nodeId} referencia a nodo inexistente ${condition.next} en condición ${idx}`)
          }
        })
      }
    })
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Exporta el árbol a formato JSON
   * 
   * @returns {object} - Árbol en formato JSON
   */
  exportTree() {
    return {
      nodes: this.nodes,
      metadata: {
        exportedAt: new Date().toISOString(),
        nodeCount: Object.keys(this.nodes).length
      }
    }
  }
  
  /**
   * Importa un árbol desde formato JSON
   * 
   * @param {object} treeData - Datos del árbol en formato JSON
   * @returns {boolean} - True si la importación fue exitosa
   */
  importTree(treeData) {
    try {
      if (!treeData.nodes) {
        throw new Error('Formato de árbol inválido: falta propiedad "nodes"')
      }
      
      this.nodes = treeData.nodes
      this.tree = treeData
      
      // Validar después de importar
      const validation = this.validateTree()
      if (!validation.isValid) {
        console.warn('Advertencias de validación:', validation.warnings)
      }
      
      return true
    } catch (error) {
      console.error('Error importando árbol:', error)
      return false
    }
  }
}

module.exports = ConversationEngine

/**
 * Conversation Tree: Main Menu
 * This is the entry point that shows the main options
 */
import { ConversationTree, NodeType } from '@/core/ConversationTree.js';

export const mainMenuTree = new ConversationTree('main', 'Main menu - entry point')
    // Root - Main menu
    .addTextNode(
        'root',
        '👋 *¡Bienvenido a Bototo!*\n\nSoy tu asistente virtual. ¿En qué puedo ayudarte hoy?',
        'menu'
    )
    // Main menu with ventas and asistencia
    .addMenuNode(
        'menu',
        'Selecciona una opción:',
        {
            '1': { text: '🛒 Ventas', next: 'ventas' },
            '2': { text: '🛟 Asistencia', next: 'asistencia' },
            '3': { text: '📊 Encuesta de satisfacción', next: 'survey' },
            '4': { text: 'ℹ️ Información general', next: 'info' },
            '5': { text: '📞 Hablar con un agente', next: 'agent' }
        }
    )
    
    // Transfer to ventas tree
    .addTransferNode('ventas', 'ventas', 'root')
    
    // Transfer to asistencia tree
    .addTransferNode('asistencia', 'asistencia', 'root')
    
    // Survey
    .addTextNode(
        'survey',
        '📊 *Encuesta de Satisfacción*\n\n¡Gracias por contactarnos! Nos gustaría conocer tu opinión.\n\n¿Te generó una experiencia positiva?',
        'satisfaction'
    )
    .addMenuNode(
        'satisfaction',
        '',
        {
            '1': { text: '⭐ Excelente', next: 'excellent' },
            '2': { text: '⭐⭐ Muy bueno', next: 'good' },
            '3': { text: '⭐⭐⭐ Regular', next: 'regular' },
            '4': { text: '⭐⭐⭐⭐ Malo', next: 'bad' }
        }
    )
    .addTextNode('excellent', '¡Nos alegra mucho saberlo! 🎉\n\n¿Hay algo específico que te gustaría destacar?', 'feedback')
    .addTextNode('good', '¡Gracias! 😊 Nos alegra saber que estuvo bien.\n\n¿Hay algo que podríamos mejorar?', 'feedback')
    .addTextNode('regular', 'Entendemos. ¿Qué podríamos hacer para mejorar tu experiencia?', 'feedback')
    .addTextNode('bad', 'Lamentamos la experiencia. 😔\n\n¿Podrías tellnos qué salió mal?', 'feedback')
    .addInputNode('feedback', 'Tu feedback:', 'comment', 'thank_you')
    .addTextNode('thank_you', '🙏 *¡Muchas gracias por tu feedback!*\n\nTu opinión nos ayuda a mejorar.\n\n¿Hay algo más?', 'menu')
    
    // Info
    .addTextNode(
        'info',
        'ℹ️ *Información General*\n\nSoy un bot de WhatsApp creado con:\n\n• 🤖 Baileys (WhatsApp API)\n• 🌳 Árboles de conversación reutilizables\n• 🗄️  MongoDB para persistencia\n• 🔄 Auto-reconexión\n• 🎯 Manejo de errores completo\n\n¿Hay algo más?',
        'menu'
    )
    
    // Agent
    .addTextNode(
        'agent',
        '📞 *Hablar con un Agente*\n\nPerfecto! Un agente humano te atenderá.\n\nMientras tanto, ¿podrías decirnos en qué tema necesitas ayuda?',
        'agent_topic'
    )
    .addMenuNode(
        'agent_topic',
        '',
        {
            '1': { text: 'Ventas', next: 'agent_ventas' },
            '2': { text: 'Asistencia técnica', next: 'agent_asistencia' },
            '3': { text: 'Otro', next: 'agent_otro' }
        }
    )
    .addTextNode('agent_ventas', 'Te conectamos con un vendedor. Por favor espera...', 'agent_wait')
    .addTextNode('agent_asistencia', 'Te conectamos con soporte técnico. Por favor espera...', 'agent_wait')
    .addTextNode('agent_otro', 'Te conectamos con un agente. Por favor espera...', 'agent_wait')
    .addTextNode('agent_wait', '✅ Tu solicitud ha sido registrada. Un agente te contactará en breve.\n\n¿Hay algo más?', 'menu')
    
    // End
    .addEndNode('end', '¡Gracias por contactarnos! 👋\n\nEscríbenos *hola* cuando necesites ayuda.')
    .setRoot('root')
    .build();

export default mainMenuTree;

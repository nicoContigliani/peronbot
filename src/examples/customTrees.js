/**
 * Custom Conversation Trees Examples
 * 
 * This file shows how to create custom conversation trees
 * for your Bototo bot.
 * 
 * Copy this content to src/handlers/messageHandler.js
 * to replace the default conversation trees.
 */
import { 
    ConversationTree, 
    ConversationEngine, 
    NodeType 
} from '../core/ConversationTree.js';

/**
 * Create a custom conversation engine with your trees
 * @returns {ConversationEngine} Configured engine
 */
export function createCustomEngine() {
    const engine = new ConversationEngine();

    // Example 1: Order Processing Tree
    const orderTree = new ConversationTree('orders', 'Order processing flow')
        // Root node - welcome
        .addTextNode(
            'root', 
            '🛒 *Pedidos Online*\n\nBienvenido al sistema de pedidos.\n\n¿Qué deseas hacer?',
            'menu'
        )
        // Menu node with options
        .addMenuNode(
            'menu', 
            'Selecciona una opción:',
            {
                '1': { text: 'Hacer un nuevo pedido', next: 'new_order' },
                '2': { text: 'Ver estado de pedido', next: 'track_order' },
                '3': { text: 'Cancelar pedido', next: 'cancel_order' },
                '0': { text: 'Salir', next: 'end' }
            }
        )
        // New order flow
        .addTextNode(
            'new_order',
            '📝 *Nuevo Pedido*\n\n¿Qué producto te gustaría ordenar?',
            'product_input'
        )
        .addInputNode(
            'product_input',
            'Escribe el nombre del producto:',
            'product',
            'quantity_input'
        )
        .addInputNode(
            'quantity_input',
            '¿Cuántas unidades?',
            'quantity',
            'confirm_order'
        )
        // Conditional node based on quantity
        .addConditionNode(
            'confirm_order',
            'quantity',
            {
                '0': 'quantity_input', // If 0, ask again
                '1': 'confirm_low',
                '10': 'confirm_high'
            },
            'confirm_normal'
        )
        .addTextNode('confirm_low', 'Perfecto! 1 unidad. ¿Confirmar?', 'finalize')
        .addTextNode('confirm_normal', 'Perfecto! {{quantity}} unidades. ¿Confirmar?', 'finalize')
        .addTextNode('confirm_high', '¡Gran pedido! {{quantity}} unidades. ¿Confirmar?', 'finalize')
        // Action node to process order
        .addActionNode(
            'finalize',
            async (context) => {
                // Here you could save to database, call API, etc.
                console.log('Processing order:', context);
                context.orderId = 'ORD-' + Date.now();
                context.status = 'confirmed';
            },
            'order_confirmed'
        )
        .addTextNode(
            'order_confirmed',
            '✅ *Pedido Confirmado!*\n\nTu número de pedido es: {{orderId}}\n\nGracias por tu compra!',
            'menu'
        )
        // Tracking
        .addInputNode(
            'track_order',
            'Ingresa tu número de pedido:',
            'orderId',
            'show_status'
        )
        .addTextNode(
            'show_status',
            '📦 *Estado del Pedido*\n\nPedido: {{orderId}}\nEstado: En proceso\n\n¿Hay algo más?',
            'menu'
        )
        // Cancel
        .addInputNode(
            'cancel_order',
            'Ingresa el número de pedido a cancelar:',
            'cancelId',
            'confirm_cancel'
        )
        .addMenuNode(
            'confirm_cancel',
            '¿Confirmas la cancelación?',
            {
                'si': { text: 'Sí, cancelar', next: 'cancelled' },
                'no': { text: 'No, mantener', next: 'menu' }
            }
        )
        .addTextNode('cancelled', '✅ Pedido {{cancelId}} ha sido cancelado.\n\n¿Hay algo más?', 'menu')
        // End
        .addEndNode('end', 'Gracias por usar nuestro sistema. ¡Hasta luego! 👋')
        .setRoot('root')
        .build();

    // Example 2: FAQ Tree
    const faqTree = new ConversationTree('faq', 'Frequently Asked Questions')
        .addTextNode(
            'root',
            '❓ *Preguntas Frecuentes*\n\nSelecciona un tema:',
            'menu'
        )
        .addMenuNode(
            'menu',
            '',
            {
                '1': { text: '🌡️ Horarios de atención', next: 'hours' },
                '2': { text: '📍 Ubicación', next: 'location' },
                '3': { text: '📞 Contacto', next: 'contact' },
                '4': { text: '💰 Métodos de pago', next: 'payment' },
                '0': { text: 'Volver', next: 'exit' }
            }
        )
        .addTextNode(
            'hours',
            '🕐 *Horarios de Atención*\n\n• Lunes a Viernes: 9:00 - 18:00\n• Sábados: 9:00 - 13:00\n• Domingos: Cerrado\n\n¿Hay algo más?',
            'menu'
        )
        .addTextNode(
            'location',
            '📍 *Nuestra Ubicación*\n\nAv. Principal 123\nCiudad, País\n\n¿Necesitas más información?',
            'menu'
        )
        .addTextNode(
            'contact',
            '📞 *Contacto*\n\n• Tel: +54 11 1234-5678\n• Email: info@ejemplo.com\n• WhatsApp: +54 9 11 1234-5678\n\n¿Hay algo más?',
            'menu'
        )
        .addTextNode(
            'payment',
            '💰 *Métodos de Pago*\n\n• Efectivo\n• Tarjeta de Crédito/Débito\n• Transferencia Bancaria\n• MercadoPago\n\n¿Hay algo más?',
            'menu'
        )
        .addEndNode('exit', 'Volviendo al menú principal...')
        .setRoot('root')
        .build();

    // Example 3: Lead Generation Tree
    const leadGenTree = new ConversationTree('leadgen', 'Lead generation flow')
        .addTextNode(
            'root',
            '👋 ¡Hola! Bienvenido/a.\n\nSomos una empresa especializada en soluciones digitales.\n\n¿Te gustaría recibir información sobre nuestros servicios?',
            'interest'
        )
        .addMenuNode(
            'interest',
            '',
            {
                'si': { text: 'Sí, me interesa', next: 'get_name' },
                'no': { text: 'No, gracias', next: 'no_interest' }
            }
        )
        .addTextNode(
            'no_interest',
            '¡Ok! Si en algún momento necesitas más información, no dudes en escribir.\n\n¡Que tengas un buen día! 👋'
        )
        .addInputNode(
            'get_name',
            '¡Genial! Primero, ¿cuál es tu nombre?',
            'name',
            'get_email'
        )
        .addInputNode(
            'get_email',
            'Perfecto {{name}}. ¿Cuál es tu correo electrónico?',
            'email',
            'get_interest'
        )
        .addMenuNode(
            'get_interest',
            '¿Qué tipo de solución te interesa?',
            {
                '1': { text: 'Desarrollo Web', next: 'web' },
                '2': { text: 'Apps Móviles', next: 'mobile' },
                '3': { text: 'Marketing Digital', next: 'marketing' },
                '4': { text: 'Otro', next: 'other' }
            }
        )
        .addTextNode(
            'web',
            '🌐 *Desarrollo Web*\n\nCreamos sitios web profesionales, tiendas online y sistemas personalizados.\n\n¿Te gustaría agendar una consultoría gratuita?',
            'consultation'
        )
        .addTextNode(
            'mobile',
            '📱 *Apps Móviles*\n\nDesarrollamos apps nativas e híbridas para iOS y Android.\n\n¿Te gustaría agendar una consultoría gratuita?',
            'consultation'
        )
        .addTextNode(
            'marketing',
            '📣 *Marketing Digital*\n\nServicios de SEO, publicidad, redes sociales y más.\n\n¿Te gustaría agendar una consultoría gratuita?',
            'consultation'
        )
        .addTextNode(
            'other',
            'Cuéntanos más sobre lo que necesitas:',
            'other_detail'
        )
        .addInputNode(
            'other_detail',
            'Escribe los detalles:',
            'details',
            'consultation'
        )
        .addMenuNode(
            'consultation',
            '',
            {
                'si': { text: 'Sí, agendar', next: 'get_phone' },
                'no': { text: 'Más tarde', next: 'finish' }
            }
        )
        .addInputNode(
            'get_phone',
            'Perfecto. ¿Cuál es tu número de teléfono?',
            'phone',
            'finish'
        )
        .addTextNode(
            'finish',
            '✅ *¡Gracias por tu interés!*\n\n{{name}}, hemos registrado tu información:\n• Email: {{email}}\n• Tel: {{phone}}\n• Interés: {{interest}}\n\nUn asesor te contactará pronto. 👋'
        )
        .setRoot('root')
        .build();

    // Register all trees
    engine.registerTrees([orderTree, faqTree, leadGenTree]);

    return engine;
}

export default { createCustomEngine };

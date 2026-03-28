/**
 * Conversation Tree: Asistencia (Support)
 * This tree handles all support-related conversations
 */
import { ConversationTree, NodeType } from '@/core/ConversationTree.js';

export const asistenciaTree = new ConversationTree('asistencia', 'Customer support conversation flow')
    // Root - Main menu
    .addTextNode(
        'root',
        '🛟 *¡Bienvenido al Centro de Asistencia!*\n\nEstoy aquí para ayudarte.\n\n¿En qué puedo colaborar?',
        'menu'
    )
    // Main menu
    .addMenuNode(
        'menu',
        'Selecciona una opción:',
        {
            '1': { text: 'Problemas técnicos', next: 'tecnicos' },
            '2': { text: 'Facturación y pagos', next: 'facturacion' },
            '3': { text: 'Envíos y entregas', next: 'envios' },
            '4': { text: 'Devoluciones', next: 'devoluciones' },
            '5': { text: 'Otras consultas', next: 'otras' },
            '0': { text: 'Volver al menú principal', next: 'exit' }
        }
    )
    
    // Technical problems
    .addTextNode(
        'tecnicos',
        '🔧 *Soporte Técnico*\n\nCuéntanos qué problema estás experimentando:',
        'tipo_problema'
    )
    .addMenuNode(
        'tipo_problema',
        '',
        {
            '1': { text: 'No puedo acceder a mi cuenta', next: 'problema_cuenta' },
            '2': { text: 'Error en la app/web', next: 'problema_app' },
            '3': { text: 'Producto defectuoso', next: 'producto_defectuoso' },
            '4': { text: 'Otro problema', next: 'otro_problema' },
            '0': { text: 'Volver', next: 'menu' }
        }
    )
    .addTextNode(
        'problema_cuenta',
        '🔐 *Problemas con tu Cuenta*\n\n• ¿Olvidaste tu contraseña?\n• ¿Tu cuenta está bloqueada?\n• ¿No puedes iniciar sesión?\n\n¿Qué situación aplica?',
        'menu_cuenta'
    )
    .addMenuNode(
        'menu_cuenta',
        '',
        {
            '1': { text: 'Olvidé mi contraseña', next: 'recuperar_password' },
            '2': { text: 'Cuenta bloqueada', next: 'cuenta_bloqueada' },
            '3': { text: 'No puedo iniciar sesión', next: 'login_problema' },
            '0': { text: 'Volver', next: 'menu' }
        }
    )
    .addTextNode(
        'recuperar_password',
        '🔑 *Recuperar Contraseña*\n\nPara recuperar tu contraseña:\n1. Ve a la página de inicio\n2. Click en "Olvidé mi contraseña"\n3. Ingresa tu email\n4. Revisa tu bandeja de entrada\n\n¿Necesitas más ayuda?',
        'menu'
    )
    .addTextNode(
        'cuenta_bloqueada',
        '🔒 *Cuenta Bloqueada*\n\nTu cuenta puede haber sido bloqueada por:\n• Múltiples intentos fallidos\n• Actividad sospechosa\n• Incumplimiento de términos\n\nPor favor, contacta a soporte@empresa.com\n\n¿Hay algo más?',
        'menu'
    )
    .addTextNode(
        'login_problema',
        '🔑 *Problemas de Inicio de Sesión*\n\n• Verifica tu conexión a internet\n• Asegúrate de usar el email correcto\n• Borra caché y cookies\n• Intenta desde otro navegador\n\n¿Funciona?',
        'menu'
    )
    .addTextNode(
        'problema_app',
        '📱 *Problemas con la App/Web*\n\n• ¿Qué error estás viendo?\n• ¿En qué dispositivo ocurre?\n• ¿Cuándo empezó el problema?\n\nCuéntanos más detalles:',
        'detalle_app'
    )
    .addInputNode(
        'detalle_app',
        'Describe el problema:',
        'descripcion',
        'seguimiento_app'
    )
    .addTextNode(
        'seguimiento_app',
        '✅ Gracias por el reporte. Nuestro equipo técnico lo revisará.\n\nTe contactaremos si necesitamos más información.\n\n¿Hay algo más?',
        'menu'
    )
    .addTextNode(
        'producto_defectuoso',
        '📦 *Producto Defectuoso*\n\nLamentamos el problema. Para ayudarte:\n\n1. ¿Tienes el recibo/factura?\n2. ¿Cuándo compraste el producto?\n3. ¿Cuál es el defecto?\n\nCuéntanos:',
        'detalle_defecto'
    )
    .addInputNode(
        'detalle_defecto',
        'Describe el defecto:',
        'descripcion',
        'seguimiento_defecto'
    )
    .addTextNode(
        'seguimiento_defecto',
        '✅ Entendido. Te indicamos los pasos:\n\n1. Envía fotos del defecto\n2. Guarda el producto original\n3. Te enviaremos una etiqueta de retorno\n\n¿Hay algo más?',
        'menu'
    )
    .addInputNode(
        'otro_problema',
        'Describe tu problema:',
        'descripcion',
        'seguimiento_otro'
    )
    .addTextNode(
        'seguimiento_otro',
        '✅ Gracias por contactarnos. Un agente revisará tu caso.\n\nTicket #: TKT-{{timestamp}}\n\n¿Hay algo más?',
        'menu'
    )
    
    // Billing
    .addTextNode(
        'facturacion',
        '💳 *Facturación y Pagos*\n\n¿En qué podemos ayudarte?',
        'menu_facturacion'
    )
    .addMenuNode(
        'menu_facturacion',
        '',
        {
            '1': { text: 'Consultar factura', next: 'consultar_factura' },
            '2': { text: 'Métodos de pago', next: 'metodos_pago' },
            '3': { text: 'Problema con pago', next: 'problema_pago' },
            '4': { text: 'Solicitar factura A', next: 'factura_a' },
            '0': { text: 'Volver', next: 'menu' }
        }
    )
    .addInputNode(
        'consultar_factura',
        'Ingresa tu número de cliente o factura:',
        'numero',
        'mostrar_factura'
    )
    .addTextNode(
        'mostrar_factura',
        '📄 *Factura #{{numero}}*\n\n• Fecha: DD/MM/AAAA\n• Total: $XXXX\n• Estado: Pendiente/Pagada\n\n¿Necesitas algo más?',
        'menu'
    )
    .addTextNode(
        'metodos_pago',
        '💰 *Métodos de Pago*\n\n• Tarjeta de Crédito (Visa, Mastercard, Amex)\n• Tarjeta de Débito\n• Efectivo (solo en tienda)\n• Transferencia Bancaria\n• MercadoPago\n• PayPal\n\n¿Tienes alguna pregunta?',
        'menu'
    )
    .addInputNode(
        'problema_pago',
        'Describe el problema con tu pago:',
        'descripcion',
        'seguimiento_pago'
    )
    .addTextNode(
        'seguimiento_pago',
        '✅ Entendido. Un agente de facturación te contactará en 24-48 horas.\n\nTu caso ha sido registrado.\n\n¿Hay algo más?',
        'menu'
    )
    .addInputNode(
        'factura_a',
        'Ingresa tu CUIT/CUIL:',
        'cuit',
        'confirmar_factura'
    )
    .addTextNode(
        'confirmar_factura',
        '✅ Solicitada Factura A para CUIT: {{cuit}}\n\nTe la enviaremos por email en 24-48 horas.\n\n¿Hay algo más?',
        'menu'
    )
    
    // Shipping
    .addTextNode(
        'envios',
        '📦 *Envíos y Entregas*\n\n¿En qué podemos ayudarte?',
        'menu_envios'
    )
    .addMenuNode(
        'menu_envios',
        '',
        {
            '1': { text: 'Rastrear pedido', next: 'rastrear' },
            '2': { text: 'Tiempo de entrega', next: 'tiempo_entrega' },
            '3': { text: 'Cambiar dirección', next: 'cambiar_direccion' },
            '4': { text: 'No recibí mi pedido', next: 'pedido_no_llego' },
            '0': { text: 'Volver', next: 'menu' }
        }
    )
    .addInputNode(
        'rastrear',
        'Ingresa el número de seguimiento:',
        'seguimiento',
        'mostrar_rastreo'
    )
    .addTextNode(
        'mostrar_rastreo',
        '📍 *Estado del Envío*\n\nSeguimiento: {{seguimiento}}\n\n• Pedido confirmado\n• En preparación\n• En tránsito\n• Entregado (pendiente)\n\n¿Necesitas algo más?',
        'menu'
    )
    .addTextNode(
        'tiempo_entrega',
        '⏱️ *Tiempos de Entrega*\n\n• CABA: 24-48 horas\n• GBA: 2-3 días\n• Interior: 3-7 días\n• Express: mismo día (según zona)\n\n¿Hay algo más?',
        'menu'
    )
    .addInputNode(
        'cambiar_direccion',
        'Ingresa tu número de pedido:',
        'pedido',
        'nueva_direccion'
    )
    .addInputNode(
        'nueva_direccion',
        'Ingresa la nueva dirección:',
        'direccion',
        'confirmar_direccion'
    )
    .addTextNode(
        'confirmar_direccion',
        '✅ Dirección actualizada para pedido {{pedido}}.\n\nNueva dirección: {{direccion}}\n\n¿Hay algo más?',
        'menu'
    )
    .addInputNode(
        'pedido_no_llego',
        'Ingresa tu número de pedido:',
        'pedido',
        'seguimiento_no_llego'
    )
    .addTextNode(
        'seguimiento_no_llego',
        'Lamentamos el problema. Vamos a investigar.\n\nPor favor, verifica:\n• Tu dirección\n• Que haya alguien en el domicilio\n• El estado en el seguimiento\n\nUn agente te contactará.\n\n¿Hay algo más?',
        'menu'
    )
    
    // Returns
    .addTextNode(
        'devoluciones',
        '🔄 *Devoluciones*\n\n¿En qué podemos ayudarte?',
        'menu_devoluciones'
    )
    .addMenuNode(
        'menu_devoluciones',
        '',
        {
            '1': { text: 'Cómo devolver un producto', next: 'como_devolver' },
            '2': { text: 'Estado de mi devolución', next: 'estado_devolucion' },
            '3': { text: 'Reembolso', next: 'reembolso' },
            '0': { text: 'Volver', next: 'menu' }
        }
    )
    .addTextNode(
        'como_devolver',
        '📤 *Cómo Devolver*\n\n1. El producto debe estar sin usar\n2. Incluye el recibo original\n3. Empaque original\n4. Solicita la devolución en tu cuenta\n\n¿Tienes más preguntas?',
        'menu'
    )
    .addInputNode(
        'estado_devolucion',
        'Ingresa tu número de devolución:',
        'devolucion',
        'mostrar_estado_devolucion'
    )
    .addTextNode(
        'mostrar_estado_devolucion',
        '📋 *Estado de Devolución*\n\nDevolución: {{devolucion}}\n\n• Solicitada\n• En revisión\n• Aprobada\n• Reembolso en proceso\n\n¿Hay algo más?',
        'menu'
    )
    .addTextNode(
        'reembolso',
        '💵 *Información de Reembolso*\n\n• Tarjeta: 5-10 días hábiles\n• Transferencia: 3-5 días hábiles\n• Efectivo: en tienda\n\nEl tiempo depende de tu banco.\n\n¿Hay algo más?',
        'menu'
    )
    
    // Other
    .addTextNode(
        'otras',
        '📝 *Otras Consultas*\n\nCuéntanos en qué podemos ayudarte:',
        'consulta_otra'
    )
    .addInputNode(
        'consulta_otra',
        'Tu consulta:',
        'mensaje',
        'seguimiento_otra'
    )
    .addTextNode(
        'seguimiento_otra',
        '✅ Tu consulta ha sido registrada.\n\nTicket #: TKT-{{timestamp}}\n\nUn agente te contactará pronto.\n\n¿Hay algo más?',
        'menu'
    )
    
    // Exit
    .addEndNode('exit', 'Gracias por contactarnos. ¡Que tengas un excelente día! 👋')
    .setRoot('root')
    .build();

export default asistenciaTree;

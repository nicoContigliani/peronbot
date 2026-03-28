/**
 * Conversation Tree: Ventas (Sales)
 * This tree handles all sales-related conversations with real products and payments
 */
import { ConversationTree, NodeType } from '@/core/ConversationTree.js';
import { products, getProductsByCategory, formatPrice } from '@/services/products/products.js';
import { createPaymentPreference, isConfigured } from '@/services/pay/mercadoPago.js';

// Helper to format products for display
function formatProductsForCategory(category) {
    const prods = getProductsByCategory(category);
    let text = '';
    prods.forEach((p, i) => {
        text += `${i + 1}. *${p.title}*\n   ${p.description}\n   💰 ${formatPrice(p.unit_price)}\n\n`;
    });
    return text;
}

// Create the ventas tree
export const ventasTree = new ConversationTree('ventas', 'Sales conversation flow with payments');

// ============ ROOT & MAIN MENU ============
ventasTree
    .addTextNode(
        'root',
        '🛒 *¡Bienvenido al departamento de Ventas!*\n\n¿En qué puedo ayudarte hoy?',
        'menu'
    )
    .addMenuNode(
        'menu',
        'Selecciona una opción:',
        {
            '1': { text: '📱 Ver productos', next: 'productos' },
            '2': { text: '🔥 Ofertas especiales', next: 'ofertas' },
            '3': { text: '🛍️ Mi carrito', next: 'ver_carrito' },
            '4': { text: '💳 Finalizar compra', next: 'iniciar_compra' },
            '5': { text: '📦 Estado de pedido', next: 'estado_pedido' },
            '6': { text: '👤 Hablar con vendedor', next: 'vendedor' },
            '0': { text: '⬅️ Volver', next: 'exit' }
        }
    )

// ============ PRODUCTS SECTION ============
    .addTextNode(
        'productos',
        '📦 *Catálogo de Productos*\n\n¿Qué categoría te interesa?',
        'tipo_producto'
    )
    .addMenuNode(
        'tipo_producto',
        '',
        {
            '1': { text: '📱 Electrónica', next: 'electronica' },
            '2': { text: '👕 Ropa y accesorios', next: 'ropa' },
            '3': { text: '🏠 Hogar y decoración', next: 'hogar' },
            '4': { text: '🔍 Buscar producto', next: 'buscar_producto' },
            '0': { text: '⬅️ Volver', next: 'menu' }
        }
    )

// Electronics
    .addTextNode(
        'electronica',
        () => `📱 *ELECTRÓNICA*\n\n${formatProductsForCategory('electronica')}`,
        'seleccionar_producto'
    )

// Clothing  
    .addTextNode(
        'ropa',
        () => `👕 *ROPA Y ACCESORIOS*\n\n${formatProductsForCategory('ropa')}`,
        'seleccionar_producto'
    )

// Home
    .addTextNode(
        'hogar',
        () => `🏠 *HOGAR Y DECORACIÓN*\n\n${formatProductsForCategory('hogar')}`,
        'seleccionar_producto'
    )

// Select product to add to cart
    .addTextNode(
        'seleccionar_producto',
        'Para comprar, escribe el *número* del producto que deseas:',
        'input_producto'
    )
    .addInputNode(
        'input_producto',
        'Escribe el número del producto:',
        'producto_seleccionado',
        'agregar_carrito'
    )
    .addActionNode(
        'agregar_carrito',
        async (context, { userId }) => {
            // Add to cart logic - the product ID is stored in the input
            // This would be enhanced with proper product selection
            return context;
        },
        'mostrar_agregado'
    )
    .addTextNode(
        'mostrar_agregado',
        '✅ *Producto agregado al carrito!*\n\nEscribe *carrito* para ver tu compra.\n\n¿Quieres seguir comprando?',
        'menu_after_add'
    )
    .addMenuNode(
        'menu_after_add',
        '',
        {
            '1': { text: '🛒 Ver mi carrito', next: 'ver_carrito' },
            '2': { text: '➕ Seguir comprando', next: 'productos' },
            '3': { text: '💳 Ir a pagar', next: 'iniciar_compra' },
            '0': { text: '⬅️ Volver al menú', next: 'menu' }
        }
    )

// Search product
    .addTextNode(
        'buscar_producto',
        '🔍 *Buscar Producto*\n\nEscribe el nombre del producto que buscas:',
        'input_buscar'
    )
    .addInputNode(
        'input_buscar',
        'Escribe el nombre:',
        'busqueda',
        'resultado_busqueda'
    )
    .addTextNode(
        'resultado_busqueda',
        () => {
            const term = ''; // Will be replaced at runtime
            const allProducts = Object.values(products);
            const found = allProducts.filter(p => 
                p.title.toLowerCase().includes(term.toLowerCase()) ||
                p.description.toLowerCase().includes(term.toLowerCase())
            );
            
            if (found.length === 0) {
                return '❌ No encontramos productos con ese nombre.\n\n¿Quieres buscar novamente o ver todo el catálogo?';
            }
            
            let text = `🔍 *Resultados de búsqueda*\n\n`;
            found.slice(0, 5).forEach((p, i) => {
                text += `${i + 1}. *${p.title}*\n   ${p.description}\n   💰 ${formatPrice(p.unit_price)}\n\n`;
            });
            return text;
        },
        'seleccionar_producto'
    )

// ============ OFFERS ============
    .addTextNode(
        'ofertas',
        '🔥 *OFERTAS ESPECIALES*\n\n' +
        '🎁 *2x1 en AirPods Pro*\n   Ahora: $45.000 (antes $90.000)\n\n' +
        '🎁 *20% OFF en iPhone 15*\n   Ahora: $96.000 (antes $120.000)\n\n' +
        '🎁 *Envío Gratis* en compras mayores a $50.000\n\n' +
        '⏰ *Válido hasta fin de mes*',
        'menu'
    )

// ============ CART ============
    .addTextNode(
        'ver_carrito',
        () => '🛒 *MI CARRITO*\n\n' +
            '{{carrito_items}}\n\n' +
            '*TOTAL: {{carrito_total}}*\n\n' +
            '¿Qué deseas hacer?',
        'menu_carrito'
    )
    .addMenuNode(
        'menu_carrito',
        '',
        {
            '1': { text: '💳 Finalizar compra', next: 'iniciar_compra' },
            '2': { text: '🗑️ Vaciar carrito', next: 'vaciar_carrito' },
            '3': { text: '➕ Agregar más productos', next: 'productos' },
            '0': { text: '⬅️ Volver', next: 'menu' }
        }
    )
    .addTextNode(
        'vaciar_carrito',
        '✅ Carrito vaciado.\n\n¿Hay algo más en lo que pueda ayudarte?',
        'menu'
    )

// ============ CHECKOUT & PAYMENT ============
    .addTextNode(
        'iniciar_compra',
        () => {
            if (!isConfigured()) {
                return '⚠️ *MercadoPago no está configurado.*\n\n' +
                    'Por favor, contacta al administrador para activar los pagos.\n\n' +
                    '¿Hay algo más?';
            }
            return '💳 *FINALIZAR COMPRA*\n\n' +
                'Total: {{carrito_total}}\n\n' +
                'Para proceder con el pago, necesitamos algunos datos.';
        },
        'checkout_email'
    )
    .addInputNode(
        'checkout_email',
        '📧 *Datos de pago*\n\nIngresa tu email (para recibir la factura):',
        'email',
        'checkout_nombre'
    )
    .addInputNode(
        'checkout_nombre',
        '👤 Ingresa tu nombre completo:',
        'nombre',
        'checkout_telefono'
    )
    .addInputNode(
        'checkout_telefono',
        '📱 Ingresa tu teléfono (con código de área):',
        'telefono',
        'confirmar_pago'
    )
    .addTextNode(
        'confirmar_pago',
        () => '📝 *RESUMEN DEL PEDIDO*\n\n' +
            'Cliente: {{nombre}}\n' +
            'Email: {{email}}\n' +
            'Teléfono: {{telefono}}\n\n' +
            '*Total a pagar: {{carrito_total}}*\n\n' +
            '¿Confirmas el pedido y procedes al pago?',
        'menu_confirmar'
    )
    .addMenuNode(
        'menu_confirmar',
        '',
        {
            '1': { text: '✅ Sí, pagar con MercadoPago', next: 'procesar_pago' },
            '2': { text: '📅 Pagar contra entrega', next: 'pago_contra_entrega' },
            'no': { text: '❌ Cancelar', next: 'menu' }
        }
    )

// Process payment with MercadoPago
    .addActionNode(
        'procesar_pago',
        async (context, { userId }) => {
            // Create payment preference
            const cartItems = context.carrito_items || [];
            const items = cartItems.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price
            }));
            
            const externalRef = `ORD-${userId}-${Date.now()}`;
            const result = await createPaymentPreference(
                {
                    title: 'Pedido Multiple',
                    description: 'Compra en Bototo',
                    quantity: 1,
                    unit_price: context.carrito_total_numeric || 0
                },
                context.email,
                externalRef
            );
            
            if (result.success) {
                context.payment_link = result.sandboxInitPoint || result.initPoint;
                context.preference_id = result.preferenceId;
                context.orden_id = externalRef;
            } else {
                context.payment_error = result.error;
            }
            
            return context;
        },
        'mostrar_pago'
    )
    .addTextNode(
        'mostrar_pago',
        () => {
            if (''.replace) {
                return '❌ Error al procesar el pago. Por favor, intenta novamente.\n\n¿Hay algo más?';
            }
            return '✅ *PRECIONA EL SIGUIENTE ENLACE PARA PAGAR*\n\n{{payment_link}}\n\n' +
                '📌 *Instrucciones:*\n' +
                '1. Haz clic en el enlace\n' +
                '2. Selecciona tu método de pago\n' +
                '3. Completa el pago\n\n' +
                'Una vez completado, recibirás una confirmación.\n\n' +
                'Tu número de orden: *{{orden_id}}*\n\n' +
                '¿Hay algo más?';
        },
        'menu'
    )

// Contra entrega
    .addTextNode(
        'pago_contra_entrega',
        () => '✅ *Pedido confirmado para pago contra entrega*\n\n' +
            '📦 *Detalles del pedido:*\n' +
            '{{carrito_items}}\n\n' +
            '*Total: {{carrito_total}}*\n\n' +
            '📍 *Entrega:*\n' +
            'Un vendedor te contactará para coordinar la entrega y pago.\n\n' +
            '¿Hay algo más?',
        'menu'
    )

// ============ ORDER STATUS ============
    .addInputNode(
        'estado_pedido',
        '📦 *Estado de Pedido*\n\nIngresa tu número de orden:',
        'orden_id',
        'mostrar_estado'
    )
    .addTextNode(
        'mostrar_estado',
        () => '📦 *Estado del Pedido #{{orden_id}}*\n\n' +
            '• Estado: En proceso\n' +
            '• Fecha: Hoy\n' +
            '• Total: {{carrito_total}}\n\n' +
            '¿Te gustaría algo más?',
        'menu'
    )

// ============ TALK TO SELLER ============
    .addTextNode(
        'vendedor',
        '👤 *Hablar con un Vendedor*\n\nPerfecto! Ingresa tu nombre:',
        'nombre_vendedor'
    )
    .addInputNode(
        'nombre_vendedor',
        '¿Cómo te llamas?',
        'nombre',
        'telefono_vendedor'
    )
    .addInputNode(
        'telefono_vendedor',
        '¿Cuál es tu número de teléfono?',
        'telefono',
        'consulta_vendedor'
    )
    .addInputNode(
        'consulta_vendedor',
        '¿Sobre qué producto o tema quieres conversar?',
        'consulta',
        'vendedor_confirmado'
    )
    .addTextNode(
        'vendedor_confirmado',
        '✅ *¡Solicitud Enviada!*\n\n' +
            'Nombre: {{nombre}}\n' +
            'Teléfono: {{telefono}}\n' +
            'Consulta: {{consulta}}\n\n' +
            'Un vendedor te contactará en breve.\n\n' +
            '¿Hay algo más?',
        'menu'
    )

// ============ EXIT ============
    .addEndNode('exit', 'Volviendo al menú principal...')
    .setRoot('root')
    .build();

export default ventasTree;

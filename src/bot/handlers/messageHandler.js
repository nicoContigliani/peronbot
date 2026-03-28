/**
 * Message Handler
 * Handles incoming messages and routes them through conversation trees
 * Includes command system and conversation management
 */
import pino from 'pino';
import config from '../../config/env.js';
import { 
    getOrCreateUser, 
    updateUserConversation, 
    addToConversationHistory 
} from '../../database/db.js';
import { 
    ConversationEngine, 
    ConversationTree, 
    NodeType 
} from '../../core/ConversationTree.js';
import { loadAllTrees, getTreeNames } from '../trees/index.js';

// Import cart service
import { getCartDisplay, addToCart, clearCart, getCartTotal } from '../../cart/cart.js';

const logger = pino({ level: config.logging.level });

// Global conversation engine instance
export const conversationEngine = new ConversationEngine();

/**
 * Initialize conversation trees
 * Loads trees from the trees/ folder
 */
export function initializeConversationTrees() {
    // Load all trees from the trees folder
    const engine = loadAllTrees();
    
    // Copy trees to global conversation engine
    for (const treeName of engine.listTrees()) {
        const tree = engine.getTree(treeName);
        conversationEngine.registerTree(tree);
    }
    
    logger.info(`✅ Initialized ${conversationEngine.listTrees().length} conversation trees`);
}

/**
 * Command prefixes and handlers
 */
const commands = {
    'hola': { 
        handler: 'start_main',
        description: 'Iniciar conversación'
    },
    'ventas': { 
        handler: 'start_ventas',
        description: 'Ir a ventas'
    },
    'asistencia': { 
        handler: 'start_asistencia',
        description: 'Ir a asistencia'
    },
    'soporte': { 
        handler: 'start_asistencia',
        description: 'Ir a asistencia técnica'
    },
    'ayuda': { 
        handler: 'help',
        description: 'Mostrar ayuda'
    },
    'encuesta': { 
        handler: 'start_survey',
        description: 'Iniciar encuesta de satisfacción'
    },
    'reset': { 
        handler: 'reset',
        description: 'Reiniciar conversación'
    },
    'estado': { 
        handler: 'status',
        description: 'Ver estado del bot'
    },
    'menu': {
        handler: 'start_main',
        description: 'Mostrar menú principal'
    },
    'arboles': {
        handler: 'trees',
        description: 'Ver árboles disponibles'
    },
    // Cart commands
    'carrito': {
        handler: 'view_cart',
        description: 'Ver carrito de compras'
    },
    'vaciar': {
        handler: 'clear_cart',
        description: 'Vaciar carrito'
    },
    'comprar': {
        handler: 'start_checkout',
        description: 'Iniciar checkout'
    }
};

/**
 * Main message handler function
 * @param {makeWASocket} sock - WhatsApp socket
 */
export function handleMessages(sock) {
    // Initialize conversation trees if not already done
    if (conversationEngine.listTrees().length === 0) {
        initializeConversationTrees();
    }

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const message of messages) {
            // Skip own messages and status
            if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') {
                continue;
            }

            try {
                await processIncomingMessage(sock, message);
            } catch (error) {
                logger.error('Error processing message:', error);
                await sendErrorMessage(sock, message.key.remoteJid);
            }
        }
    });
}

/**
 * Process an incoming message
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {Object} message - Message object
 */
async function processIncomingMessage(sock, message) {
    const jid = message.key.remoteJid;
    const text = extractMessageText(message).trim().toLowerCase();
    
    logger.info(`💬 Message from ${jid}: "${text}"`);

    // Get or create user in database
    let user;
    try {
        user = await getOrCreateUser(jid);
    } catch (error) {
        logger.error('Error getting user:', error);
    }

    // Check for commands first
    if (text.startsWith(config.bot.prefix)) {
        await handleCommand(sock, jid, text, user);
        return;
    }

    // Check for exact command match
    const command = commands[text];
    if (command) {
        await executeCommandHandler(sock, jid, command.handler, user);
        return;
    }

    // Check if user has active conversation
    if (conversationEngine.hasActiveConversation(jid)) {
        await handleConversationInput(sock, jid, text, user);
        return;
    }

    // Default: start main menu conversation
    await startConversation(sock, jid, 'main', user);
}

/**
 * Extract text from message based on type
 * @param {Object} message - Message object
 * @returns {string}
 */
function extractMessageText(message) {
    const msg = message.message;
    if (!msg) return '';

    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.imageMessage?.caption) return msg.imageMessage.caption;
    if (msg.videoMessage?.caption) return msg.videoMessage.caption;
    
    return '';
}

/**
 * Handle commands
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {string} jid - User JID
 * @param {string} text - Command text
 * @param {Object} user - User object
 */
async function handleCommand(sock, jid, text, user) {
    const parts = text.slice(1).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    logger.info(`⚡ Command: ${command} from ${jid}`);

    // Map command to handler
    const commandMap = {
        'start': () => startConversation(sock, jid, args[0] || 'welcome', user),
        'soporte': () => startConversation(sock, jid, 'support', user),
        'encuesta': () => startConversation(sock, jid, 'survey', user),
        'ayuda': () => showHelp(sock, jid),
        'menu': () => startConversation(sock, jid, 'welcome', user),
        'reset': () => resetConversation(sock, jid, user),
        'estado': () => showStatus(sock, jid),
        'trees': () => listTrees(sock, jid)
    };

    const handler = commandMap[command];
    if (handler) {
        await handler();
    } else {
        await sock.sendMessage(jid, { 
            text: `❓ Comando desconocido: /${command}\n\nUsa /ayuda para ver los comandos disponibles.` 
        });
    }
}

/**
 * Execute a command handler
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {string} jid - User JID
 * @param {string} handlerName - Handler name
 * @param {Object} user - User object
 */
async function executeCommandHandler(sock, jid, handlerName, user) {
    const handlers = {
        start_main: () => startConversation(sock, jid, 'main', user),
        start_ventas: () => startConversation(sock, jid, 'ventas', user),
        start_asistencia: () => startConversation(sock, jid, 'asistencia', user),
        start_survey: () => startConversation(sock, jid, 'survey', user),
        help: () => showHelp(sock, jid),
        reset: () => resetConversation(sock, jid, user),
        status: () => showStatus(sock, jid),
        menu: () => startConversation(sock, jid, 'main', user),
        trees: () => listTrees(sock, jid),
        // Cart handlers
        view_cart: () => viewCart(sock, jid, user),
        clear_cart: () => clearUserCart(sock, jid, user),
        start_checkout: () => startConversation(sock, jid, 'ventas', user)
    };

    const handler = handlers[handlerName];
    if (handler) {
        await handler();
    }
}

/**
 * Start a conversation
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {string} jid - User JID
 * @param {string} treeName - Tree name
 * @param {Object} user - User object
 */
async function startConversation(sock, jid, treeName, user) {
    try {
        const nodeData = conversationEngine.startConversation(jid, treeName);
        
        // Update user in database
        try {
            await updateUserConversation(jid, nodeData.nodeId, {
                treeName,
                startedAt: new Date()
            });
        } catch (error) {
            logger.warn('Could not update user conversation:', error.message);
        }

        await sendNodeMessage(sock, jid, nodeData);
        
    } catch (error) {
        logger.error('Error starting conversation:', error);
        await sock.sendMessage(jid, { 
            text: '❌ Lo siento, hubo un error al iniciar la conversación.' 
        });
    }
}

/**
 * Handle conversation input
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {string} jid - User JID
 * @param {string} input - User input
 * @param {Object} user - User object
 */
async function handleConversationInput(sock, jid, input, user) {
    try {
        // Check for special commands during conversation
        if (input === 'reset' || input === 'cancelar' || input === 'cancel') {
            await resetConversation(sock, jid, user);
            return;
        }

        // Check for menu return
        if (input === 'menu' || input === 'menú') {
            await resetConversation(sock, jid, user);
            return;
        }

        const nodeData = await conversationEngine.processInput(jid, input);
        
        // Update user in database
        try {
            await updateUserConversation(jid, nodeData.nodeId);
            await addToConversationHistory(jid, { 
                type: 'user', 
                text: input 
            });
        } catch (error) {
            logger.warn('Could not update conversation:', error.message);
        }

        // Check for retry (invalid input)
        if (nodeData.retry) {
            await sock.sendMessage(jid, { 
                text: nodeData.error || 'Invalid input, please try again.' 
            });
            // Re-send the original prompt
            await sock.sendMessage(jid, { text: nodeData.text });
            return;
        }

        await sendNodeMessage(sock, jid, nodeData);

        // End conversation if at end node
        if (nodeData.type === NodeType.END) {
            try {
                await updateUserConversation(jid, 'ended');
            } catch (error) {
                logger.warn('Could not update user status:', error.message);
            }
        }
        
    } catch (error) {
        logger.error('Error processing conversation input:', error);
        await sock.sendMessage(jid, { 
            text: '❌ Lo siento, hubo un error procesando tu mensaje.' 
        });
    }
}

/**
 * Send a node message (text, menu, etc.)
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {string} jid - User JID
 * @param {Object} nodeData - Node data
 */
async function sendNodeMessage(sock, jid, nodeData) {
    // Get cart context for ventas conversations
    let context = {};
    if (nodeData.text && nodeData.text.includes('{{carrito')) {
        const cartDisplay = getCartDisplay(jid);
        context = {
            carrito_items: cartDisplay.items,
            carrito_total: cartDisplay.total,
            carrito_total_numeric: cartDisplay.total_numeric
        };
    }
    
    // Process text with context variables
    let text = nodeData.text || '';
    if (typeof text === 'function') {
        text = text(context);
    } else if (context.carrito_items) {
        text = text
            .replace(/{{carrito_items}}/g, context.carrito_items)
            .replace(/{{carrito_total}}/g, context.carrito_total)
            .replace(/{{carrito_total_numeric}}/g, context.carrito_total_numeric);
    }

    switch (nodeData.type) {
        case NodeType.TEXT:
        case NodeType.END:
            await sock.sendMessage(jid, { text });
            break;

        case NodeType.MENU:
            // Format menu as text with numbered options for easy selection
            let menuText = text + '\n\n';
            const optionKeys = Object.keys(nodeData.options || {});
            for (const key of optionKeys) {
                const optionText = typeof nodeData.options[key].text === 'function' 
                    ? nodeData.options[key].text(context) 
                    : nodeData.options[key].text;
                menuText += `*${key}.* ${optionText}\n`;
            }
            menuText += '\n💡 Escribí el número para seleccionar';
            await sock.sendMessage(jid, { text: menuText });
            break;

        case NodeType.INPUT:
            await sock.sendMessage(jid, { text });
            break;

        case NodeType.ACTION:
            // Actions are processed silently
            logger.info(`⚡ Action executed for ${jid}`);
            break;

        default:
            logger.warn(`Unhandled node type: ${nodeData.type}`);
            await sock.sendMessage(jid, { text: text || '...' });
    }

    // Log response
    logger.info(`📨 Response sent to ${jid}: ${text?.substring(0, 50)}...`);
}

/**
 * Reset conversation
 * @param {makeWASocket} sock - WhatsApp socket
 * @param name} jid - User JID
 * @param {Object} user - User object
 */
async function resetConversation(sock, jid, user) {
    conversationEngine.endConversation(jid);
    
    try {
        await updateUserConversation(jid, 'reset');
    } catch (error) {
        logger.warn('Could not reset user conversation:', error.message);
    }

    await sock.sendMessage(jid, { 
        text: '🔄 Conversación reiniciada.\n\nEscribe *hola* para comenzar de nuevo.' 
    });
}

/**
 * Show help
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {string} jid - User JID
 */
async function showHelp(sock, jid) {
    const helpText = `📖 *Ayuda de Bototo*\n\n
 *Comandos disponibles:*
 • *hola* - Iniciar conversación
 • *menu* - Mostrar menú principal
 • *ventas* - Ir a Ventas
 • *asistencia* - Ir a Asistencia/Soporte
 • *soporte* - Ir a Asistencia técnica
 • *encuesta* - Realizar encuesta
 • *reset* - Reiniciar conversación
 • *estado* - Ver estado del bot
 • *arboles* - Ver árboles disponibles
 • *ayuda* - Mostrar esta ayuda
 • *carrito* - Ver carrito de compras
 • *vaciar* - Vaciar carrito

 *Durante la conversación:*
 • Escribe el número de opción para seleccionar
 • Escribe *reset* para reiniciar
 • Escribe *menu* para volver al inicio

 🤖 *Bototo v${config.bot.name}*`;

    await sock.sendMessage(jid, { text: helpText });
}

/**
 * Show bot status
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {string} jid - User JID
 */
async function showStatus(sock, jid) {
    const activeConvos = conversationEngine.getActiveConversations().size;
    const trees = conversationEngine.listTrees().join(', ');

    const statusText = `📊 *Estado del Bot*\n\n
 • 🤖 Bot: *${config.bot.name}*
 • 🌳 Árboles de conversación: ${trees || 'Ninguno'}
 • 👥 Conversaciones activas: ${activeConvos}
 • 📁 Sesión: ${config.sessionFolder}
 • 🗄️  MongoDB: ${config.mongodb.database}

 ¡El bot está funcionando correctamente! ✅`;

    await sock.sendMessage(jid, { text: statusText });
}

/**
 * List available trees
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {string} jid - User JID
 */
async function listTrees(sock, jid) {
    const trees = conversationEngine.listTrees();
    
    if (trees.length === 0) {
        await sock.sendMessage(jid, { 
            text: 'No hay árboles de conversación registrados.' 
        });
        return;
    }

    let text = '📋 *Árboles de conversación disponibles:*\n\n';
    trees.forEach((tree, index) => {
        text += `${index + 1}. *${tree}*\n`;
    });
    text += '\nUsa /start <nombre> para iniciar uno.';

    await sock.sendMessage(jid, { text });
}

/**
 * Send error message
 * @param {makeWASocket} sock - WhatsApp socket
 * @param {string} jid - User JID
 */
async function sendErrorMessage(sock, jid) {
    try {
        await sock.sendMessage(jid, { 
            text: '❌ Lo siento, ocurrió un error procesando tu mensaje.\n\nPor favor, intenta de nuevo o escribe *reset* para reiniciar.' 
        });
    } catch (error) {
        logger.error('Error sending error message:', error);
    }
}

/**
 * View cart
 */
async function viewCart(sock, jid, user) {
    const cartDisplay = getCartDisplay(jid);
    const text = `🛒 *MI CARRITO*\n\n${cartDisplay.items}\n*TOTAL: ${cartDisplay.total}*\n\n` +
        'Escribe *comprar* para proceder al pago o *ventas* para seguir comprando.';
    await sock.sendMessage(jid, { text });
}

/**
 * Clear cart
 */
async function clearUserCart(sock, jid, user) {
    clearCart(jid);
    await sock.sendMessage(jid, { 
        text: '✅ Carrito vaciado.\n\nEscribe *ventas* para ver productos.' 
    });
}

export default {
    handleMessages,
    conversationEngine,
    initializeConversationTrees
};

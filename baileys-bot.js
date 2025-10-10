import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom'; // Asegúrate de que @hapi/boom esté instalado si lo usas
import qrcode from 'qrcode';
import P from 'pino'; // Logger
// Configuración de la sesión
const SESSION_FOLDER = 'baileys_auth_info'; // Carpeta donde se guardará la sesión

async function connectToWhatsApp() {
    // Carga o crea las credenciales de sesión.
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Muestra el QR en la terminal por defecto
        logger: P({ level: 'silent' }), // Silencia logs excesivos para la terminal
        browser: ['Nico-Bot', 'Chrome', '1.0'], // Nombre de tu bot para WhatsApp
    });

    // --- Manejo del Estado de Conexión ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            // Revisa si es un cierre por error o si es un LOGOUT
            let shouldReconnect = (lastDisconnect.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true; // Reconecta por defecto si no es un error Boom

            console.log(`\n❌ Conexión cerrada. Razón: ${lastDisconnect.error?.message}.`);
            
            if (shouldReconnect) {
                console.log('⏱️ Intentando reconectar...');
                await delay(3000); // Espera 3 segundos antes de reconectar
                connectToWhatsApp();
            } else {
                console.log('🛑 Cerraste sesión manualmente. Debes eliminar la carpeta de sesión para volver a iniciar:', SESSION_FOLDER);
                // Si la razón es LOGGED_OUT, la sesión guardada no es válida.
            }
        } else if (connection === 'open') {
            console.log('✅ Conexión establecida y lista.');
        }

        if (qr) {
            // Muestra el QR si es necesario (generalmente solo al inicio si no hay sesión)
            console.log('\n--- QR Recibido, escanéalo con tu teléfono:');
            qrcode.toString(qr, { type: 'terminal', small: true }, (err, data) => {
                if (err) return console.error("Error al generar QR:", err);
                console.log(data);
            });
            console.log('-------------------------------------------');
        }
    });

    // Guarda las credenciales de la sesión cada vez que se actualizan (clave para la estabilidad)
    sock.ev.on('creds.update', saveCreds);

    // --- Manejo de Mensajes (Tu Lógica de Bot) ---
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return; // Ignora eventos que no son de mensajes

        for (const message of messages) {
            // Ignora mensajes de estado o de tu propia cuenta
            if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') return;

            const jid = message.key.remoteJid; // El ID del chat (número)
            const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
            const textoOriginal = text.toLowerCase().trim();

            console.log(`\n💬 Mensaje de ${jid}: "${text}"`);

            if (textoOriginal === 'hola') {
                await sock.sendMessage(jid, { text: '¡Hola! Soy un bot estable usando Baileys.' });
                
            } else if (textoOriginal.includes('funciona')) {
                await sock.sendMessage(jid, { text: '¡Sí, funciona! La versión Baileys está online. 🚀' });
                
            } else if (textoOriginal) {
                // Solo responde si es un mensaje de texto
                await sock.sendMessage(jid, { text: 'Recibí tu mensaje. Intenta decir "hola" o "funciona".' });
            }
            console.log(`➡️ Respuesta enviada.`);
        }
    });

    return sock;
}

connectToWhatsApp();
// index.js (El archivo principal)

import makeWASocket, { useMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import P from 'pino';
import { handleMessages } from './messageHandler.js'; // Importación de la lógica de respuestas

// Configuración de la sesión
const SESSION_FOLDER = 'baileys_auth_info'; // Carpeta donde se guardará la sesión

async function connectToWhatsApp() {
    console.log('--- Intentando iniciar conexión con Baileys ---');
    
    // Carga o crea las credenciales de sesión.
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: P({ level: 'silent' }),
        browser: ['Nico-Bot', 'Chrome', '1.0'],
    });

    // --- Manejo del Estado de Conexión ---
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'close') {
            let shouldReconnect = (lastDisconnect.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log(`\n❌ Conexión cerrada. Razón: ${lastDisconnect.error?.message}.`);
            
            if (shouldReconnect) {
                console.log('⏱️ Intentando reconectar...');
                await delay(3000);
                connectToWhatsApp();
            } else {
                console.log('🛑 Cerraste sesión manualmente. Debes eliminar la carpeta de sesión para volver a iniciar:', SESSION_FOLDER);
            }
        } else if (connection === 'open') {
            console.log('✅ Conexión establecida y lista.');
            
            // --- Llamada a la Lógica de Mensajes ---
            handleMessages(sock);
        }

        if (qr) {
            console.log('\n--- QR Recibido, escanéalo con tu teléfono:');
            qrcode.toString(qr, { type: 'terminal', small: true }, (err, data) => {
                if (err) return console.error("Error al generar QR:", err);
                console.log(data);
            });
            console.log('-------------------------------------------');
        }
    });

    // Guarda las credenciales de la sesión
    sock.ev.on('creds.update', saveCreds);

    return sock;
}

connectToWhatsApp();
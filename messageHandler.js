// // messageHandler.js

// export const handleMessages = (sock) => {
//     // Escuchador principal para mensajes
//     sock.ev.on('messages.upsert', async ({ messages, type }) => {
//         if (type !== 'notify') return; // Ignora eventos que no son de mensajes

//         for (const message of messages) {
//             // Ignora mensajes de estado o de tu propia cuenta
//             if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') return;

//             const jid = message.key.remoteJid;
//             const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
//             const textoOriginal = text.toLowerCase().trim();

//             console.log(`\n💬 Mensaje de ${jid}: "${text}"`);

//             // --- Lógica del Bot (Aquí puedes expandir tus comandos) ---
//             if (textoOriginal === 'hola') {
//                 await sock.sendMessage(jid, { text: '¡Hola! Soy un bot estable usando Baileys.' });

//             } else if (textoOriginal.includes('funciona')) {
//                 await sock.sendMessage(jid, { text: '¡Sí, funciona! La versión Baileys está online. 🚀' });

//             } else if (textoOriginal) {
//                 await sock.sendMessage(jid, { text: 'Recibí tu mensaje. Intenta decir "hola" o "funciona".' });
//             }
//             // -----------------------------------------------------------

//             console.log(`➡️ Respuesta enviada.`);
//         }
//     });
// };



// messageHandler.js

export const handleMessages = (sock) => {
    // Escuchador principal para mensajes
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return; // Ignora eventos que no son de mensajes

        for (const message of messages) {
            // Ignora mensajes de estado o de tu propia cuenta
            if (message.key.fromMe || message.key.remoteJid === 'status@broadcast') return;

            const jid = message.key.remoteJid;
            const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
            const textoOriginal = text.toLowerCase().trim();

            console.log(`\n💬 Mensaje de ${jid}: "${text}"`);

            let respuesta = '';

            // --- Lógica del Bot (Respuestas Peronistas) ---
            switch (true) {
                case textoOriginal.includes('hola') || textoOriginal.includes('saludos'):
                    respuesta = '¡Hola compañero/a! La única verdad es la realidad. 👋';
                    break;

                case textoOriginal.includes('justicia social'):
                    respuesta = 'La Justicia Social es la columna vertebral de nuestro movimiento. Siempre junto al pueblo trabajador.';
                    break;

                case textoOriginal.includes('tercera posicion') || textoOriginal.includes('tercera posición'):
                    respuesta = 'Ni yanquis ni marxistas. La Tercera Posición es el camino de la Soberanía Política, la Independencia Económica y la Justicia Social. 🇦🇷';
                    break;

                case textoOriginal.includes('doctrina'):
                    respuesta = 'Nuestra doctrina es simple y clara: la felicidad del pueblo y la grandeza de la Nación.';
                    break;

                case textoOriginal.includes('libertador') || textoOriginal.includes('peron'):
                    respuesta = 'General, presente. "Para un peronista no puede haber nada mejor que otro peronista". ✌️';
                    break;

                case textoOriginal.includes('funciona'):
                    respuesta = '¡Claro que funciona! Si la Patria es el otro, siempre funciona. 🇦🇷';
                    break;

                case textoOriginal.includes('las tres banderas'):
                    respuesta = '¡Soberanía Política, Independencia Económica y Justicia Social! Esas son las banderas irrenunciables.';
                    break;

                case textoOriginal.includes('pueblo') || textoOriginal.includes('patria'):
                    respuesta = '¡El pueblo unido jamás será vencido! Recuerda: La Patria es el otro.';
                    break;

                case textoOriginal.includes('unidad'):
                    respuesta = '¡La Unidad! La clave es la organización para la liberación. Todos Unidos Triunfaremos.';
                    break;


                case textoOriginal.includes('tuerno peluqueria'):
                    respuesta = '¡Siempre tuerno, siempre peluqueria!';
                    break;

                default:
                    // Respuesta por defecto si no coincide con ningún comando peronista
                    respuesta = 'Compañero/a, no comprendí. Intenta preguntarme sobre las *Tres Banderas*, la *Justicia Social* o la *Doctrina*.';
                    break;
            }
            // -----------------------------------------------------------

            if (respuesta) {
                await sock.sendMessage(jid, { text: respuesta });
                console.log(`➡️ Respuesta enviada: "${respuesta}"`);
            }
        }
    });
};
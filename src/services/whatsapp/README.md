# WhatsApp Module

Unified WhatsApp interface supporting both **Baileys** (unofficial) and **WhatsApp Business API** (official).

## Quick Start

### Option 1: Baileys (Free, Unofficial)

```javascript
import { createWhatsAppAdapter } from '@/services/whatsapp/index.js';

// Create and connect
const adapter = await createWhatsAppAdapter(process.env);
await adapter.connect();

// Send message
await adapter.sendMessage('5491112345678@s.whatsapp.net', 'Hello!');

// Receive messages
adapter.onMessage(async (message) => {
    console.log('Received:', message.text);
    await adapter.sendMessage(message.jid, 'Got it!');
});
```

### Option 2: WhatsApp Business API (Official, Paid)

1. **Setup Meta Business Account:**
   - Go to [Meta Business Suite](https://business.facebook.com)
   - Create WhatsApp Business Account
   - Get Phone Number ID and Access Token

2. **Configure environment:**
   ```bash
   WHATSAPP_PROVIDER=business-api
   META_PHONE_NUMBER_ID=your_phone_number_id
   META_ACCESS_TOKEN=your_access_token
   META_WEBHOOK_VERIFY_TOKEN=your_verify_token
   META_WEBHOOK_SECRET=your_app_secret
   ```

3. **Use the adapter:**
   ```javascript
   import { createWhatsAppAdapter, createWebhookHandler } from '@/services/whatsapp/index.js';
   
   // Create adapter
   const adapter = await createWhatsAppAdapter(process.env);
   await adapter.connect();
   
   // Setup webhook for receiving messages
   const webhookHandler = createWebhookHandler({
       verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
       appSecret: process.env.META_WEBHOOK_SECRET,
       onMessage: async (message) => {
           console.log('Received:', message.text);
           await adapter.sendMessage(message.jid, 'Got it!');
       }
   });
   
   // Add webhook routes to Express
   app.use('/webhook', webhookHandler.getRouter());
   ```

## Switching Providers

Change provider with one config line:

```bash
# In .env file
WHATSAPP_PROVIDER=baileys      # Use Baileys (default)
WHATSAPP_PROVIDER=business-api # Use Business API
```

No code changes needed! Your business logic stays the same.

## API Reference

### Send Messages

```javascript
// Text message
await adapter.sendMessage(jid, 'Hello!');

// Button message
await adapter.sendButtons(jid, 'Choose option:', [
    { id: '1', text: 'Option 1' },
    { id: '2', text: 'Option 2' }
]);

// List message
await adapter.sendListMessage(jid, 'Select item:', 'View Items', [
    { title: 'Category 1', rows: [{ id: '1', title: 'Item 1' }] }
]);

// Image
await adapter.sendImage(jid, 'https://example.com/image.jpg', 'Caption');

// Document
await adapter.sendDocument(jid, 'https://example.com/file.pdf', 'document.pdf');
```

### Receive Messages

```javascript
adapter.onMessage(async (message) => {
    // message.jid - Sender JID
    // message.text - Message text
    // message.messageType - Message type
    // message.raw - Raw message object
});
```

### Connection Status

```javascript
const status = adapter.getConnectionStatus();
// status.isConnected - boolean
// status.provider - 'baileys' | 'business-api'
// status.status - 'connected' | 'disconnected' | 'connecting'
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WHATSAPP_PROVIDER` | Provider to use | `baileys` |
| `SESSION_FOLDER` | Session folder (Baileys) | `baileys_auth_info` |
| `META_PHONE_NUMBER_ID` | Phone Number ID (Business API) | - |
| `META_ACCESS_TOKEN` | Access Token (Business API) | - |
| `META_WEBHOOK_VERIFY_TOKEN` | Webhook verify token | - |
| `META_WEBHOOK_SECRET` | Webhook secret | - |
| `META_API_VERSION` | API version | `v18.0` |
| `META_BASE_URL` | Base URL | `https://graph.facebook.com` |

## Error Handling

All methods return `MessageResult` objects:

```javascript
const result = await adapter.sendMessage(jid, 'Hello');

if (result.success) {
    console.log('Sent:', result.messageId);
} else {
    console.error('Failed:', result.error);
}
```

## Migration from Direct Baileys

**Before:**
```javascript
import makeWASocket from '@whiskeysockets/baileys';
const sock = makeWASocket({ ... });
await sock.sendMessage(jid, { text: 'Hello' });
```

**After:**
```javascript
import { createWhatsAppAdapter } from '@/services/whatsapp/index.js';
const adapter = await createWhatsAppAdapter(process.env);
await adapter.connect();
await adapter.sendMessage(jid, 'Hello');
```

## Benefits

✅ **Unified interface** - Same code works with both providers
✅ **Easy switching** - Change provider with one config line
✅ **No code changes** - Your business logic stays the same
✅ **Type safety** - Full JSDoc typing
✅ **Error handling** - Consistent error responses

## Troubleshooting

### Baileys Connection Issues

1. Delete session folder: `rm -rf baileys_auth_info`
2. Restart bot
3. Scan QR code again

### Business API Issues

1. Verify credentials in Meta Business Suite
2. Check webhook URL is accessible
3. Verify webhook signature
4. Check API rate limits

## Architecture

```
src/services/whatsapp/
├── WhatsAppAdapter.js          # Common interface
├── WhatsAppFactory.js          # Factory for adapter selection
├── index.js                    # Module exports
├── baileys/
│   └── BaileysAdapter.js       # Baileys implementation
└── business-api/
    ├── BusinessAPIAdapter.js   # Business API implementation
    └── webhookHandler.js       # Webhook handler for receiving messages
```

## License

Part of Bototo project.

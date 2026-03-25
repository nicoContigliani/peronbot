# 🤖 Bototo

WhatsApp Bot with Reusable Conversation Trees - Built with Baileys and MongoDB

## 📋 Features

- **🌳 Reusable Conversation Trees**: Create modular, reusable conversation flows using a powerful tree-based engine
- **🔄 Automatic Reconnection**: Handles connection drops and reconnects automatically
- **🗄️ MongoDB Persistence**: Stores users, conversations, and message history
- **🎯 Full Error Handling**: Comprehensive error handling at every level
- **⚡ Command System**: Built-in command parser with prefix support
- **📱 WhatsApp Official API**: Uses Baileys library (multi-device WhatsApp API)
- **📊 Activity Logging**: Uses Pino for structured logging
- **🧩 Modular Architecture**: Clean, organized code structure

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- WhatsApp account (for scanning QR)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start the bot
npm start
```

### First Run

1. Start the bot: `npm start`
2. Scan the QR code with your WhatsApp
3. The bot is ready to use!

## 📁 Project Structure

```
bototo/
├── src/
│   ├── bot/
│   │   └── BotClient.js      # WhatsApp connection manager
│   ├── config/
│   │   └── env.js            # Environment configuration
│   ├── core/
│   │   └── ConversationTree.js  # Conversation tree engine
│   ├── database/
│   │   └── db.js             # MongoDB operations
│   ├── handlers/
│   │   └── messageHandler.js # Message processing
│   └── index.js              # Main entry point
├── .env.example              # Environment template
├── package.json              # Dependencies
└── README.md                 # This file
```

## 💬 Commands

| Command | Description |
|---------|-------------|
| `hola` | Start welcome conversation |
| `menu` | Show main menu |
| `soporte` | Start support conversation |
| `encuesta` | Start satisfaction survey |
| `reset` | Reset current conversation |
| `estado` | Show bot status |
| `ayuda` | Show help |

## 🌳 Creating Conversation Trees

### Basic Example

```javascript
import { ConversationTree, NodeType } from './src/core/ConversationTree.js';

const myTree = new ConversationTree('myTree', 'My custom conversation')
    .addTextNode('root', 'Hello! How can I help you?', 'menu')
    .addMenuNode('menu', 'Choose an option:', {
        '1': { text: 'Option A', next: 'option_a' },
        '2': { text: 'Option B', next: 'option_b' }
    })
    .addTextNode('option_a', 'You chose option A!', 'end')
    .addTextNode('option_b', 'You chose option B!', 'end')
    .addEndNode('end', 'Thank you for chatting!')
    .setRoot('root')
    .build();
```

### Node Types

- **TEXT**: Simple text response
- **MENU**: Multiple choice menu
- **INPUT**: Request user input
- **CONDITION**: Conditional branching
- **ACTION**: Execute custom action
- **TRANSFER**: Transfer to another tree
- **END**: End conversation

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/bototo` |
| `MONGODB_DB` | Database name | `bototo` |
| `BOT_NAME` | Bot display name | `Bototo` |
| `SESSION_FOLDER` | Auth session folder | `baileys_auth_info` |
| `BOT_MOBILE` | Use mobile API | `false` |
| `COMMAND_PREFIX` | Command prefix | `!` |
| `LOG_LEVEL` | Logging level | `info` |

## 🗄️ Database Collections

- **users**: User data and conversation state
- **conversations**: Message history
- **conversation_trees**: Stored tree definitions

## 🔌 API Usage

### Sending Messages

```javascript
import BotClient from './src/bot/BotClient.js';

// Send a text message
await BotClient.sendMessage(jid, 'Hello!');

// Send buttons
await BotClient.sendButtons(jid, 'Choose:', [
    { id: 'btn1', text: 'Option 1' },
    { id: 'btn2', text: 'Option 2' }
]);

// Send a list
await BotClient.sendListMessage(jid, 'Menu', 'Select', [
    {
        title: 'Section 1',
        rows: [{ id: '1', title: 'Item 1' }]
    }
]);
```

### Accessing Socket

```javascript
const sock = BotClient.getSocket();
// Use any Baileys socket method
```

## 📝 License

ISC License

## 👤 Author

Created with ❤️

## 🆘 Troubleshooting

### Session Issues

If authentication fails:
```bash
rm -rf baileys_auth_info
npm start
```

### MongoDB Connection Issues

1. Check MongoDB is running
2. Verify connection string in `.env`
3. Check firewall settings

### WhatsApp Disconnection

The bot will automatically reconnect. If it keeps disconnecting:
1. Check internet connection
2. Delete session folder and re-scan QR
3. Check WhatsApp Web is not active elsewhere

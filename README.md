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
- **📁 File Processing**: Transform Excel and CSV files to JSON with Supabase integration
- **☁️ Supabase Storage**: Upload, download, and manage files in Supabase Storage

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
│   ├── fileProcessor/
│   │   ├── fileProcessor.js  # File transformation and Supabase integration
│   │   └── index.js          # Module exports
│   ├── handlers/
│   │   └── messageHandler.js # Message processing
│   ├── routes/
│   │   ├── fileRoutes.js     # File upload and processing API endpoints
│   │   └── index.js          # Routes exports
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
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_KEY` | Supabase anon/public key | - |
| `SUPABASE_BUCKET` | Storage bucket name | `files` |

## 📁 File Processing

The bot includes a powerful file processing module that transforms Excel and CSV files to JSON and integrates with Supabase for file storage.

### API Documentation (Swagger)

The API is fully documented using Swagger/OpenAPI. To access the interactive API documentation:

1. **Start the API server:**
   ```bash
   npm run server
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:3000/api-docs
   ```

The Swagger UI provides:
- Interactive API testing
- Request/response examples
- Schema definitions
- Query parameter documentation

### Running the API Server

```bash
# Start only the API server (with Swagger)
npm run server

# Start both WhatsApp bot and API server
npm start
```

The API server runs on port 3000 by default. You can change this by setting the `PORT` environment variable in your `.env` file.

### Authentication (Clerk)

All file processing endpoints are protected with Clerk authentication. To use the API:

1. **Create a Clerk account** at [clerk.com](https://clerk.com)
2. **Create a new application** in Clerk Dashboard
3. **Get your API keys** from Clerk Dashboard > API Keys
4. **Add to `.env`:**
   ```bash
   CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-publishable-key
   CLERK_SECRET_KEY=sk_test_your-clerk-secret-key
   CLERK_WEBHOOK_SECRET=whsec_your-webhook-secret
   ```

5. **Authenticate requests** by including the Clerk session token in the Authorization header:
   ```bash
   curl -H "Authorization: Bearer <your-clerk-session-token>" \
        -F "file=@data.xlsx" \
        http://localhost:3000/api/files/upload
   ```

Or use Clerk's frontend SDKs to handle authentication automatically.

### Supported File Formats

- **Excel**: `.xlsx`, `.xls`
- **CSV**: `.csv` (comma, semicolon, or tab delimited)
- **Other formats**: PDF, DOC, DOCX, TXT, JSON, images (PNG, JPG, GIF)

### API Endpoints

#### Upload and Process File

```bash
POST /api/files/upload
Content-Type: multipart/form-data

# Query Parameters:
# - uploadToStorage: 'true' to upload to Supabase
# - bucket: Supabase bucket name (default: 'files')
```

**Example using curl:**

```bash
# Parse Excel file only
curl -X POST -F "file=@data.xlsx" http://localhost:3000/api/files/parse

# Parse and upload to Supabase
curl -X POST -F "file=@data.xlsx" "http://localhost:3000/api/files/upload?uploadToStorage=true"
```

#### Parse File (No Upload)

```bash
POST /api/files/parse
Content-Type: multipart/form-data
```

#### List Files in Supabase

```bash
GET /api/files/list?bucket=files&prefix=folder/
```

#### Download File from Supabase

```bash
GET /api/files/download/:filename?bucket=files
```

#### Delete File from Supabase

```bash
DELETE /api/files/:filename?bucket=files
```

#### Batch Upload

```bash
POST /api/files/batch
Content-Type: multipart/form-data

# Upload up to 10 files at once
```

### Programmatic Usage

```javascript
import { parseExcel, parseCSV, processFile, uploadToSupabase } from './src/fileProcessor/index.js';

// Parse Excel file
const excelResult = parseExcel(buffer, { header: 1 });
console.log(excelResult.data); // { Sheet1: [...], Sheet2: [...] }

// Parse CSV file
const csvResult = parseCSV(buffer);
console.log(csvResult.data); // [{ col1: 'value1', col2: 'value2' }, ...]

// Process file (parse + optional upload)
const result = await processFile(buffer, 'data.xlsx', {
    uploadToStorage: true,
    bucket: 'files'
});

// Upload to Supabase directly
const uploadResult = await uploadToSupabase(buffer, 'data.xlsx', 'files');
console.log(uploadResult.publicUrl); // Public URL of uploaded file
```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a storage bucket (e.g., `files`)
3. Get your project URL and anon key from Settings > API
4. Add to `.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_BUCKET=files
```

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

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
- **📧 Email Service**: Send emails using nodemailer with reusable templates
- **🔌 Socket Module**: Reusable WhatsApp socket connection manager
- **🗑️ Session Management**: Clear WhatsApp session to force new QR code
- **👥 User Management**: Full CRUD for users with role assignment
- **🎭 Role Management**: Create and manage roles with permissions
- **🔐 Permission System**: Granular permission control with resource and action based access

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
│   ├── mail/
│   │   ├── mail.js           # Email service with nodemailer
│   │   └── index.js          # Module exports
│   ├── permissions/
│   │   ├── controllers/
│   │   │   └── permission.controller.js  # Permission request handlers
│   │   ├── dao/
│   │   │   └── permission.dao.js         # Permission data access
│   │   ├── dto/
│   │   │   └── permission.dto.js         # Permission data transfer objects
│   │   ├── routes/
│   │   │   └── permission.routes.js      # Permission API endpoints
│   │   └── index.js                      # Module exports
│   ├── roles/
│   │   ├── controllers/
│   │   │   └── role.controller.js        # Role request handlers
│   │   ├── dao/
│   │   │   └── role.dao.js               # Role data access
│   │   ├── dto/
│   │   │   └── role.dto.js               # Role data transfer objects
│   │   ├── routes/
│   │   │   └── role.routes.js            # Role API endpoints
│   │   └── index.js                      # Module exports
│   ├── routes/
│   │   ├── fileRoutes.js     # File upload and processing API endpoints
│   │   ├── sessionRoutes.js  # Session management API endpoints
│   │   └── index.js          # Routes exports
│   ├── socket/
│   │   ├── socket.js         # Reusable socket manager
│   │   └── index.js          # Module exports
│   ├── users/
│   │   ├── controllers/
│   │   │   └── user.controller.js        # User request handlers
│   │   ├── dao/
│   │   │   └── user.dao.js               # User data access
│   │   ├── dto/
│   │   │   └── user.dto.js               # User data transfer objects
│   │   ├── routes/
│   │   │   └── user.routes.js            # User API endpoints
│   │   └── index.js                      # Module exports
│   └── index.js              # Main entry point
├── sessionManager.js         # Session management utility
├── clearSession.js           # CLI script to clear session
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
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Use TLS | `false` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASS` | SMTP password | - |
| `SMTP_FROM` | Default sender email | - |

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
- **roles**: User roles with permissions
- **permissions**: Granular permissions with resource and action

## 📧 Email Service

The bot includes a reusable email service using nodemailer with pre-built templates.

### Available Functions

```javascript
import { 
    sendMail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendOrderConfirmationEmail,
    sendNotificationEmail,
    isConfigured
} from './src/mail/index.js';

// Send custom email
await sendMail({
    to: 'user@example.com',
    subject: 'Test Email',
    html: '<h1>Hello!</h1>'
});

// Send welcome email
await sendWelcomeEmail('user@example.com', 'Juan');

// Send password reset email
await sendPasswordResetEmail('user@example.com', 'https://example.com/reset');

// Send order confirmation
await sendOrderConfirmationEmail('user@example.com', {
    id: '12345',
    items: [{ title: 'Product', quantity: 1, unit_price: 100 }],
    total: 100
});

// Send notification
await sendNotificationEmail('user@example.com', 'Alert', 'Important message');

// Check if configured
if (isConfigured()) {
    // Send email
}
```

### Email Templates

- **Welcome Email**: Green header, personalized greeting
- **Password Reset**: Blue header, reset button
- **Order Confirmation**: Orange header, itemized table
- **Notification**: Purple header, simple message

## 👥 User Management

The bot includes a complete user management system with role-based access control.

### API Endpoints

#### Create User
```bash
POST /api/users
Content-Type: application/json

{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "password123",
    "roles": ["role_id_1", "role_id_2"],
    "isActive": true,
    "metadata": { "phone": "+1234567890" }
}
```

#### Get Users with Filters
```bash
GET /api/users?email=user&name=John&isActive=true&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

#### Get User by ID
```bash
GET /api/users/:id
```

#### Update User
```bash
PUT /api/users/:id
Content-Type: application/json

{
    "name": "John Updated",
    "roles": ["role_id_1"],
    "isActive": true
}
```

#### Delete User
```bash
# Soft delete (deactivate)
DELETE /api/users/:id

# Hard delete (permanent)
DELETE /api/users/:id?hard=true
```

#### Manage User Roles
```bash
# Add role to user
POST /api/users/:id/roles/:roleId

# Remove role from user
DELETE /api/users/:id/roles/:roleId

# Get users by role
GET /api/users/role/:roleId
```

#### Get User Statistics
```bash
GET /api/users/stats
```

### Programmatic Usage

```javascript
import { 
    createUser,
    getUserById,
    getUsers,
    updateUser,
    deleteUser,
    addRoleToUser
} from './src/users/index.js';

// Create user
const user = await createUser({
    email: 'user@example.com',
    name: 'John Doe',
    roles: ['role_id']
});

// Get users with filters
const result = await getUsers({
    email: 'user',
    isActive: true,
    page: 1,
    limit: 20
});

// Add role to user
await addRoleToUser(user._id, 'role_id');
```

## 🎭 Role Management

Manage user roles with permission assignments.

### API Endpoints

#### Create Role
```bash
POST /api/roles
Content-Type: application/json

{
    "name": "admin",
    "description": "Administrator role",
    "permissions": ["perm_id_1", "perm_id_2"],
    "isActive": true
}
```

#### Get Roles with Filters
```bash
GET /api/roles?name=admin&isActive=true&page=1&limit=20
```

#### Get Role by ID
```bash
GET /api/roles/:id
```

#### Update Role
```bash
PUT /api/roles/:id
Content-Type: application/json

{
    "name": "admin_updated",
    "description": "Updated description",
    "permissions": ["perm_id_1"]
}
```

#### Delete Role
```bash
# Soft delete
DELETE /api/roles/:id

# Hard delete
DELETE /api/roles/:id?hard=true
```

#### Manage Role Permissions
```bash
# Add permission to role
POST /api/roles/:id/permissions/:permissionId

# Remove permission from role
DELETE /api/roles/:id/permissions/:permissionId

# Get roles by permission
GET /api/roles/permission/:permissionId
```

#### Get Role Statistics
```bash
GET /api/roles/stats
```

### Programmatic Usage

```javascript
import { 
    createRole,
    getRoleById,
    getRoles,
    addPermissionToRole
} from './src/roles/index.js';

// Create role
const role = await createRole({
    name: 'admin',
    description: 'Administrator',
    permissions: ['perm_id']
});

// Add permission to role
await addPermissionToRole(role._id, 'permission_id');
```

## 🔐 Permission System

Granular permission control with resource and action based access.

### API Endpoints

#### Create Permission
```bash
POST /api/permissions
Content-Type: application/json

{
    "name": "users:read",
    "description": "Read user data",
    "resource": "users",
    "action": "read",
    "isActive": true
}
```

#### Get Permissions with Filters
```bash
GET /api/permissions?name=read&resource=users&action=read&isActive=true&page=1&limit=20
```

#### Get Permission by ID
```bash
GET /api/permissions/:id
```

#### Update Permission
```bash
PUT /api/permissions/:id
Content-Type: application/json

{
    "name": "users:write",
    "description": "Write user data",
    "resource": "users",
    "action": "write"
}
```

#### Delete Permission
```bash
# Soft delete
DELETE /api/permissions/:id

# Hard delete
DELETE /api/permissions/:id?hard=true
```

#### Get Permissions by Resource/Action
```bash
# Get permissions by resource
GET /api/permissions/resource/users

# Get permissions by action
GET /api/permissions/action/read
```

#### Get Permission Statistics
```bash
GET /api/permissions/stats
```

### Programmatic Usage

```javascript
import { 
    createPermission,
    getPermissionById,
    getPermissions,
    getPermissionsByResource
} from './src/permissions/index.js';

// Create permission
const permission = await createPermission({
    name: 'users:read',
    resource: 'users',
    action: 'read'
});

// Get permissions by resource
const permissions = await getPermissionsByResource('users');
```

## ⚡ Performance Optimizations

### Database Indexes

All collections have optimized indexes:

**Users:**
- `email` (unique)
- `name`
- `roles`
- `isActive`
- `createdAt`
- `updatedAt`
- Compound: `isActive + createdAt`

**Roles:**
- `name` (unique)
- `isActive`
- `createdAt`
- `permissions`
- Compound: `isActive + createdAt`

**Permissions:**
- `name` (unique)
- `resource`
- `action`
- `isActive`
- `createdAt`
- Compound: `resource + action`

### Caching Strategy

- In-memory cache with 5-minute TTL
- LRU eviction when cache reaches max size
- Automatic cache invalidation on updates/deletes
- Separate caches for users, roles, and permissions

### Query Optimization

- Projection to exclude sensitive fields (password)
- Pagination with configurable limits (max 100)
- Sorting with allowed fields only
- Compound indexes for common queries

## 🔌 Socket Module

The bot includes a reusable socket module for WhatsApp connection management.

### Usage

```javascript
import { createSocketManager } from './src/socket/index.js';

// Create socket manager
const socket = createSocketManager({
    sessionFolder: 'baileys_auth_info',
    browserName: 'MyBot',
    browserVersion: '1.0',
    maxRetries: 5,
    retryDelay: 3000
});

// Set event handlers
socket.setEventHandlers({
    onMessage: async (messageData) => {
        console.log(`Message from ${messageData.jid}: ${messageData.text}`);
        await socket.sendMessage(messageData.jid, 'Hello!');
    },
    onQR: (qr) => {
        console.log('Scan QR code:', qr);
    },
    onConnectionUpdate: (update) => {
        console.log('Connection status:', update.status);
    },
    onError: (error) => {
        console.error('Error:', error);
    }
});

// Connect to WhatsApp
await socket.connect();

// Send messages
await socket.sendMessage('1234567890@s.whatsapp.net', 'Hello World!');

// Send button message
await socket.sendButtons('1234567890@s.whatsapp.net', 'Choose:', [
    { id: '1', text: 'Option 1' },
    { id: '2', text: 'Option 2' }
]);

// Get connection state
const state = socket.getConnectionState();
console.log('Connected:', state.isConnected);

// Disconnect when done
await socket.disconnect();
```

## 🗑️ Session Management

Manage WhatsApp sessions to force new QR codes when needed.

### NPM Scripts

```bash
# Check session status
npm run session:status

# Clear all session files (forces new QR)
npm run clear-session

# Clear session but keep credentials
node clearSession.js --keep
```

### Programmatic Usage

```javascript
import { 
    checkSessionStatus,
    clearSession,
    clearSessionKeepCredentials
} from './sessionManager.js';

// Check session status
const status = await checkSessionStatus();
console.log('Session exists:', status.exists);
console.log('Files:', status.files);

// Clear session
await clearSession();

// Clear but keep credentials
await clearSessionKeepCredentials();
```

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
# Clear session using npm script
npm run clear-session

# Or manually
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

# PeronBot Dashboard 🔥

A modern web dashboard for managing conversation trees/workflows with FlamaScript design system.

## Features

- 🔐 **Clerk Authentication** - Secure login with role-based access control
- 🌳 **Tree Editor** - Visual editor for conversation flows
- 👥 **User Management** - Admin, Editor, and Viewer roles
- ⚙️ **Settings** - Configure bot and integrations
- 🎨 **FlamaScript Design** - Fire + Hexagons, Neumorphism + Glassmorphism

## Design Specs

- **Primary**: #FF0000 (Vivid Red)
- **Secondary**: #FF9100 (Vibrant Orange)
- **Background**: #FFFFFF
- Glassmorphism with red tint
- Hexagonal background pattern (neumorphism)
- Mac-like minimalist interface

## Tech Stack

- **Frontend**: React 18 + Vite
- **Authentication**: Clerk
- **Styling**: FlamaScript CSS
- **Backend**: Express.js
- **Database**: MongoDB

## Getting Started

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```env
# Clerk Authentication (get from https://clerk.com)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key

# MongoDB
MONGO_URI=mongodb://localhost:27017
DB_NAME=peronbot

# Server
PORT=3000
```

### 3. Run Development Server

```bash
# Run both frontend and backend
npm start

# Or run separately:
npm run dev      # Frontend (Vite)
npm run dev:server # Backend (Express)
```

### 4. Open in Browser

```
http://localhost:5173
```

## Project Structure

```
dashboard/
├── public/
│   └── flama.svg           # Favicon
├── src/
│   ├── components/
│   │   ├── Layout.jsx      # Main layout with nav & sidebar
│   │   └── ProtectedRoute.jsx # Route protection
│   ├── pages/
│   │   ├── LoginPage.jsx    # Login with Clerk
│   │   ├── DashboardPage.jsx # Home with hexagonal modules
│   │   ├── TreeEditorPage.jsx # Tree editor
│   │   ├── UsersPage.jsx    # User management
│   │   └── SettingsPage.jsx # Settings
│   ├── styles/
│   │   └── flamascript.css  # Design system
│   ├── App.jsx              # Routes
│   └── main.jsx             # Entry point
├── server.js                # Express API server
├── vite.config.js           # Vite config
├── package.json
└── README.md
```

## Roles & Permissions

| Role     | Dashboard | Edit Trees | Manage Users | Settings |
|----------|-----------|------------|--------------|----------|
| Admin    | ✅         | ✅         | ✅            | ✅        |
| Editor   | ✅         | ✅         | ❌            | ❌        |
| Viewer   | ✅         | ❌         | ❌            | ❌        |

## API Endpoints

| Method | Endpoint           | Description          | Auth    |
|--------|-------------------|----------------------|---------|
| GET    | /api/stats        | Get dashboard stats | ✅      |
| GET    | /api/trees        | List all trees      | ✅      |
| POST   | /api/trees        | Create tree         | Editor+ |
| PUT    | /api/trees/:id    | Update tree         | Editor+ |
| DELETE | /api/trees/:id    | Delete tree         | Admin   |
| GET    | /api/users        | List users          | Admin   |
| PATCH  | /api/users/:id/role | Update user role  | Admin   |
| GET    | /api/settings     | Get settings        | ✅      |
| PUT    | /api/settings    | Update settings     | Admin   |

## FlamaScript Design System

The dashboard uses a custom design system with:

- **Fire Colors**: Red (#FF0000) + Orange (#FF9100)
- **Glassmorphism**: Blurred glass panels with subtle borders
- **Neumorphism**: Soft shadows for depth
- **Hexagons**: Background pattern with animated hexagons

### Key Classes

- `.glass-card` - Glass panel with blur
- `.neu-card` - Neumorphic card
- `.neu-button` - Neumorphic button
- `.hex-module` - Hexagonal navigation module
- `.flama-button` - Fire gradient button
- `.flama-input` - Styled input field

## License

ISC

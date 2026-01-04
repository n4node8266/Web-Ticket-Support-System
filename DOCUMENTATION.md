# System Documentation

## Architecture Overview

The Web Ticket System follows a classic MVC (Model-View-Controller) structure, adapted for a lightweight Node.js environment.

### 1. Data Layer (`/data` & `/utils/db.js`)
*   **Storage**: Data is stored in local JSON files located in the `data/` directory.
*   **Interface**: `utils/db.js` provides helper functions `readData` and `writeData` to handle JSON parsing and file I/O safely.
*   **Entities**:
    *   `users.json`: Stores user profiles, hashed passwords, and roles.
    *   `tickets.json`: Stores ticket details, including status, priority, and messages.

### 2. API Layer (`/routes`)
The application exposes a RESTful API under the `/api` prefix.

*   **Auth Routes** (`/api/auth/*`):
    *   `POST /register`: Create a new user account.
    *   `POST /login`: Authenticate and receive a token/session.
    *   `GET /me`: Get current user details.

*   **Ticket Routes** (`/api/tickets/*`):
    *   `POST /tickets`: Create a new ticket (supports file upload).
    *   `GET /tickets`: List tickets (filtered by user role).
    *   `GET /tickets/:id`: Get detailed view of a specific ticket.
    *   `PUT /tickets/:id`: Update ticket details (status/priority).
    *   `POST /tickets/:id/messages`: Add a reply to a ticket.

*   **Admin Routes** (`/api/admin/*`):
    *   `GET /stats`: Aggregate system metrics.
    *   `GET /users`: List all registered users.
    *   `PUT /users/role`: Promote/demote users.
    *   `PUT /users/ban`: Ban/Unban access.

### 3. Controller Layer (`/controllers`)
Contains the business logic.
*   `authController.js`: Handles password hashing (bcrypt), validation, and session management.
*   `ticketController.js`: Manages ticket lifecycle, file attachment saving, and message threading.
*   `adminController.js`: Aggregates data for the dashboard and handles sensitive user operations.

### 4. Frontend (`/public`)
A Single Page Application (SPA)-like feel, built with vanilla HTML/JS.
*   `index.html`: Main entry point.
*   `js/app.js`: Client-side logic for API communication, DOM manipulation, and UI routing (hiding/showing sections).
*   `css/style.css`: Custom styling.

## Authentication Flow
1.  User submits credentials.
2.  Server verifies against `users.json`.
3.  If valid, server sets a session or returns a token (implementation detail in `authController`).
4.  Frontend stores this token/state and sends it in headers for subsequent requests.
5.  Middleware `verifyToken` checks validity before allowing access to protected routes.

## Admin Features
The admin dashboard is protected by `requireAdmin` middleware. It calculates stats on-the-fly by reading the `tickets.json` and `users.json` files.

## Future Improvements
*   **Database Migration**: Move from JSON files to MongoDB or PostgreSQL for scalability and persistence on serverless platforms.
*   **Real-time Updates**: Implement Socket.io for live chat/ticket updates without refreshing.
*   **Email Notifications**: Integrate Nodemailer to send email alerts on ticket updates.

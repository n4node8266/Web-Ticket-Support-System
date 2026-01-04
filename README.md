# Web Ticket System

A comprehensive, full-stack web-based ticketing support system built with Node.js and Express. This application provides a robust platform for managing customer support inquiries, featuring user roles (User/Support/Admin), real-time ticket tracking, and a dynamic admin dashboard.

## Features

*   **User Authentication**: Secure registration and login using JWT/Cookies (implied) and bcrypt for password hashing.
*   **Role-Based Access Control**:
    *   **User**: Create tickets, view own tickets, add messages/attachments.
    *   **Support**: View and reply to assigned tickets.
    *   **Admin**: Full access, manage users (promote/ban), view system statistics, export data.
*   **Ticket Management**:
    *   Create tickets with attachments.
    *   Status tracking (Open, In Progress, Closed).
    *   Priority levels.
    *   Conversation history (transcript).
*   **Admin Dashboard**:
    *   Visual statistics (Ticket counts, status distribution).
    *   User management table.
    *   Transcript viewer and export functionality.
*   **Deployment Ready**: Configured for Vercel serverless deployment.

## Tech Stack

*   **Backend**: Node.js, Express.js
*   **Database**: Local JSON-based storage (lightweight, no external DB required originally, expandable to MongoDB).
*   **Frontend**: HTML5, CSS3, Vanilla JavaScript.
*   **Security**: bcryptjs for password hashing.
*   **File Handling**: Multer for file uploads.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/web-ticket-system.git
    cd web-ticket-system
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    # For development (with nodemon)
    npm run dev

    # For production
    npm start
    ```

4.  **Access the application:**
    Open your browser and navigate to `http://localhost:3000`.

## Directory Structure

*   `controllers/`: Application logic for authentication, tickets, and admin features.
*   `routes/`: API route definitions.
*   `public/`: Static frontend files (HTML, CSS, JS).
*   `data/`: JSON storage files (users, tickets, etc.).
*   `utils/`: Helper functions (e.g., database interactions).
*   `middleware/`: Authentication and role verification middleware.

## Deployment

### Vercel
This project is configured for easy deployment on Vercel.
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the project root.

**Note:** The current storage implementation uses local JSON files. On serverless platforms like Vercel, data will not persist across deployments/sleeps. For production, consider migrating the `utils/db.js` logic to use MongoDB Atlas or another cloud database.

## License

ISC

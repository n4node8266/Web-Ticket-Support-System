const { readData, writeData } = require('../utils/db');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ message: 'Invalid token format' });
    }

    const tokens = readData('tokens');
    const validToken = tokens.find(t => t.token === token);

    if (!validToken) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    if (new Date(validToken.expires) < new Date()) {
        return res.status(401).json({ message: 'Token expired' });
    }

    const users = readData('users');
    const user = users.find(u => u.id === validToken.userId);

    if (!user) {
        return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;

    const now = new Date();
    const lastActive = user.lastActive ? new Date(user.lastActive) : new Date(0);
 
    if (now - lastActive > 5 * 60 * 1000) {
        user.lastActive = now.toISOString();
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
            users[userIndex] = user;
            writeData('users', users);
        }
    }

    next();
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};

const requireSupport = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'support') {
        return res.status(403).json({ message: 'Access denied: Support staff only' });
    }
    next();
};

module.exports = { verifyToken, requireAdmin, requireSupport };

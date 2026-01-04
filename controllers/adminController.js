const { readData, writeData } = require('../utils/db');

const getDashboardStats = (req, res) => {
    const tickets = readData('tickets');
    const users = readData('users');

    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const closedTickets = tickets.filter(t => t.status === 'Closed').length;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const staffOnline = users.filter(u =>
        (u.role === 'admin' || u.role === 'support') &&
        u.lastActive &&
        new Date(u.lastActive) > fiveMinutesAgo
    ).length;

    res.json({
        totalTickets,
        openTickets,
        closedTickets,
        staffOnline
    });
};

const getAllUsers = (req, res) => {
    const users = readData('users');

    const safeUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        lastActive: u.lastActive,
        banned: u.banned || false,
        createdAt: u.createdAt
    }));
    res.json(safeUsers);
};

const updateUserRole = (req, res) => {
    const { userId, role } = req.body;
    if (!['user', 'support', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    const users = readData('users');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    users[userIndex].role = role;
    writeData('users', users);

    res.json({ message: 'User role updated', user: users[userIndex] });
};

const toggleBanUser = (req, res) => {
    const { userId } = req.body;
    const users = readData('users');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

   
    if (users[userIndex].id === req.user.id) {
        return res.status(400).json({ message: 'Cannot ban yourself' });
    }

    users[userIndex].banned = !users[userIndex].banned;
    writeData('users', users);

    res.json({ message: `User ${users[userIndex].banned ? 'banned' : 'unbanned'}`, banned: users[userIndex].banned });
};

const exportTickets = (req, res) => {
    const tickets = readData('tickets');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(tickets, null, 2));
};

const getTranscripts = (req, res) => {
    const transcripts = readData('transcripts') || [];
    res.json(transcripts);
};

const deleteTranscripts = (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ message: 'Invalid IDs provided' });
    }

    let transcripts = readData('transcripts') || [];
    transcripts = transcripts.filter(t => !ids.includes(t.id));
    writeData('transcripts', transcripts);

    res.json({ message: `${ids.length} transcripts deleted permanentely` });
};

module.exports = { getDashboardStats, getAllUsers, updateUserRole, toggleBanUser, exportTickets, getTranscripts, deleteTranscripts };

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/db');

const register = async (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const users = readData('users');
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: uuidv4(),
        username,
        email,
        password: hashedPassword,
        role: 'user',
        createdAt: new Date().toISOString()
    };

    
    if (users.length === 0) {
        newUser.role = 'admin';
    }

    users.push(newUser);
    writeData('users', users);

    res.status(201).json({ message: 'User registered successfully', user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role } });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const users = readData('users');
    const user = users.find(u => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.banned) {
        return res.status(403).json({ message: 'Your account has been banned.' });
    }

    const token = uuidv4();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); 

    const tokens = readData('tokens');
    tokens.push({ token, userId: user.id, expires });
    writeData('tokens', tokens);

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
};

const logout = (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        let tokens = readData('tokens');
        tokens = tokens.filter(t => t.token !== token);
        writeData('tokens', tokens);
    }
    res.json({ message: 'Logged out' });
};

const getMe = (req, res) => {
    res.json(req.user);
};

module.exports = { register, login, logout, getMe };

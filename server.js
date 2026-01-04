const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { readData, writeData } = require('./utils/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api', apiRoutes);


app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});


const initializeAdmin = async () => {
    try {
        const users = readData('users');
        if (users.length === 0) {
            console.log('Initializing default admin account...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminUser = {
                id: uuidv4(),
                username: 'Admin',
                email: 'admin@n4.com',
                password: hashedPassword,
                role: 'admin',
                createdAt: new Date().toISOString()
            };
            users.push(adminUser);
            writeData('users', users);
            console.log('Default Admin created: admin@n4.com / admin123');
        }
    } catch (error) {
        console.error("Initialization error (likely due to read-only fs on serverless):", error.message);
    }
};


if (process.env.NODE_ENV !== 'production') {
    initializeAdmin();
}


module.exports = app;


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

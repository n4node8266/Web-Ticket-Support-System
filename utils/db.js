const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

const getFilePath = (collection) => path.join(dataDir, `${collection}.json`);

const readData = (collection) => {
    const filePath = getFilePath(collection);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
        return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    try {
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const writeData = (collection, data) => {
    const filePath = getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

module.exports = { readData, writeData };

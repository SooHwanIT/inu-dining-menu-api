const { PROFESSOR_MENU_FILE } = require('../server');
const fs = require('fs');

export default (req, res) => {
    try {
        const menu = JSON.parse(fs.readFileSync(PROFESSOR_MENU_FILE, 'utf-8'));
        res.status(200).json(menu);
    } catch (error) {
        console.error('Error reading professor menu file:', error);
        res.status(500).json({ error: 'Failed to retrieve professor menu' });
    }
};

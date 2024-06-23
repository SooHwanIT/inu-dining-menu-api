const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');
const app = express();

const STUDENT_DINING_URL = 'https://inucoop.com/main.php?mkey=2&w=2&l=1';
const PROFESSOR_DINING_URL = 'https://inucoop.com/main.php?mkey=2&w=2&l=2';
const STUDENT_MENU_FILE = 'student_menu.json';
const PROFESSOR_MENU_FILE = 'professor_menu.json';

async function getMenu(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let menu = [];

        $('#menuBox tbody tr').each((i, row) => {
            if (i === 0) {
                // Skip header row
                return;
            }

            const mealTime = $(row).find('td.corn_nm').text().trim();

            // Only keep specific meal times
            const validMealTimes = ["중식(백반)", "중식(일품)", "중식", "석식"];
            if (!validMealTimes.includes(mealTime)) {
                return;
            }

            $(row).find('td.din_lists, td.din_list').each((j, cell) => {
                if (j === (new Date().getDay() - 1)) {
                    const dishes = $(cell).html().split('<br>').map(d => d.trim()).filter(d => d && d !== "--------------");
                    if (dishes.length > 0) {
                        menu.push({ mealTime, dishes });
                    }
                }
            });
        });

        return menu;
    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }
}

async function saveMenuToFile(url, fileName) {
    const menu = await getMenu(url);
    fs.writeFileSync(fileName, JSON.stringify(menu, null, 2), 'utf-8');
}

// Schedule the task to run at midnight every day
cron.schedule('0 0 * * *', () => {
    console.log('Running the cron job to update menus');
    saveMenuToFile(STUDENT_DINING_URL, STUDENT_MENU_FILE);
    saveMenuToFile(PROFESSOR_DINING_URL, PROFESSOR_MENU_FILE);
});

// Initial fetch to ensure data is available on first run
saveMenuToFile(STUDENT_DINING_URL, STUDENT_MENU_FILE);
saveMenuToFile(PROFESSOR_DINING_URL, PROFESSOR_MENU_FILE);

app.get('/api/student-menu', (req, res) => {
    const menu = JSON.parse(fs.readFileSync(STUDENT_MENU_FILE, 'utf-8'));
    res.json(menu);
});

app.get('/api/professor-menu', (req, res) => {
    const menu = JSON.parse(fs.readFileSync(PROFESSOR_MENU_FILE, 'utf-8'));
    res.json(menu);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

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
                return;
            }

            const mealTime = $(row).find('td.corn_nm').text().trim();
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
        throw new Error('Failed to fetch menu data');
    }
}

async function saveMenuToFile(url, fileName) {
    try {
        const menu = await getMenu(url);
        fs.writeFileSync(fileName, JSON.stringify(menu, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error saving menu to ${fileName}:`, error);
        throw new Error(`Failed to save menu data to ${fileName}`);
    }
}

async function initialFetchAndSave() {
    try {
        await saveMenuToFile(STUDENT_DINING_URL, STUDENT_MENU_FILE);
        await saveMenuToFile(PROFESSOR_DINING_URL, PROFESSOR_MENU_FILE);
    } catch (error) {
        console.error('Error in initial fetch and save:', error);
        process.exit(1);
    }
}

module.exports = {
    getMenu,
    saveMenuToFile,
    initialFetchAndSave,
    STUDENT_MENU_FILE,
    PROFESSOR_MENU_FILE
};

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

const STUDENT_DINING_URL = 'https://inucoop.com/main.php?mkey=2&w=2&l=1';
const PROFESSOR_DINING_URL = 'https://inucoop.com/main.php?mkey=2&w=2&l=2';

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

app.get('/api/student-menu', async (req, res) => {
    try {
        const menu = await getMenu(STUDENT_DINING_URL);
        res.json(menu);
    } catch (error) {
        console.error('Error fetching student menu:', error);
        res.status(500).json({ error: 'Failed to retrieve student menu' });
    }
});

app.get('/api/professor-menu', async (req, res) => {
    try {
        const menu = await getMenu(PROFESSOR_DINING_URL);
        res.json(menu);
    } catch (error) {
        console.error('Error fetching professor menu:', error);
        res.status(500).json({ error: 'Failed to retrieve professor menu' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

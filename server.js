const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

const STUDENT_DINING_URL = 'https://inucoop.com/main.php?mkey=2&w=2&l=1';
const PROFESSOR_DINING_URL = 'https://inucoop.com/main.php?mkey=2&w=2&l=2';

const axiosConfig = {
    timeout: 60000 // 60 seconds
};

async function getMenu(url) {
    try {
        console.log(`Fetching menu from: ${url}`);
        const { data } = await axios.get(url, axiosConfig);
        console.log('Data fetched successfully:', data.substring(0, 100)); // 데이터의 첫 100자를 출력
        const $ = cheerio.load(data);
        console.log('HTML loaded into cheerio');

        let menu = [];

        $('#menuBox tbody tr').each((i, row) => {
            if (i === 0) {
                return;
            }

            const mealTime = $(row).find('td.corn_nm').text().trim();
            console.log(`Found mealTime: ${mealTime}`);
            const validMealTimes = ["중식(백반)", "중식(일품)", "중식", "석식"];
            if (!validMealTimes.includes(mealTime)) {
                return;
            }

            $(row).find('td.din_lists, td.din_list').each((j, cell) => {
                if (j === (new Date().getDay() - 1)) {
                    const dishes = $(cell).html().split('<br>').map(d => d.trim()).filter(d => d && d !== "--------------");
                    if (dishes.length > 0) {
                        console.log(`Found dishes: ${dishes}`);
                        menu.push({ mealTime, dishes });
                    }
                }
            });
        });

        console.log('Menu parsed successfully:', menu);
        return menu;
    } catch (error) {
        console.error('Error fetching menu:', error);
        throw new Error('Failed to fetch menu data');
    }
}

// Hello, World 출력
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// 학생 식단 메뉴 API
app.get('/api/student-menu', async (req, res) => {
    try {
        const menu = await getMenu(STUDENT_DINING_URL);
        res.json(menu);
    } catch (error) {
        console.error('Error fetching student menu:', error);
        res.status(500).json({ error: 'Failed to retrieve student menu' });
    }
});

// 교수 식단 메뉴 API
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

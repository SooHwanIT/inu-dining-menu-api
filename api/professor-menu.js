const axios = require('axios');
const cheerio = require('cheerio');

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

export default async (req, res) => {
    try {
        console.log('Fetching professor menu...');
        const menu = await getMenu(PROFESSOR_DINING_URL);
        console.log('Menu fetched:', menu);
        res.status(200).json(menu);
    } catch (error) {
        console.error('Error fetching professor menu:', error);
        res.status(500).json({ error: 'Failed to retrieve professor menu' });
    }
};

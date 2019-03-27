require('dotenv').config();

const fs = require('fs');
const util = require('util');
const faker = require('faker');
const SqlInsert = require('sql-insert-generator');

const { query } = require('./db');

const connectionString = process.env.DATABASE_URL;

const readFileAsync = util.promisify(fs.readFile);

// Setja upp flokka og vörur í gagnagrunn
async function addStuff() {
  const categories = [];
  const categoryAmount = 14;
  const productAmount = 1600;
  const imgAmount = 20;
  const sqlCommands = [];

  // Viljum 12+ flokka
  while (categories.length < categoryAmount) {
    const cat = faker.commerce.department();
    if (!categories.includes(cat)) {
      categories.push(cat);
    }
  }

  // Útbúa sql strengi fyrir flokka
  for (let i = 0; i < categoryAmount; i += 1) {
    const sqlString = new SqlInsert();
    sqlString.table('categories')
      .insert({ title: categories[i] });
    sqlCommands.push(`${sqlString.toString().slice(0, -1)} ON CONFLICT ON CONSTRAINT categories_title_key DO NOTHING;`);
  }

  // Útbúa sql strengi fyrir vörur
  for (let i = 0; i < productAmount; i += 1) {
    const fakeProduct = faker.fake('{{commerce.productAdjective}} {{commerce.productName}}');
    const descript = faker.lorem.paragraph();
    const randCatId = Math.floor(Math.random() * categoryAmount + 1);
    const randImgId = Math.floor(Math.random() * imgAmount + 1);
    const randImg = `img${randImgId}.jpg`;

    const sqlString = new SqlInsert();
    sqlString.table('products')
      .insert({ title: fakeProduct })
      .insert({ description: descript })
      .insert({ image: randImg })
      .insert({ categoryId: randCatId });
    sqlCommands.push(`${sqlString.toString().slice(0, -1)} ON CONFLICT ON CONSTRAINT products_title_key DO NOTHING;`);
  }

  // Setja í gagnagrunn
  const q = sqlCommands.join(' ');
  await query(q);
}

addStuff().catch((err) => {
  console.error(err);
});

async function main() {
  console.info(`Set upp gagnagrunn á ${connectionString}`);
  // Droppa töflum ef til
  await query('DROP TABLE IF EXISTS ordercartproducts');
  await query('DROP TABLE IF EXISTS ordercart');
  await query('DROP TABLE IF EXISTS users');
  await query('DROP TABLE IF EXISTS products');
  await query('DROP TABLE IF EXISTS categories');
  console.info('Töflum eytt');

  // Búa til töflur út frá skema
  try {
    const createTable = await readFileAsync('./src/database/sql/schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Töflur búnar til');
  } catch (e) {
    console.error('Villa við að búa til töflur:', e.message);
    return;
  }

  await addStuff();

  // Bæta færslum við töflur
  try {
    const insert = await readFileAsync('./src/database/sql/insert.sql');
    await query(insert.toString('utf8'));
    console.info('Gögnum bætt við');
  } catch (e) {
    console.error('Villa við að bæta gögnum við:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});

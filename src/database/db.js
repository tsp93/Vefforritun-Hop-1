const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

/**
 * Framkvæma SQL skipun
 *
 * @param {string} sqlQuery - SQL skipun til að framkvæma
 * @param {array} [values=[]] - Gildi til að stinga í skipun
 *
 * @returns {Promise} Promise fyrir niðurstöðuna úr SQL skipuninni
 */
async function query(sqlQuery, values = []) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(sqlQuery, values);

    return result;
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = {
  query,
};

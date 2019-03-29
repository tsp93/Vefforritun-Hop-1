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

  let result;

  try {
    result = await client.query(sqlQuery, values);
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }

  return result;
}

/**
 * Framkvæma SQL skipun með niðurstöðum skipt niður á síður
 *
 * @param {string} sqlQuery - SQL skipun til að framkvæma
 * @param {number} offset - Hversu mikið á að offsetta
 * @param {number} limit - Hversu margar niðurstöður á að sýna í einu
 * @param {array} [values=[]] - Gildi til að stinga í skipun
 *
 * @returns {Promise} Promise fyrir niðurstöðuna úr SQL skipuninni
 */
async function paged(sqlQuery, { offset = 0, limit = 10, values = [] }) {
  const sqlLimit = values.length + 1;
  const sqlOffset = values.length + 2;
  const pagedQuery = `${sqlQuery} LIMIT $${sqlLimit} OFFSET $${sqlOffset}`;

  const limitAsNumber = Number(limit);
  const offsetAsNumber = Number(offset);

  const cleanLimit = Number.isInteger(limitAsNumber) && limitAsNumber > 0 ? limitAsNumber : 10;
  const cleanOffset = Number.isInteger(offsetAsNumber) && offsetAsNumber > 0 ? offsetAsNumber : 0;

  const combinedValues = values.concat([cleanLimit, cleanOffset]);

  const result = await query(pagedQuery, combinedValues);

  return {
    limit: cleanLimit,
    offset: cleanOffset,
    rows: result.rows,
  };
}

/**
 * Uppfæra töflu í gagnagrunn
 *
 * @param {string} table - Tafla sem á að uppfæra
 * @param {number} id - Id þess sem á að uppfæra
 * @param {number} fields - Dálkarnir sem eiga að uppfærast
 * @param {array} values - Uppfærð gildi
 *
 * @returns {Promise} Promise fyrir niðurstöðuna úr SQL uppfærslu
 */
async function conditionalUpdate(table, id, fields, values) {
  const filteredFields = fields.filter(i => typeof i === 'string');
  const filteredValues = values.filter(i => typeof i === 'string' || typeof i === 'number');

  if (filteredFields.length === 0) {
    return false;
  }

  if (filteredFields.length !== filteredValues.length) {
    throw new Error('fields and values must be of equal length');
  }

  // id is field = 1
  const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE ${table} SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING *`;

  const result = await query(q, [id].concat(filteredValues));

  return result;
}

module.exports = {
  query,
  paged,
  conditionalUpdate,
};

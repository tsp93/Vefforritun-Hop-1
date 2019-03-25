const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

// Tekur query og skilar result
async function query(q, values = []) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q, values);

    return result;
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

// Stingur umsókn í gagnagrunninn
async function insert(data) {
  const q = `
  INSERT INTO applications
  (name, email, phone, text, job)
  VALUES
  ($1, $2, $3, $4, $5)`;
  const values = [data.name, data.email, data.phone, data.text, data.job];

  return query(q, values);
}

// Sækir allar umsóknir
async function select() {
  const result = await query('SELECT * FROM applications ORDER BY id');

  return result.rows;
}

// Uppfærir umsókn
async function update(id) {
  const q = `
  UPDATE applications
  SET processed = true, updated = current_timestamp
  WHERE id = $1`;

  return query(q, [id]);
}

// Eyðir umsókn
async function deleteRow(id) {
  const q = 'DELETE FROM applications WHERE id = $1';

  return query(q, [id]);
}

// Sækir alla notendur
async function selectUsers() {
  const result = await query('SELECT * FROM users ORDER BY id');

  return result.rows;
}

// Uppfærir alla notendur
async function updateUsers(ids, admin) {
  const results = [];

  const q = 'UPDATE users SET admin = $1 WHERE id = $2';
  for (let i = 0; i < ids.length; i += 1) {
    results.push(query(q, [admin[i], ids[i]]));
  }

  const baz = await Promise.all(results);
  return baz;
}

module.exports = {
  query,
  insert,
  select,
  update,
  deleteRow,
  selectUsers,
  updateUsers,
};

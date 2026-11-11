const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Validate required environment variables
const requiredEnvVars = ['TURSO_CATALOG_URL', 'TURSO_CATALOG_AUTH_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file');
  process.exit(1);
}

// Paths relative to repo root
const schemaPath = path.join(__dirname, '..', 'database', 'catalog-db', 'schema.sql');
const seedPath = path.join(__dirname, '..', 'database', 'catalog-db', 'seed.sql');

// Initialize Turso client
const client = createClient({
  url: process.env.TURSO_CATALOG_URL,
  authToken: process.env.TURSO_CATALOG_AUTH_TOKEN
});

async function pushCatalog() {
  const isDestructive = process.argv.includes('--destructive');

  try {
    console.log('Reading schema...');
    let schema = fs.readFileSync(schemaPath, 'utf8');

    let seedData = '';
    try {
      seedData = fs.readFileSync(seedPath, 'utf8');
    } catch (e) {
      console.error('Could not read seed file:', e.message);
      process.exit(1); // Requirements: "does not silently skip the seed file"
    }

    console.log('Pushing schema idempotently...');
    const schemaStatements = schema.split(';').filter(stmt => stmt.trim() !== '');
    for (const statement of schemaStatements) {
      if (statement.trim()) {
        await client.execute(statement.trim());
      }
    }
    console.log('Schema pushed successfully.');

    // Remove destructive DELETE commands unless explicitly flagged
    let finalSeedData = seedData;
    if (!isDestructive) {
      // Remove the delete lines from seed.sql
      finalSeedData = finalSeedData.replace(/DELETE FROM [a-zA-Z_]+;/gi, '');
      // Change INSERT INTO to INSERT OR IGNORE INTO to preserve edits
      finalSeedData = finalSeedData.replace(/INSERT INTO/gi, 'INSERT OR IGNORE INTO');
    }

    console.log('Seeding initial data...');
    const seedStatements = finalSeedData.split(';').filter(stmt => stmt.trim() !== '');
    for (const statement of seedStatements) {
      if (statement.trim()) {
        await client.execute(statement.trim());
      }
    }
    console.log('Data seeded successfully!');

    // Report safe counts
    const productsRes = await client.execute('SELECT COUNT(*) AS total_products FROM products');
    const activeRes = await client.execute('SELECT COUNT(*) AS active_products FROM products WHERE is_active = 1');
    const variantsRes = await client.execute('SELECT COUNT(*) AS total_variants FROM variants');
    const stockRes = await client.execute('SELECT COUNT(*) AS variants_with_stock FROM variants WHERE stock_count > 0');

    console.log('\n--- Final Database Status ---');
    console.log(`Total Products: ${productsRes.rows[0].total_products}`);
    console.log(`Active Products: ${activeRes.rows[0].active_products}`);
    console.log(`Total Variants: ${variantsRes.rows[0].total_variants}`);
    console.log(`Variants with Stock: ${stockRes.rows[0].variants_with_stock}`);

    process.exit(0);
  } catch (error) {
    console.error('Error pushing to Turso:', error);
    process.exit(1);
  }
}

pushCatalog();
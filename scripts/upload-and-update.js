require('dotenv').config({ path: __dirname + '/../.env' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { initializeDatabaseConnections, getDatabaseConnection } = require('../server/config/turso');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const imageDir = 'D:\\hackathon\\Redveg-F\\rvimage';

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    console.log("Initializing database connections...");
    await initializeDatabaseConnections();
    const db = await getDatabaseConnection('catalog');
    
    // Get all products to match against
    const result = await db.execute('SELECT id, name FROM products');
    const products = result.rows;

    const files = fs.readdirSync(imageDir);

    console.log("Starting image upload and database update...");
    for (const file of files) {
      if (!file.match(/\.(jpg|jpeg|png)$/i)) continue;
      
      const filePath = path.join(imageDir, file);
      const nameWithoutExt = path.parse(file).name;
      
      console.log(`\nProcessing image: ${file}`);
      
      try {
        // Upload to Cloudinary
        console.log(`  Uploading to Cloudinary...`);
        const uploadResult = await cloudinary.uploader.upload(filePath, {
          folder: 'redveg/catalog',
          use_filename: true,
          unique_filename: false
        });
        
        const imageUrl = uploadResult.secure_url;
        console.log(`  ✅ Uploaded: ${imageUrl}`);

        // Find matching product in DB
        let bestMatch = null;
        let highestSim = 0;
        
        for (const product of products) {
          const n1 = normalize(nameWithoutExt);
          const n2 = normalize(product.name);
          
          let sim = 0;
          if (n1 === n2) sim = 1.0;
          else if (n1.includes(n2) || n2.includes(n1)) sim = 0.8;
          
          // Special cases
          if (n2 === 'bagdachingri' && n1 === 'baghdachingri') sim = 1.0;
          if (n2 === 'bangladeshihilsa' && n1 === 'bangladeshihilsha') sim = 1.0;
          if (n2 === 'desishol' && n1 === 'deshishol') sim = 1.0;
          
          if (sim > highestSim) {
            highestSim = sim;
            bestMatch = product;
          }
        }

        if (highestSim > 0 && bestMatch) {
          console.log(`  Matching product found: "${bestMatch.name}" (ID: ${bestMatch.id})`);
          
          // Update the database
          await db.execute({
            sql: 'UPDATE products SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            args: [imageUrl, bestMatch.id]
          });
          
          console.log(`  ✅ Database updated successfully.`);
        } else {
          console.log(`  ❌ Could not find a matching product in database for '${nameWithoutExt}'`);
        }

        // Delay between uploads as requested ("don't rush")
        await sleep(2000);
      } catch (err) {
        console.error(`  ❌ Failed processing ${file}:`, err);
      }
    }

    console.log("\nAll images processed!");
    process.exit(0);

  } catch (err) {
    console.error("Script failed:", err);
    process.exit(1);
  }
}

main();

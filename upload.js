require('dotenv').config({ path: __dirname + '/.env' });
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const imageDir = 'D:\\redveg\\rvimage';
const seedSqlPath = 'd:\\redveg\\database\\catalog-db\\seed.sql';

// Function to normalize strings for comparison
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Function to calculate simple similarity
function similarity(s1, s2) {
  const n1 = normalize(s1);
  const n2 = normalize(s2);
  if (n1 === n2) return 1.0;
  if (n1.includes(n2) || n2.includes(n1)) return 0.8;
  return 0.0; // Simplistic
}

async function main() {
  const files = fs.readdirSync(imageDir);
  const uploads = {};

  console.log("Uploading images...");
  for (const file of files) {
    if (!file.match(/\.(jpg|jpeg|png)$/i)) continue;
    
    const filePath = path.join(imageDir, file);
    const nameWithoutExt = path.parse(file).name;
    
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'redveg/catalog',
        use_filename: true,
        unique_filename: false
      });
      console.log(`Uploaded ${file} -> ${result.secure_url}`);
      uploads[nameWithoutExt] = result.secure_url;
    } catch (err) {
      console.error(`Failed to upload ${file}:`, err);
    }
  }

  console.log("Updating seed.sql...");
  let sqlContent = fs.readFileSync(seedSqlPath, 'utf-8');
  
  const productRegex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([0-1])\)/g;
  
  let newSqlContent = sqlContent.replace(productRegex, (match, id, name, desc, category, imageUrl, active) => {
    // Find best match in uploads
    let bestMatchUrl = imageUrl;
    let highestSim = 0;
    
    for (const [imgName, url] of Object.entries(uploads)) {
      let sim = similarity(name, imgName);
      // special cases for bagda/baghda, hilsha/hilsa, katla/katla, etc
      if (normalize(name) === 'bagdachingri' && normalize(imgName) === 'baghdachingri') sim = 1.0;
      if (normalize(name) === 'bangladeshihilsa' && normalize(imgName) === 'bangladeshihilsha') sim = 1.0;
      if (normalize(name) === 'desishol' && normalize(imgName) === 'deshishol') sim = 1.0;
      if (normalize(name) === 'katlakata' && normalize(imgName) === 'katla') sim = 0.9;
      if (normalize(name) === 'katlaonlypeti' && normalize(imgName) === 'katlapeti') sim = 0.9;
      if (normalize(name) === 'katlagota' && normalize(imgName) === 'katla') sim = 0.9;
      
      if (sim > highestSim) {
        highestSim = sim;
        bestMatchUrl = url;
      }
    }

    if (highestSim > 0) {
      console.log(`Matched product '${name}' to image URL ${bestMatchUrl}`);
    } else {
      console.log(`Could not find image for product '${name}', keeping original URL.`);
    }

    return `('${id}', '${name}', '${desc}', '${category}', '${bestMatchUrl}', ${active})`;
  });

  fs.writeFileSync(seedSqlPath, newSqlContent, 'utf-8');
  console.log("Done updating seed.sql!");
}

main().catch(console.error);

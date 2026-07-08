const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const folders = [
  path.join(__dirname, "..", "public", "frames60"),
  path.join(__dirname, "..", "public", "frames60hd"),
];

async function convertFrames() {
  for (const folder of folders) {
    const files = fs.readdirSync(folder).filter(f => f.endsWith(".jpg"));
    console.log(`📁 Convertendo ${files.length} frames em ${path.basename(folder)}...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const inputPath = path.join(folder, file);
      const outputPath = path.join(folder, file.replace(".jpg", ".webp"));

      if (fs.existsSync(outputPath)) continue; // skip if already exists

      await sharp(inputPath)
        .webp({ quality: 92, effort: 4 })
        .toFile(outputPath);

      if ((i + 1) % 50 === 0) {
        console.log(`  Progresso: ${i + 1}/${files.length}`);
      }
    }

    console.log(`  ✅ ${path.basename(folder)} concluído!`);
  }

  console.log("\n🎉 Todos os frames convertidos para WebP!");
}

convertFrames().catch(err => {
  console.error("Erro:", err);
  process.exit(1);
});
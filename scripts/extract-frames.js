import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'ffmpeg-static';

const videoPath = path.resolve('public/Beauty_salon_space_diversity_202607061652.mp4');
const outputDir = path.resolve('public/frames');

console.log('FFmpeg binary path:', ffmpeg);
console.log('Video path:', videoPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Limpa qualquer frame existente
const existingFiles = fs.readdirSync(outputDir);
for (const file of existingFiles) {
  fs.unlinkSync(path.join(outputDir, file));
}

console.log('Extraindo frames do vídeo...');

try {
  // Executa o ffmpeg para extrair frames a 30fps
  // Usamos -q:v 4 para alta qualidade jpeg (escala de 1 a 31, menor é melhor)
  // Usamos -vf scale=1280:-1 para redimensionar a largura para 1280px mantendo o aspect ratio (garante performance de carregamento no browser)
  const cmd = `"${ffmpeg}" -i "${videoPath}" -vf "fps=30,scale=1280:-1" -q:v 4 "${path.join(outputDir, 'frame_%04d.jpg')}"`;
  console.log('Rodando comando:', cmd);
  execSync(cmd, { stdio: 'inherit' });
  console.log('Frames extraídos com sucesso para public/frames/');
  
  // Lista arquivos para ver quantos foram gerados
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.jpg'));
  console.log(`Total de frames gerados: ${files.length}`);
} catch (error) {
  console.error('Erro ao extrair frames:', error.message);
}

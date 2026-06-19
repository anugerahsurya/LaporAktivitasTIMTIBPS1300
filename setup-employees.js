import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src/data');
const targetFile = path.join(srcDir, 'employees.js');
const sourceFile = path.join(srcDir, 'employees.example.js');

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

if (!fs.existsSync(targetFile)) {
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log('Created employees.js from employees.example.js');
  } else {
    // Write default fallback content
    fs.writeFileSync(targetFile, `export const employees = [
  { id: 1, nip: '199001012015031001', name: 'Pegawai Contoh 1', role: 'Anggota' },
  { id: 2, nip: '199102022016042002', name: 'Pegawai Contoh 2', role: 'Anggota' }
];\n`);
    console.log('Created default employees.js since example file was missing');
  }
} else {
  console.log('employees.js already exists.');
}

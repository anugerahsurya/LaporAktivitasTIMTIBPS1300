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
  { id: 1, name: 'Aan Subrata', role: 'Ketua Tim', team: 'Tim IT' },
  { id: 2, name: 'Ihsan Pratama', role: 'Anggota', team: 'Tim Sistem Informasi Statistik' },
  { id: 3, name: 'Tri Hayuni Syardi', role: 'Anggota', team: 'Tim Metodologi Statistik dan Sains Data' },
  { id: 4, name: 'Ryche Pranita', role: 'Anggota', team: 'Tim Sistem Informasi Statistik' },
  { id: 5, name: 'Benny Firmansyah', role: 'Anggota', team: 'Tim Sistem Informasi Statistik' },
  { id: 6, name: 'Hardini Juliarti', role: 'Anggota', team: 'Tim Metodologi Statistik dan Sains Data' },
  { id: 7, name: 'Hamdi Rafiqi', role: 'Anggota', team: 'Tim Sistem Informasi Statistik' },
  { id: 8, name: 'Ryan Oktarino', role: 'Anggota', team: 'Tim Sistem Informasi Statistik' },
  { id: 9, name: 'M. Hafiz Al Ihsan', role: 'Anggota', team: 'Tim Metodologi Statistik dan Sains Data' },
  { id: 10, name: 'Giani Jovita Jane', role: 'Anggota', team: 'Tim Sistem Informasi Statistik' },
  { id: 11, name: 'Anugerah Surya Atmaja', role: 'Anggota', team: 'Tim Metodologi Statistik dan Sains Data' }
];\n`);
    console.log('Created default employees.js since example file was missing');
  }
} else {
  console.log('employees.js already exists.');
}

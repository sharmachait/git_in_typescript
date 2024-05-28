import fs from 'fs';
import path from 'path';
import { calculateSha1, getFileMode, hashFile } from '../utils/helperFunctions';
import zlib from 'zlib';

export function writeTree(dir: string): string {
  const readDir = fs.readdirSync(dir);
  readDir.sort();
  let files: string[] = [];
  let dirs: string[] = [];
  for (let fileOrDir of readDir) {
    if (fileOrDir === '.git') continue;
    const subPath = path.join(dir, fileOrDir);
    let stats = fs.statSync(subPath);
    if (stats.isFile()) files.push(fileOrDir);
    else dirs.push(fileOrDir);
  }

  let dirBuffers: Map<string, Buffer> = new Map();
  for (let subDir of dirs) {
    const dirSha = writeTree(path.join(dir, subDir));
    const modeBuffer = Buffer.from('40000 ');
    const nameBuffer = Buffer.from(subDir);
    const nullBuffer = Buffer.from([0]);
    const shaBuffer = Buffer.from(dirSha, 'hex');
    const dirBuffer = Buffer.concat([
      modeBuffer,
      nameBuffer,
      nullBuffer,
      shaBuffer,
    ]);
    dirBuffers.set(subDir, dirBuffer);
  }

  let fileBuffers: Map<string, Buffer> = new Map();
  for (let file of files) {
    const filePath = path.join(dir, file);
    const fileMode = getFileMode(fs.statSync(filePath));
    const fileSha = hashFile(filePath);
    const modeBuffer = Buffer.from(fileMode + ' ');
    const nameBuffer = Buffer.from(file);
    const nullBuffer = Buffer.from([0]);
    const shaBuffer = Buffer.from(fileSha, 'hex');
    const fileBuffer = Buffer.concat([
      modeBuffer,
      nameBuffer,
      nullBuffer,
      shaBuffer,
    ]);
    fileBuffers.set(file, fileBuffer);
  }

  let contentBuffer = Buffer.alloc(0);

  for (let item of readDir) {
    if (item === '.git') continue;
    const subPath = path.join(dir, item);
    let stats = fs.statSync(subPath);
    if (stats.isFile()) {
      const buff = fileBuffers.get(item);
      if (buff !== undefined) {
        contentBuffer = Buffer.concat([contentBuffer, buff]);
      }
    } else {
      const buff = dirBuffers.get(item);
      if (buff !== undefined) {
        contentBuffer = Buffer.concat([contentBuffer, buff]);
      }
    }
  }

  const bufferHeaderString = `tree ${contentBuffer.length}\0`;
  contentBuffer = Buffer.concat([
    Buffer.from(bufferHeaderString),
    contentBuffer,
  ]);

  const sha = calculateSha1(contentBuffer);
  const folderName = sha.substring(0, 2);
  const fileName = sha.substring(2);
  const folderPath = path.join('.git', 'objects', folderName);
  const compressedFilePath = path.join(folderPath, fileName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const compressedBuffer = zlib.deflateSync(contentBuffer);
  fs.writeFileSync(compressedFilePath, compressedBuffer);
  return sha;
}

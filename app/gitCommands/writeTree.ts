import fs from 'fs';
import path from 'path';
import { calculateSha1, getFileMode, hashFile } from '../utils/helperFunctions';
import zlib from 'zlib';

export function writeTree(dir: string): string {
  const readDir = fs.readdirSync(dir);
  readDir.sort();
  let files = [];
  let dirs = [];
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
    const modeBuffer = Buffer.from('040000');
    const spaceBuffer = Buffer.from(' ');
    const nameBuffer = Buffer.from(subDir);
    const nullBuffer = Buffer.from([0]);
    const shaBuffer = Buffer.from(dirSha, 'hex');
    const dirBuffer = Buffer.concat([
      modeBuffer,
      spaceBuffer,
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
    const modeBuffer = Buffer.from(fileMode);
    const spaceBuffer = Buffer.from(' ');
    const nameBuffer = Buffer.from(file);
    const nullBuffer = Buffer.from([0]);
    const shaBuffer = Buffer.from(fileSha, 'hex');
    const fileBuffer = Buffer.concat([
      modeBuffer,
      spaceBuffer,
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
      if (buff === undefined) {
        continue;
      }
      contentBuffer = Buffer.concat([contentBuffer, buff]);
    } else {
      const buff = dirBuffers.get(item);
      if (buff === undefined) {
        continue;
      }
      contentBuffer = Buffer.concat([contentBuffer, buff]);
    }
  }

  let bufferHeaderString = 'tree ' + contentBuffer.length;
  contentBuffer = Buffer.concat([
    Buffer.from(bufferHeaderString),
    Buffer.from([0]),
    contentBuffer,
  ]);
  const sha = calculateSha1(contentBuffer);
  const folderName = sha.substring(0, 2);
  const fileName = sha.substring(2);
  const folderPath = `.git/objects/${folderName}`;
  const compressedFilePath = `${folderPath}/${fileName}`;
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const compressedBuffer = zlib.deflateSync(contentBuffer);
  fs.writeFileSync(compressedFilePath, compressedBuffer);
  return sha;
}

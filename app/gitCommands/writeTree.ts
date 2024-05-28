import fs from 'fs';
import path from 'path';
import { getFileMode, hashFile } from '../utils/helperFunctions';
const pathToObjects = '.git/objects/';

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
  console.log({ fileBuffers });
  console.log({ dirBuffers });
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

  return 'some sha';
}
// tree <size>\0
// <mode> <name>\0<sha>
// <mode> <name>\0<sha>

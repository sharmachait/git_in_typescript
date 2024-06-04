import crypto from 'crypto';
import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import axios from 'axios';

export function calculateSha1(buffer: Buffer): string {
  const hash = crypto.createHash('sha1');
  hash.update(buffer);
  return hash.digest('hex');
}

export function getContentFromHash(hash: string): Buffer {
  const folderName = hash.substring(0, 2);
  const fileName = hash.substring(2, hash.length);
  const compressedFilePath = `.git/objects/${folderName}/${fileName}`;
  try {
    const compressedData = fs.readFileSync(compressedFilePath);
    const buffer = zlib.unzipSync(compressedData);

    const content = buffer;
    return content;
  } catch (e) {
    console.error('An error occurred:', e);
    return Buffer.from('');
  }
}

export function parseTreeContent(content: Buffer): string[] {
  let names: string[] = [];
  let indexOfNull = content.indexOf('\0');
  let body = content.subarray(indexOfNull + 1, content.length);

  let bodyString = body.toString();
  let spaceIndex = bodyString.indexOf(' ');
  while (spaceIndex !== -1) {
    bodyString = bodyString.substring(spaceIndex + 1, bodyString.length);
    let nullIndex = bodyString.indexOf('\u0000');
    let name = bodyString.substring(0, nullIndex);
    spaceIndex = bodyString.indexOf(' ');
    names.push(name);
  }
  // console.log({ names });
  return names;
}

export function getFileMode(stats: fs.Stats): string {
  if (stats.isSymbolicLink()) {
    return '120000';
  } else if (stats.mode & 0o111) {
    return '100755';
  } else {
    return '100644';
  }
}

export function hashFile(filePath: string): string {
  const absolutePath = path.resolve(filePath);
  try {
    const data = fs.readFileSync(absolutePath);
    const size = data.length;
    const header = `blob ${size}\0`;
    const headerBuffer = Buffer.from(header);
    const bufferToWrite = Buffer.concat([headerBuffer, data]);
    const sha = calculateSha1(bufferToWrite);
    const folderName = sha.substring(0, 2);
    const fileName = sha.substring(2);
    const folderPath = path.join('.git', 'objects', folderName);
    const compressedFilePath = path.join(folderPath, fileName);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const compressedBuffer = zlib.deflateSync(bufferToWrite);
    fs.writeFileSync(compressedFilePath, compressedBuffer);
    return sha;
  } catch (err) {
    console.error('An error occurred:', err);
    return '';
  }
}

export function writeBufferToObject(contentBuffer: Buffer): string {
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

export function parsePkt(data: string): string[] {
  let lines: string[] = [];
  let i = 0;
  for (let j = 0; j < 1000; j++) {
    let len = parseInt(data.substring(i, i + 4), 16);
    let line = data.substring(i + 4, i + len);
    lines.push(line);
    if (len == 0) {
      i += 4;
    } else {
      i += len;
    }
    if (i >= data.length) break;
  }
  return lines;
}

export function pktBuilder(lines: string[]): string {
  let res: string[] = [];
  for (let line of lines) {
    let lenP5 = line.length + 5;
    let hexString = lenP5.toString(16).padStart(4, '0');

    res.push(hexString);
    res.push(line);
    res.push('\n');
  }
  res.push('0000');
  console.log(res);
  return res.join('');
}

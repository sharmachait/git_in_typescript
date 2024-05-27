import crypto from 'crypto';
import fs from 'fs';
import zlib from 'zlib';

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

export function parseTreeContent(content: string): string[] {
  console.log(content);
  return [''];
}

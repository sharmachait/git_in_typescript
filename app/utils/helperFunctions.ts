import crypto from 'crypto';
import fs from 'fs';
import zlib from 'zlib';

export function calculateSha1(buffer: Buffer): string {
  const hash = crypto.createHash('sha1');
  hash.update(buffer);
  return hash.digest('hex');
}

export function getContentFromHash(hash: string): string {
  const folderName = hash.substring(0, 2);
  const fileName = hash.substring(2, hash.length);
  const compressedFilePath = `.git/objects/${folderName}/${fileName}`;
  try {
    const compressedData = fs.readFileSync(compressedFilePath);
    const buffer = zlib.unzipSync(compressedData);
    const nullByteIndex = buffer.indexOf(0);

    if (nullByteIndex === -1) {
      throw new Error('Invalid Git object format');
    }

    const content = buffer
      .subarray(nullByteIndex + 1, buffer.length)
      .toString();
    return content;
  } catch (e) {
    console.error('An error occurred:', e);
    return '';
  }
}

export function parseTreeContent(content: string): string[] {
  console.log(content);
  return [''];
}

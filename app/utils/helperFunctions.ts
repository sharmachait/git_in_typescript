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

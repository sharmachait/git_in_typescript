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

export function readObject(to: string, hash: string): [string, Buffer] {
  const folderName = hash.substring(0, 2);
  const fileName = hash.substring(2, hash.length);
  const compressedFilePath = path.join(
    to,
    `/.git/objects/`,
    folderName,
    fileName
  );
  try {
    const compressedData = fs.readFileSync(compressedFilePath);
    const buffer = zlib.unzipSync(compressedData);
    const head = buffer.subarray(0, buffer.indexOf(Buffer.from([0])));
    const body = buffer.subarray(buffer.indexOf(Buffer.from([0])));
    const objectType = head
      .subarray(0, head.indexOf(Buffer.from(' ')))
      .toString();
    return [objectType, body];
  } catch (e) {
    console.error('An error occurred:', e);
    return ['', Buffer.from('')];
  }
}

export function writeObject(
  to: string,
  objectType: string,
  body: Buffer
): string {
  const content = Buffer.concat([
    Buffer.from(objectType + ' ' + body.length.toString()),
    Buffer.from([0]),
    body,
  ]);
  const sha = calculateSha1(content);
  const compressedBuffer = zlib.deflateSync(content);
  const folderName = sha.substring(0, 2);
  const fileName = sha.substring(2);
  const compressedFilePath = path.join(
    to,
    '.git',
    'objects',
    folderName,
    fileName
  );
  fs.writeFileSync(compressedFilePath, compressedBuffer);
  return sha;
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

export async function fetchRefs(url: string): Promise<Map<string, string>> {
  const refs = new Map<string, string>();
  try {
    const response = await axios.get(
      `${url}/info/refs?service=git-upload-pack`,
      {
        responseType: 'arraybuffer',
      }
    );
    const data = Buffer.from([response.data]);
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || line.length < 4) continue;

      const bs1 = line.substring(4);
      if (!bs1) continue;

      const bs2 = bs1.split('\0')[0];
      const bs = (bs2.endsWith('HEAD') ? bs2.substring(4) : bs2).split(' ');

      if (bs.length >= 2) {
        refs.set(bs[1], bs[0]);
      }
    }
    return refs;
  } catch (e) {
    console.error('Error fetching git-upload-pack info:', e);
    return refs;
  }
}

export function renderRefs(refs: Map<string, string>, parent: string) {
  for (const [name, sha] of refs) {
    const filePath = path.join(parent, '.git', name);
    fs.writeFileSync(filePath, sha + '\n', 'utf8');
  }
}

export async function fetchpack(
  url: string,
  refs: Map<string, string>
): Promise<Buffer> {
  let packFile = Buffer.from([0]);

  let refVals = refs.values();

  let wants: Buffer[] = [];
  for (let refval of refVals) {
    wants.push(Buffer.from(`0032want ${refval}\n`));
  }

  const body = Buffer.concat([
    Buffer.from('0011command=fetch0001000fno-progress'),
    ...wants,
    Buffer.from('0009done\n0000'),
  ]);

  try {
    const response = await axios.post(`${url}/git-upload-pack`, body, {
      headers: {
        'Content-Type': 'application/x-git-upload-pack-request',
        'Git-Protocol': 'version=2',
      },
      responseType: 'arraybuffer',
    });

    let packBytes = Buffer.from(response.data);
    const packLines: Buffer[] = [];
    while (packBytes.length > 0) {
      const lineLen = parseInt(packBytes.subarray(0, 4).toString(), 16);
      if (lineLen === 0) {
        break;
      }
      packLines.push(packBytes.subarray(4, lineLen));
      packBytes = packBytes.subarray(lineLen);
    }
    const packFile = Buffer.concat(
      packLines.slice(1).map((line) => line.subarray(1))
    );
    return packFile;
  } catch (e) {
    console.log(e);
    return packFile;
  }
}

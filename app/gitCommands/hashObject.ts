import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { calculateSha1 } from '../utils/helperFunctions';

export default function hashObject(args: string[]) {
  if (args.length < 3) {
    throw new Error('Options and parameters (file path) expected');
  }

  const option = args[1];
  if (option !== '-w') {
    throw new Error('Invalid Options');
  }

  const filePath: string = args[2];
  const absolutePath = path.resolve(filePath);

  try {
    const data = fs.readFileSync(absolutePath);
    // Calculate SHA1
    const size = data.length;
    const header = `blob ${size}\0`;
    const headerBuffer = Buffer.from(header);
    const bufferToWrite = Buffer.concat([headerBuffer, data]);
    const sha = calculateSha1(bufferToWrite);

    const folderName = sha.substring(0, 2);
    const fileName = sha.substring(2);
    const folderPath = `.git/objects/${folderName}`;
    const compressedFilePath = `${folderPath}/${fileName}`;

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const compressedBuffer = zlib.deflateSync(bufferToWrite);
    fs.writeFileSync(compressedFilePath, compressedBuffer);
    process.stdout.write(sha);
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

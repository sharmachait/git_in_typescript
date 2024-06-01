import { writeBufferToObject } from '../utils/helperFunctions';
import zlib from 'zlib';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
export function commitTree(args: string[]): string {
  try {
    const treeSha = args[1];
    const pFlag = args[2];
    const parentSha = args[3];
    const mFlag = args[4];
    const message = args[5];
    // console.log({ message });
    if (
      treeSha === undefined ||
      pFlag === undefined ||
      parentSha === undefined ||
      mFlag === undefined ||
      message === undefined
    ) {
      throw new Error('Invalid arguments');
    }

    const tree = `tree ${treeSha}\n`;
    const parent = `parent ${parentSha}\n`;
    const authorName = process.env.GIT_AUTHOR_NAME || 'Chaitanya Sharma';
    const authorEmail = process.env.GIT_AUTHOR_EMAIL || 'Chai8126@gmail.com';
    const timeStamp = Math.floor(Date.now() / 1000);
    const date = new Date();
    const timezone = date.getTimezoneOffset();
    const author =
      'author ' +
      authorName +
      ' <' +
      authorEmail +
      '> ' +
      timeStamp +
      ' ' +
      timezone +
      '\n';

    const committer =
      'committer ' +
      authorName +
      ' <' +
      authorEmail +
      '> ' +
      timeStamp +
      ' ' +
      timezone +
      '\n\n';

    let contentBuffer = Buffer.concat([
      Buffer.from(tree),
      Buffer.from(parent),
      Buffer.from(author),
      Buffer.from(committer),
      Buffer.from(message),
    ]);

    const header = `commit ${contentBuffer.length}\0`;

    contentBuffer = Buffer.concat([Buffer.from(header), contentBuffer]);

    const hash = crypto
      .createHash('sha1')
      .update(contentBuffer)
      .digest('hex')
      .toString();
    fs.mkdirSync(
      path.join(process.cwd(), '.git', 'objects', hash.slice(0, 2)),
      { recursive: true }
    );
    fs.writeFileSync(
      path.join(
        process.cwd(),
        '.git',
        'objects',
        hash.slice(0, 2),
        hash.slice(2)
      ),
      zlib.deflateSync(contentBuffer)
    );
    return hash;
    // return writeBufferToObject(contentBuffer);
  } catch (e: any) {
    console.log(e);
    return e.message;
  }
}

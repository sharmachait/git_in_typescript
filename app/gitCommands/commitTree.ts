import { writeBufferToObject } from '../utils/helperFunctions';

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

    const tree = 'tree ' + treeSha;
    const parent = 'parent ' + parentSha;
    const authorName = process.env.GIT_AUTHOR_NAME || 'Chaitanya Sharma';
    const authorEmail = process.env.GIT_AUTHOR_EMAIL || 'Chai8126@gmail.com';
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const author = 'author ' + authorName + ' ' + authorEmail + ' ' + timeStamp;
    const committer =
      'committer ' + authorName + ' ' + authorEmail + ' ' + timeStamp;

    const nullBuffer = Buffer.from([0]);
    const newLineBuffer = Buffer.from('\n');
    const treeBuffer = Buffer.from(tree);
    const parentBuffer = Buffer.from(parent);
    const authorBuffer = Buffer.from(author);
    const committerBuffer = Buffer.from(committer);
    const messageBuffer = Buffer.from(message);
    let contentBuffer = Buffer.alloc(0);
    contentBuffer = Buffer.concat([
      contentBuffer,
      treeBuffer,
      newLineBuffer,
      parentBuffer,
      newLineBuffer,
      authorBuffer,
      newLineBuffer,
      committerBuffer,
      newLineBuffer,
      messageBuffer,
      newLineBuffer,
    ]);
    const size = contentBuffer.length;
    const header = `commit ${size}`;
    const headerBuffer = Buffer.from(header);
    contentBuffer = Buffer.concat([headerBuffer, nullBuffer, contentBuffer]);

    return writeBufferToObject(contentBuffer);
  } catch (e: any) {
    console.log(e);
    return e.message;
  }
}

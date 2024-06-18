import init from './init';
const fs = require('fs');
const path = require('path');
import * as zlib from 'zlib';
import { Transform, TransformCallback, TransformOptions } from 'stream';
class CaptureUnusedData extends Transform {
  unusedData: Buffer;

  constructor(options?: TransformOptions) {
    super(options);
    this.unusedData = Buffer.alloc(0);
  }

  _transform(
    chunk: Buffer,
    encoding: string,
    callback: TransformCallback
  ): void {
    this.unusedData = Buffer.concat([this.unusedData, chunk]);
    callback();
  }
}
import {
  getRemoteMasterHash,
  getRemoteRefs,
  parsePkt,
  Ref,
  write_object,
} from '../utils/helperFunctions';
import axios from 'axios';

export async function clone(args: string[]) {
  let baseUrl = args[1];
  let target = args[2];
  init(target);

  let receivePackUri = baseUrl + '/info/refs?service=git-receive-pack'; //to upload
  let masterRef: Ref = await getRemoteMasterHash(baseUrl);
  let refs = await getRemoteRefs(baseUrl);
  for (let ref of refs) {
    const filePath = path.join(target, '.git', ref.branch_name);
    const folderPath = path.dirname(filePath);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    fs.writeFileSync(filePath, Buffer.from(ref.hash + '\n'));
  }

  let uploadPackUri = baseUrl + '/git-upload-pack';

  const body =
    '0011command=fetch0001000fno-progress' +
    Object.values(refs)
      .map((ref) => `0032want ${ref.hash}\n`)
      .join('') +
    '0009done\n0000';

  let packResponse = await fetch(uploadPackUri, {
    method: 'POST',
    headers: { 'Git-Protocol': 'version=2' },
    body: body,
  });

  let x = await packResponse.arrayBuffer();
  let packBytes = Buffer.from(x);
  const packLines: Buffer[] = [];

  while (packBytes.length > 0) {
    const lineLen = parseInt(packBytes.subarray(0, 4).toString(), 16);
    if (lineLen === 0 || Number.isNaN(lineLen)) {
      break;
    }
    packLines.push(packBytes.subarray(4, lineLen));
    packBytes = packBytes.subarray(lineLen);
  }

  for (let i = 1; i < packLines.length; i++) {
    let line = packLines[i];
    packLines[i] = line.subarray(1);
  }
  let packFile: Buffer = Buffer.concat(packLines.slice(1));

  packFile = packFile.subarray(8);
  const nObjs = packFile.readUInt32BE(0);
  packFile = packFile.subarray(4);

  for (let o = 0; o < nObjs; o++) {
    let arr = nextSizeType(packFile);
    let ty = arr[0];
    let size = arr[1];
    packFile = arr[2];
    if (o === 1 || o === 0) {
      console.log(ty);
      console.log(size);
      console.log(packFile.length);
    }

    switch (ty) {
      case 'commit':
      case 'tree':
      case 'blob':
      case 'tag':
        const decompressStream = zlib.createUnzip();
        const captureStream = new CaptureUnusedData();
        decompressStream.on('data', (chunk: Buffer) => {
          const content = chunk;
          write_object(target, ty, content);
        });
        decompressStream.on('end', () => {
          packFile = captureStream.unusedData;
          console.log(packFile.subarray(0, 100));
        });
        decompressStream.pipe(captureStream);
        decompressStream.write(packFile);
        decompressStream.end();

        //fix unused data
        break;
      case 'ref_delta':
        break;
      default:
        // console.log(ty);
        break;
      //throw new Error('not implemented');
    }
  }
}

function nextSizeType(bs: Buffer): [string, number, Buffer] {
  let ty: number | string = (bs[0] & 0b01110000) >> 4;

  switch (ty) {
    case 1:
      ty = 'commit';
      break;
    case 2:
      ty = 'tree';
      break;
    case 3:
      ty = 'blob';
      break;
    case 4:
      ty = 'tag';
      break;
    case 6:
      ty = 'ofs_delta';
      break;
    case 7:
      ty = 'ref_delta';
      break;
    default:
      ty = 'unknown';
      break;
  }
  let size = bs[0] & 0b00001111;
  let i = 1;
  let off = 4;

  while (bs[i - 1] & 0b10000000) {
    size += (bs[i] & 0b01111111) << off;
    off += 7;
    i++;
  }
  return [ty, size, bs.subarray(i)];
}

function nextSize(bs: Buffer): [number, Buffer] {
  let size = bs[0] & 0b01111111;
  let i = 1;
  let off = 7;
  while (bs[i - 1] & 0b10000000) {
    size += (bs[i] & 0b01111111) << off;
    off += 7;
    i++;
  }
  return [size, bs.subarray(i)];
}
// bun run app/main.ts clone https://github.com/sharmachait/mern-chat-app "C:\Users\chait\OneDrive\Desktop\cohort code alongs\clone"

// bun run app/main.ts clone https://github.com/codecrafters-io/git-sample-3 "C:\Users\chait\OneDrive\Desktop\cohort code alongs\clone"

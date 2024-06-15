import init from './init';
const fs = require('fs');
const path = require('path');
import {
  getRemoteMasterHash,
  getRemoteRefs,
  parsePkt,
  Ref,
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
  const packLines = [];

  while (packBytes.length > 0) {
    const lineLen = parseInt(packBytes.subarray(0, 4).toString(), 16);
    if (lineLen === 0 || Number.isNaN(lineLen)) {
      break;
    }
    packLines.push(packBytes.subarray(4, lineLen));
    packBytes = packBytes.subarray(lineLen);
  }

  // pack_file = b"".join(l[1:] for l in pack_lines[1:])
  // console.log(packLines);
}

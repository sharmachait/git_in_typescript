import init from './init';
const fs = require('fs');
const path = require('path');
import {
  getCommit,
  getRemoteMasterHash,
  getRemoteRefs,
  Ref,
} from '../utils/helperFunctions';

export async function clone(args: string[]) {
  let baseUrl = args[1];
  let target = args[2];
  init(target);

  let receivePackUri = baseUrl + '/info/refs?service=git-receive-pack'; //to upload
  let masterRef: Ref = await getRemoteMasterHash(baseUrl);
  let refs = await getRemoteRefs(baseUrl);
  for (let ref of refs) {
    writeShaToFile(target, ref.branch_name, ref.hash);
  }
  //await getCommit(masterRef.hash, baseUrl, refs);
}

function writeShaToFile(target: string, name: string, sha: string) {
  const filePath = path.join(target, '.git', name);
  const lastSlashIndex = filePath.lastIndexOf('/');
  const folderPath = filePath.substring(0, lastSlashIndex);
  console.log({ folderPath });
  console.log({ filePath });
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  fs.writeFileSync(filePath, Buffer.from(sha + '\n'));
}

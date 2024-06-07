import init from './init';
import {
  getRemoteMasterHash,
  getRemoteRefs,
  Ref,
} from '../utils/helperFunctions';

export async function clone(args: string[]) {
  let baseUrl = args[1];
  let target = args[2];
  init(target);

  let receivePackUri = baseUrl + '/info/refs?service=git-receive-pack'; //to upload
  let ref: Ref = await getRemoteMasterHash(baseUrl);
  getRemoteRefs(baseUrl);
  console.log(ref);
}

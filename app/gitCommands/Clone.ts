import init from './init';
import { getRemoteMasterHash } from '../utils/helperFunctions';

export async function clone(args: string[]) {
  let baseUrl = args[1];
  let target = args[2];
  // console.log(target);
  init(target);

  let receivePackUri = baseUrl + '/info/refs?service=git-receive-pack'; //to upload
  let [masterRef, masterSha] = await getRemoteMasterHash(baseUrl);
  console.log({ masterSha, masterRef });
}

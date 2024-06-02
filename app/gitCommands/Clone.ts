import init from './init';

export async function clone(args: string[]) {
  let uri = args[1];
  let target = args[2];
  // console.log(target);
  init(target);
  let uploadPackUri = uri + '/info/refs?service=git-upload-pack'; // to receive refs info
  let receivePackUri = uri + '/info/refs?service=git-receive-pack'; //to upload
}

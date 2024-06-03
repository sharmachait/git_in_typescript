import init from './init';
import axios from 'axios';
import { parsePkt } from '../utils/helperFunctions';

export async function clone(args: string[]) {
  let uri = args[1];
  let target = args[2];
  // console.log(target);
  init(target);
  let uploadPackUri = uri + '/info/refs?service=git-upload-pack'; // to receive refs info
  let receivePackUri = uri + '/info/refs?service=git-receive-pack'; //to upload
  let uploadPackResponse = await axios.get(uploadPackUri);
  parsePkt(uploadPackResponse.data);
}

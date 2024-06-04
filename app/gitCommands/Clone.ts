import init from './init';
import axios, { AxiosError } from 'axios';
import { parsePkt } from '../utils/helperFunctions';

export async function clone(args: string[]) {
  let baseUrl = args[1];
  let target = args[2];
  // console.log(target);
  init(target);

  let receivePackUri = baseUrl + '/info/refs?service=git-receive-pack'; //to upload
  const refs = await get_refs(baseUrl);
  console.log({ refs });
}

export async function get_refs(baseUrl: string): Promise<string[]> {
  try {
    let uploadPackUri = baseUrl + '/info/refs?service=git-upload-pack'; // to receive refs info
    let uploadPackResponse = await axios.get(uploadPackUri);
    let status = uploadPackResponse.status;
    if (status !== 200) {
      return [];
    }
    let validHeader = validateHeader(uploadPackResponse.data.substring(0, 5));
    if (!validHeader) {
      return [];
    }
    console.log({ data: uploadPackResponse.data });
    return parsePkt(uploadPackResponse.data);
  } catch (e: any) {
    console.log(e.message);
    return [];
  }
}

function validateHeader(data: string): boolean {
  const regex = new RegExp('^[0-9a-f]{4}#');
  const match = regex.test(data);
  return match;
}

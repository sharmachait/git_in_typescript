import fs from 'fs';
import { createDirectory } from '../utils/helperFunctions';

export async function clone(args: string[]) {
  let uri = args[1];
  let target = args[2];
  createDirectory(target);
}

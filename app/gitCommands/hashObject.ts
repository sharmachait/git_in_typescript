import { hashFile } from '../utils/helperFunctions';

export default function hashObject(args: string[]) {
  if (args.length < 3) {
    throw new Error('Options and parameters (file path) expected');
  }
  const option = args[1];
  if (option !== '-w') {
    throw new Error('Invalid Options');
  }
  const filePath: string = args[2];
  const sha = hashFile(filePath);
  process.stdout.write(sha);
}

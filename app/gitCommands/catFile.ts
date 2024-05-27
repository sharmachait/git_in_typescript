import { getContentFromHash } from '../utils/helperFunctions';

export default function catFile(args: string[]) {
  if (args.length < 3) {
    throw new Error('Options and parameters(hash) expected');
  }

  const option = args[1];
  const hash: string = args[2];

  if (option !== '-p') {
    throw new Error('Invalid Options');
  } else {
    const content = getContentFromHash(hash);
    const nullByteIndex = content.indexOf('\0');

    if (nullByteIndex === -1) {
      throw new Error('Invalid Git object format');
    }
    const output = content
      .subarray(nullByteIndex + 1, content.length)
      .toString();
    process.stdout.write(output);
  }
}

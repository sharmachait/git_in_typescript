import { getContentFromHash, parseTreeContent } from '../utils/helperFunctions';

export default function lsTree(args: string[]) {
  if (args.length < 3) {
    throw new Error('Options and parameters(hash) expected');
  }
  const option = args[1];
  const hash: string = args[2];
  if (option !== '--name-only') {
    throw new Error('Invalid Options');
  } else {
    const content = getContentFromHash(hash);
    const names: string[] = parseTreeContent(content);
    for (let name of names) {
      console.log(name);
    }
  }
}

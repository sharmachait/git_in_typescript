import init from './init';

export async function clone(args: string[]) {
  let uri = args[1];
  let target = args[2];
  console.log(target);
  init(target);
}

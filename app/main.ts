import init from './gitCommands/init';
import catFile from './gitCommands/catFile';
import hashObject from './gitCommands/hashObject';
import lsTree from './gitCommands/lsTree';
const args = process.argv.slice(2);
const command = args[0];

enum Commands {
  Init = 'init',
  CatFile = 'cat-file',
  HashObject = 'hash-object',
  LsTree = 'ls-tree',
}

switch (command) {
  case Commands.Init:
    console.log('Logs from your program will appear here!');
    init();
    break;
  case Commands.CatFile:
    catFile(args);
    break;
  case Commands.HashObject:
    hashObject(args);
    break;
  case Commands.LsTree:
    lsTree(args);
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}

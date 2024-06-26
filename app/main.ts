import init from './gitCommands/init';
import catFile from './gitCommands/catFile';
import hashObject from './gitCommands/hashObject';
import lsTree from './gitCommands/lsTree';
import { writeTree } from './gitCommands/writeTree';
import { commitTree } from './gitCommands/commitTree';
import { clone } from './gitCommands/Clone';

const args = process.argv.slice(2);
const command = args[0];

enum Commands {
  Init = 'init',
  CatFile = 'cat-file',
  HashObject = 'hash-object',
  LsTree = 'ls-tree',
  WriteTree = 'write-tree',
  CommitTree = 'commit-tree',
  Clone = 'clone',
}

switch (command) {
  case Commands.Init:
    console.log('Logs from your program will appear here!');
    init('');
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
  case Commands.WriteTree:
    process.stdout.write(writeTree(process.cwd()));
    break;
  case Commands.CommitTree:
    process.stdout.write(commitTree(args));
    break;
  case Commands.Clone:
    clone(args);
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}

import * as fs from 'fs';
import * as zlib from 'zlib';
const args = process.argv.slice(2);
const command = args[0];

enum Commands {
    Init = "init",
    CatFile="cat-file"
}

switch (command) {
    case Commands.Init:
        console.log("Logs from your program will appear here!");
        init();
        break;
    case Commands.CatFile:
        if(args.length < 3){
            throw new Error(`Invalid Options and parameters`)
        }
        const option = args[1];
        const hash=args[2];
        console.log({option});
        console.log({hash});
        break;
    default:
        throw new Error(`Unknown command ${command}`);
}

function init(){
    fs.mkdirSync(".git", { recursive: true });
    fs.mkdirSync(".git/objects", { recursive: true });
    fs.mkdirSync(".git/refs", { recursive: true });
    fs.writeFileSync(".git/HEAD", "ref: refs/heads/main\n");
    console.log("Initialized git directory!");
}
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
        catFile(args);
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
function catFile(args:string[]){
    if(args.length < 3){
        throw new Error(` Options and parameters(hash) expected`)
    }
    const option = args[1];
    const hash:string=args[2];
    if(option!=="-p"){
        throw new Error("Invalid Options");
    }
    else{
        const folderName=hash.substring(0,2);
        const fileName=hash.substring(2,hash.length)
        const compressedFilePath = '.git/objects/'+folderName+"/"+fileName;

        fs.readFile(compressedFilePath,(err,data)=>{
            if (err) {
                console.error('An error occurred while reading the file:', err);
                return;
            }
            zlib.unzip(data, (err: Error | null, buffer: Buffer) => {
                if (err) {
                    console.error('An error occurred during decompression:', err);
                    return;
                }
                const nullByteIndex = buffer.indexOf(0);
                if (nullByteIndex === -1) {
                    console.error('Invalid Git object format');
                    return;
                }

                const content = buffer.subarray(nullByteIndex + 1,buffer.length).toString();
                process.stdout.write(content);
            });
        });
    }
}
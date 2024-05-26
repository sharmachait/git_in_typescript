import fs from "fs";
import zlib from "zlib";

export default function catFile(args:string[]){
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
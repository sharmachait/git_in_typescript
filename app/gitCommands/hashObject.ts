import path from "path";
import fs from "fs";
import zlib from "zlib";
import {calculateSha1} from "../utils/helperFunctions";

export default function hashObject(args:string[]){
    if(args.length < 3){
        throw new Error(` Options and parameters(hash) expected`)
    }
    const option = args[1];
    if(option!=="-w"){
        throw new Error("Invalid Options");
    }
    const filePath:string = args[2];
    const absolutePath = path.resolve(filePath);
    fs.readFile(absolutePath,(err,data)=>{
        if (err) {
            console.error('An error occurred while reading the file:', err);
            return;
        }
        //calculate sha
        const size = data.length;
        const header = `blob ${size}\0`;
        const headerBuffer = Buffer.from(header);
        const bufferToWrite = Buffer.concat([headerBuffer,data]);
        const sha = calculateSha1(bufferToWrite);
        const folderName = sha.substring(0,2);
        const fileName = sha.substring(2,sha.length);
        const folderPath='.git/objects/'+folderName;
        const compressedFilePath = '.git/objects/'+folderName+"/"+fileName;
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        zlib.deflate(bufferToWrite, (err, compressedBuffer) => {
            if (err) {
                process.stdout.write('Compression error:'+ err);
            } else {
                fs.writeFile(compressedFilePath, compressedBuffer,(err)=>{
                    if(err)
                        console.log('error writing to file ' +err);
                });
                process.stdout.write(sha);
            }
        });
    });
}
import init from './init';
import {
  fetchpack,
  fetchRefs,
  readObject,
  renderRefs,
  writeObject,
} from '../utils/helperFunctions';
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';

export async function clone(args: string[]) {
  const url = args[1];
  const to = args[2];
  init(to);
  const refs: Map<string, string> = await fetchRefs(url);
  renderRefs(refs, to);
  let packFile = await fetchpack(url, refs);
  packFile = packFile.subarray(8);
  const nObjs = packFile.readUInt32BE(0);
  packFile = packFile.subarray(4);

  for (let i = 0; i < nObjs; i++) {
    let [ty, x, remainingPackFile] = nextSizeType(packFile);
    const compressedBuffer = zlib.deflateSync(remainingPackFile);
    switch (ty) {
      case 'commit':
      case 'tree':
      case 'blob':
      case 'tag':
        writeObject(to, ty, compressedBuffer);
        break;
      case 'ref_delta':
        const obj = remainingPackFile.subarray(0, 20).toString('hex');
        remainingPackFile = remainingPackFile.subarray(20);
        const [objectType, buffer] = readObject(to, obj);
        let targetContent = Buffer.from([0]);
        let [_, delta] = nextSize(compressedBuffer);
        [_, delta] = nextSize(compressedBuffer);
        while (delta.length > 0) {
          const isCopy = (delta[0] & 0b10000000) !== 0;
          if (isCopy) {
            let dataPtr = 1;
            let offset = 0;
            let size = 0;
            for (let i = 0; i < 4; i++) {
              if ((delta[0] & (1 << i)) !== 0) {
                offset = offset | (delta[dataPtr] << (i * 8));
                dataPtr++;
              }
            }
            for (let i = 0; i < 3; i++) {
              if ((delta[0] & (1 << (4 + i))) !== 0) {
                size = size | (delta[dataPtr] << (i * 8));
                dataPtr++;
              }
            }
            targetContent = Buffer.concat([
              targetContent,
              buffer.subarray(offset, offset + size),
            ]);
            delta = delta.subarray(dataPtr);
          } else {
            const size = delta[0];
            const append = delta.subarray(1, size + 1);
            delta = delta.subarray(size + 1);
            targetContent = Buffer.concat([targetContent, append]);
          }
        }
        writeObject(to, ty, targetContent);
        break;
      default:
        throw new Error('Not implemented');
    }
  }
  let [objectType, body] = readObject(to, refs.get('HEAD') as string);
  let treeSha = body.subarray(5, 45).toString();
  renderTree(to, to, treeSha);
}

type ObjType =
  | 'commit'
  | 'tree'
  | 'blob'
  | 'tag'
  | 'ofs_delta'
  | 'ref_delta'
  | 'unknown';

function nextSizeType(byteSequence: Buffer): [ObjType, number, Buffer] {
  let objType: ObjType;
  let typeBits = (byteSequence[0] & 0b01110000) >> 4;
  switch (typeBits) {
    case 1:
      objType = 'commit';
      break;
    case 2:
      objType = 'tree';
      break;
    case 3:
      objType = 'blob';
      break;
    case 4:
      objType = 'tag';
      break;
    case 6:
      objType = 'ofs_delta';
      break;
    case 7:
      objType = 'ref_delta';
      break;
    default:
      objType = 'unknown';
  }

  let size = byteSequence[0] & 0b00001111;
  let i = 1;
  let off = 4;
  while (byteSequence[i - 1] & 0b10000000) {
    size += (byteSequence[i] & 0b01111111) << off;
    off += 7;
    i++;
  }

  return [objType, size, byteSequence.subarray(i)];
}

// Type Extraction:
//
//     It extracts the type of the object encoded in the first byte of the byte sequence (bs). The type is determined by the first 4 bits of the byte, which are masked with 0b_0111_0000 and then right-shifted by 4.
// The function then matches the type value to a corresponding string value ("commit", "tree", "blob", "tag", "ofs_delta", "ref_delta", or "unknown") using a match statement.
//     Size Extraction:
//
//     The size of the object is determined by the last 4 bits of the first byte of the byte sequence, which are obtained by masking with 0b_0000_1111.
//     If the size information spans multiple bytes, it iterates over the subsequent bytes, each representing 7 bits of the size, until it finds a byte where the MSB (most significant bit) is not set.

function nextSize(byteSequence: Buffer): [number, Buffer] {
  let size = byteSequence[0] & 0b01111111;
  let i = 1;
  let off = 7;
  while (byteSequence[i - 1] & 0b10000000) {
    size += (byteSequence[i] & 0b01111111) << off;
    off += 7;
    i++;
  }

  return [size, byteSequence.subarray(i)];
}

// Size Extraction:
//
//     It extracts the size of the object encoded in the first byte of the byte sequence (bs). The size is determined by the last 7 bits of the byte, which are masked with 0b_0111_1111.
//     If the size information spans multiple bytes, it iterates over the subsequent bytes, each representing 7 bits of the size, until it finds a byte where the MSB (most significant bit) is not set.
function renderTree(to: string, dir: string, sha: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const [objectType, data] = readObject(to, sha);
  let tree = data;
  while (tree.length > 0) {
    let i = tree.indexOf(Buffer.from(' '));
    let mode = tree.subarray(0, i).toString();
    tree = tree.subarray(i + 1);
    i = tree.indexOf(Buffer.from([0]));
    let name = tree.subarray(0, i).toString();
    tree = tree.subarray(i + 1);
    let sha = tree.subarray(0, 40).toString();
    let content = tree.subarray(40);
    switch (mode) {
      case '40000':
        renderTree(to, path.join(dir, name), sha);
        break;
      case '100644':
        const fileContent = readObject(to, sha)[1];
        fs.writeFileSync(path.join(dir, name), fileContent);
        break;
      default:
        throw new Error('Not implemented');
    }

    tree = content;
  }
}

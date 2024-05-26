import crypto from "crypto";

export function calculateSha1(buffer: Buffer): string {
    const hash = crypto.createHash('sha1');
    hash.update(buffer);
    return hash.digest('hex');
}
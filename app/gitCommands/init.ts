import fs from 'fs';

export default function init(path: string) {
  if (path === '') {
    fs.mkdirSync('.git', { recursive: true });
    fs.mkdirSync('.git/objects', { recursive: true });
    fs.mkdirSync('.git/refs', { recursive: true });
    fs.writeFileSync('.git/HEAD', 'ref: refs/heads/main\n');
  } else {
    // console.log({ path });
    fs.mkdirSync(path + '/.git', { recursive: true });
    fs.mkdirSync(path + '/.git/objects', { recursive: true });
    fs.mkdirSync('/.git/refs', { recursive: true });
    fs.writeFileSync(path + '/.git/HEAD', 'ref: refs/heads/main\n');
  }
  // console.log('Initialized git directory!');
}

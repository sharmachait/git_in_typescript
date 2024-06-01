[![progress-banner](https://backend.codecrafters.io/progress/git/6a4315fe-ef0c-4893-bfb0-a6d1f4de3902)](https://app.codecrafters.io/users/codecrafters-bot?r=2qF)

This is my hand at the
["Build Your Own Git" Challenge](https://codecrafters.io/challenges/git).

In this challenge, I build a small Git implementation that's capable of
initializing a repository, creating commits and cloning a public repository.
Along the way we'll learn about the `.git` directory, Git objects (blobs,
commits, trees etc.), Git's transfer protocols and more.

**Note**: If you're viewing this repo on GitHub, head over to
[codecrafters.io](https://codecrafters.io) to try the challenge.

# Features
1. reading git objects
2. creating git blob objects
3. writing git tree objects
4. reading git tree objects
5. committing git tree objects
6. cloning a repo

# Testing locally

The `your_git.sh` script is expected to operate on the `.git` folder inside the
current working directory. If you're running this inside the root of this
repository, you might end up accidentally damaging your repository's `.git`
folder.

We suggest executing `your_git.sh` in a different folder when testing locally.
For example:

```sh
mkdir -p /tmp/testing && cd /tmp/testing
/path/to/your/repo/your_git.sh init
```

To make this easier to type out, you could add a
[shell alias](https://shapeshed.com/unix-alias/):

```sh
alias mygit=/path/to/your/repo/your_git.sh

mkdir -p /tmp/testing && cd /tmp/testing
mygit init
```

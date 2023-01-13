# crafting-interpreters-ts
Follow-up of [Robert Nystrom, "Crafting Interpreters"](https://craftinginterpreters.com/), using typescript (and yarn berry for package manager)

## How did I set up the environment

```
yarn init

# somehow yarn set version berry didn't work
yarn set version canary

yarn add typescript @types/node
yarn add -D ts-node

# to use vscode 
yarn dlx @yarnpkg/sdks vscode

# initialize tsconfig.json
yarn tsc --init
```

I don't feel it necessary, but I added below line into `.yarnrc.yml` manually:
```
nodeLinker: pnp
```

in `tsconfig.json`:
```
"lib": ["es6", "dom"]
"rootDir": "src"
"outDir": "dst"
(...)
```

## How to use

After installing dependencies(via `yarn`), run

```
yarn direct <filename(optional)>
```

The Lox interpreter will read the file and execute the code within it.
If no filename is provided, the interpreter will enter into prompt mode and execute your input line by line. Ctrl+D to exit.

**IMPORTANT**: on current stage, the interpreter will only scan(lex) the code and print the result instead of interpreting and executing it.
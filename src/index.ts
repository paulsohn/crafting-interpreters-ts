import fs from 'fs';
import readline from 'readline';

import { Lox } from './Lox'

function main(){
    // https://ourcodeworld.com/articles/read/393/how-to-create-a-global-module-for-node-js-properly
    // delete the 0 and 1 argument ( node and script.js )
    var args = process.argv.splice( process.execArgv.length + 1 );

    // console.log(process.argv);
    // console.log(process.execArgv);
    // console.log(args);

    if( args.length > 1 ){
        console.log("Usage: <this file> [script]");
        process.exit(64); //EX_USAGE
    } else if( args.length == 1 ){
        runFile(args[0]);
    } else{
        runPrompt();
    }
}

function runFile(path: string){
    var data = fs.readFileSync(path, { encoding: 'utf8' });
    Lox.runLox(data);

    if(Lox.hadError) process.exit(65); // EX_DATAERR
    if(Lox.hadRuntimeError) process.exit(70); // EX_SOFTWARE

    process.exit(0);
}

function runPrompt(){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.setPrompt('> ');
    rl.prompt();

    rl.on('line', line => {
        Lox.runLox(line);
        Lox.hadError = false;
        rl.prompt();
    });
    rl.on('close', ()=>{ // This also handles EOF (i.e. Ctrl+D)
        process.exit(0);
    });

    // https://stackoverflow.com/questions/3430939/node-js-readsync-from-stdin
    // const BUFSIZE = 256;
    // var buf = Buffer.alloc(BUFSIZE);
    // while(true){
    //     var bytesRead = 0;
    //     var line = '';
    //     while(true){
    //         bytesRead = 0;
    //         try{
    //             bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
    //             console.log('read ' + bytesRead + ' bytes');
    //         } catch(e){
    //             // if(e.code === 'EAGAIN'){
    //             //     throw 'ERROR: interactive stdin not supported.';
    //             // } else if(e.code === 'EOF'){
    //             //     break;
    //             // }
    //             throw e;
    //         }
    //         if(bytesRead === 0) break;
    //         line += buf.toString(undefined, 0, bytesRead);
    //     }

    //     if(line === 'exit') return;
    //     runLox(line);
    // }
}

main();
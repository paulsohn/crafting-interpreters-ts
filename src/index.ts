import fs from 'fs';
import readline from 'readline';

import { Token } from './Token';
import { Scanner } from './Scanner';

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
    runLox(data);

    if(hadError){
        process.exit(65); // EX_DATAERR
    } else{
        process.exit(0);
    }
}

function runPrompt(){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.setPrompt('> ');
    rl.prompt();

    rl.on('line', line => {
        runLox(line);
        hadError = false;
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

/**
 * the core function.
 * 
 * @param data source data.
 */
function runLox(data: string){
    var scanner = new Scanner(data);
    var tokens = scanner.scanTokens();

    // For now, just print the tokens.
    for (var token of tokens) {
        console.log(token);
    }
}

export var hadError = false;

/**
 * a function to raise error.
 * @param lineno the line number.
 * @param message error message.
 */
export function error(lineno: number, message: string){
    report(lineno, "", message);
    hadError = true;
}

function report(lineno: number, where: string, message: string){
    console.error(`[line ${lineno}] Error ${where}: ${message}`);
}

main();
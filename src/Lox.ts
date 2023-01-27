import { Token, TokenType } from './Token';
import { Scanner } from './Scanner';
import { Parser } from './Parser';
import { Interpreter } from './Interpreter';

// import { AstPrinter } from './AstPrinter';
import { RuntimeError } from './Error';


// static class to implement interpreter and save its state.

export class Lox{
    private static interpreter: Interpreter = new Interpreter();
    static hadError: boolean = false;
    static hadRuntimeError: boolean = false;
    /**
     * the core function.
     * 
     * @param data source data.
     */
    static runLox(data: string){
        var scanner = new Scanner(data);
        var tokens = scanner.scanTokens();

        // console.log('Scanning result:');
        // for(var token of tokens){
        //     console.log(token);
        // }

        var parser = new Parser(tokens);
        var stmts = parser.parse();

        if(Lox.hadError) return;
        this.interpreter.interpret(stmts);
    }

    static error(lineno: number, message: string): void;
    static error(token: Token, message: string): void;
    /**
     * a function to raise error.
     * @param from the line number (number) or the token (Token) which issued the error.
     * @param message error message.
     */
    static error(from: number | Token, message: string){
        var lineno: number;
        var where: string;
        if(from instanceof Token){
            lineno = from.line;
            where = from.type === TokenType.EOF ? `at end` : `at '${from.lexeme}'`;
        } else{
            lineno = from;
            where = '';
        }
        this.report(lineno, where, message);
        this.hadError = true;
    }

    static report(lineno: number, where: string, message: string){
        console.error(`[line ${lineno}] Error ${where}: ${message}`);
    }

    static runtimeError(err: RuntimeError){
        console.error(`[line ${ err.token.line }] RuntimeError: ${ err.message }`);

        this.hadRuntimeError = true;
    }
    
}
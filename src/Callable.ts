import { Environment } from "./Environment";
import { Interpreter } from "./Interpreter";

import { Control } from "./Control";
import { TokenType } from "./Token";

import * as Stmt from "./Stmt";

// while not idiomatic in JS/TS,
// we can't use trivial `instanceof` feature for instances
// so I stepped back into abstract class.

export abstract class Callable {
    arity: number = 0;
    abstract call(interpreter: Interpreter, args: any[]): any;
}

export class Function extends Callable {
    private declaration: Stmt.Function;

    constructor(declaration: Stmt.Function){
        super();
        this.arity = declaration.params.length;
        this.declaration = declaration;
    }

    call(interpreter: Interpreter, args: any[]) {
        var environment = new Environment(interpreter.globals);
        // the environment must be created dynamically.
        // 'top-level' functions only for now.

        // assume that the arity check was performed BEFORE this function call
        for(var i = 0; i < this.arity; ++i){
            environment.define(
                this.declaration.params[i], args[i]
            );
        }

        try{
            interpreter.executeBlock(this.declaration.body, environment);
        } catch(ctrl){
            if(ctrl instanceof Control && ctrl.keyword === TokenType.RETURN){
                return ctrl.value;
            } else throw ctrl;
        }

        return null;
    }

    toString(): string{
        return `<fn '${this.declaration.name.lexeme}'>`
    }
}
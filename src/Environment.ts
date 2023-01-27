import { RuntimeError } from "./Error";
import { Token } from "./Token";

export class Environment {
    private values: Map<string, any> = new Map();

    // the environment shoud be chained to implement scoping. This is a simple 'linked list' environment.
    enclosing: Environment | undefined;

    constructor(enclosing?: Environment){
        this.enclosing = enclosing;
    }

    get(name: Token): any{ // why Token, not string??
        if(this.values.has(name.lexeme)){
            return this.values.get(name.lexeme);
        }

        // recursive calls into enclosing environment
        if(this.enclosing !== undefined){
            return this.enclosing.get(name);
        }

        return null;
        // throw new RuntimeError(name, `Undeclared variable '${ name.lexeme }'`);

        // Lox evaluates undeclared variables into nil.
        // alternatively, we could throw runtime error.
    }

    define(name: Token, value: any){
        this.values.set(name.lexeme, value);

        // We won't prevent redefining. It just silently shadows the variable.
    }

    assign(name: Token, value: any){ // why Token, not string??
        if(this.values.has(name.lexeme)){
            return this.values.get(name.lexeme);
        }

        throw new RuntimeError(name, `Undeclared variable '${ name.lexeme }'`);

        // Lox doesn't do implicit variable declaration. that's why var statement exists.
    }
}
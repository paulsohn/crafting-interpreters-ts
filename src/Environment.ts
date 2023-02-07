import { RuntimeError } from "./Error";
import { Token } from "./Token";

export class Environment {
    private values: Map<string, any> = new Map();

    // the environment shoud be chained to implement scoping. This is a simple 'linked list' environment.
    enclosing: Environment | undefined;

    constructor(enclosing?: Environment){
        this.enclosing = enclosing;
    }

    ancestor(distance: number): Environment{
        var env : Environment = this;
        for(var i = 0; i < distance; i++){
            env = env.enclosing!;
        }
        return env;
    }

    get(name: Token | string): any{
        if(name instanceof Token){
            name = name.lexeme;
        }
        if(this.values.has(name)){
            return this.values.get(name);
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

    // get at fixed depth of environment
    getAt(distance: number, name: Token | string): any{
        if(name instanceof Token){
            name = name.lexeme;
        }

        return this.ancestor(distance).values.get(name) ?? null;
    }

    define(name: Token | string, value: any){
        if(name instanceof Token){
            name = name.lexeme;
        }
        this.values.set(name, value);

        // We won't prevent redefining. It just silently shadows the variable.
    }

    assign(name: Token | string, value: any){
        if(name instanceof Token){
            name = name.lexeme;
        }
        if(this.values.has(name)){
            this.values.set(name, value);
            return;
        }

        if(this.enclosing !== undefined){
            this.enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(null, `Undeclared variable '${ name }'`);

        // Lox doesn't do implicit variable declaration. that's why var statement exists.
    }

    // assign at fixed depth of environment
    assignAt(distance: number, name: Token | string, value: any){
        if(name instanceof Token){
            name = name.lexeme;
        }
        return this.ancestor(distance).values.set(name, value) ?? null;
    }
}
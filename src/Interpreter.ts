import { Lox } from './Lox';
import * as Expr from './Expr';
import * as Stmt from './Stmt';
import { Token, TokenType, Primitive } from './Token';

import { RuntimeError } from './Error';
import { Environment } from './Environment';

import { Callable, Function } from './Callable';

import { Control } from './Control';

export class Interpreter implements Expr.Visitor<any>, Stmt.Visitor<void>{
    globals: Environment = new Environment();
    private environment: Environment = this.globals; // current environment
    private locals: Map<Expr.Expr, number> = new Map<Expr.Expr, number>();

    constructor(){
        this.globals.define('clock', new (class ClockFn extends Callable {
            arity = 0;
            call(interpreter: Interpreter, args: any[]) {
                return Date.now() / 1000.0;
            }
            toString(){ return '<native fn \'clock\'>'; }
        })());
        this.globals.define('string', new (class StringFn extends Callable {
            arity = 1;
            call(interpreter: Interpreter, args: any[]) {
                return String(args[0]);
            }
            toString(){ return '<native fn \'string\'>'; }
        })());
    }

    interpret(stmts: Stmt.Stmt[]){
        try {
            for (var stmt of stmts){
                this.execute(stmt);
            }
        } catch (err){
            Lox.runtimeError(err as RuntimeError);
        }
    }

    execute(stmt: Stmt.Stmt){
        //we might want second param for env here also...?
        stmt.accept(this);
    }

    executeBlock(stmts: Stmt.Stmt[], env: Environment){
        // unlike single execute, we need an environment for this.
        // env is the new environment generated outside the function.

        var enclosing: Environment = this.environment;
        // env.enclosing = enclosing;

        try {
            this.environment = env;

            for(var stmt of stmts){
                this.execute(stmt);
            }

        } finally {
            this.environment = enclosing; // rip off the local env
        }
    }

    evaluate(expr: Expr.Expr): any{
        return expr.accept(this);
    }

    resolve(expr: Expr.Expr, depth: number){
        // locals have local uses of a variable.
        this.locals.set(expr, depth);
    }

    /* Stmt visitors */

    visitBlockStmt(stmt: Stmt.Block){
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    visitVarStmt(stmt: Stmt.Var){
        var value = null;
        if(stmt.initializer !== null){
            value = this.evaluate(stmt.initializer);
        }

        this.environment.define(stmt.name, value);
    }

    visitIfStmt(stmt: Stmt.If){
        if(isTruthy(this.evaluate(stmt.condition))){
            this.execute(stmt.thenBranch);
        } else if(stmt.elseBranch !== null){
            this.execute(stmt.elseBranch);
        }
    }

    visitWhileStmt(stmt: Stmt.While){
        while(isTruthy(this.evaluate(stmt.condition))){
            var ct = false;
            // var brk = false;
            try{
                this.execute(stmt.body);
            } catch(ctrl){
                if(ctrl instanceof Control){
                    if(ctrl.keyword === TokenType.CONTINUE){
                        ct = true;
                        // continue -- do nothing.
                    }
                    else if(ctrl.keyword === TokenType.BREAK){
                        // brk = true;
                        break;
                    } else throw ctrl;
                }
                else throw ctrl;
            }
            // if(ct) continue;
            // if(brk) break;

            if(stmt.increment !== null){
                this.evaluate(stmt.increment);
            }
        }
        return null;
    }

    visitExpressionStmt(stmt: Stmt.Expression){
        this.evaluate(stmt.expression);
    }

    visitFunctionStmt(stmt: Stmt.Function){
        var func: Function = new Function(stmt, this.environment);
        this.environment.define(stmt.name.lexeme, func);
    }

    visitPrintStmt(stmt: Stmt.Expression){
        var value = this.evaluate(stmt.expression);
        console.log(stringify(value));
    }

    visitControlStmt(stmt: Stmt.Control): void {
        var value = stmt.value;
        if( stmt.keyword.type === TokenType.RETURN && value !== null ){
            value = this.evaluate(value);
        }

        throw new Control(stmt.keyword.type, value);
    }

    /* Expr visitors */

    visitAssignExpr(expr: Expr.Assign) {
        var value = this.evaluate(expr.value);
        // this.environment.assign(expr.name, value);

        var distance = this.locals.get(expr);
        if(distance !== undefined){
            this.environment.assignAt(distance, expr.name, value);
        } else{
            this.globals.assign(expr.name, value);
        }
        
        return value;
    }

    visitBinaryExpr(expr: Expr.Binary){
        // short-circuit evaluation comes first.
        var left = this.evaluate(expr.left);
        if(expr.operator.type === TokenType.AND && !isTruthy(left)) return left; // return false;
        else if(expr.operator.type === TokenType.OR && isTruthy(left)) return left; // return true;

        var right = this.evaluate(expr.right);

        switch(expr.operator.type){
        case TokenType.AND:
        case TokenType.OR:
            // return isTruthy(right);
            return right;
        case TokenType.GREATER:
            checkNumberOperand(expr.operator, left);
            checkNumberOperand(expr.operator, right);
            return left > right;
        case TokenType.GREATER_EQUAL:
            checkNumberOperand(expr.operator, left);
            checkNumberOperand(expr.operator, right);
            return Number(left) >= Number(right);
        case TokenType.LESS:
            checkNumberOperand(expr.operator, left);
            checkNumberOperand(expr.operator, right);
            return Number(left) < Number(right);
        case TokenType.LESS_EQUAL:
            checkNumberOperand(expr.operator, left);
            checkNumberOperand(expr.operator, right);
            return Number(left) <= Number(right);

        case TokenType.BANG_EQUAL : return !isEqual(left, right);
        case TokenType.EQUAL_EQUAL : return isEqual(left, right);

        case TokenType.MINUS:
            checkNumberOperand(expr.operator, left);
            checkNumberOperand(expr.operator, right);
            return left - right;
        case TokenType.SLASH:
            checkNumberOperand(expr.operator, left);
            checkNumberOperand(expr.operator, right); // may want to examine nonzero
            return left / right;
        case TokenType.STAR:
            checkNumberOperand(expr.operator, left);
            checkNumberOperand(expr.operator, right);
            return left * right;
        case TokenType.PLUS: // overloaded
            // console.log(left, right);
            if(typeof left  === 'number' && typeof right === 'number'){
                return left + right; // addition
            }
            if(typeof left === 'string' && typeof right === 'string'){
                return left + right; // string concatenation
            }
            throw new RuntimeError(expr.operator, 'Operands must be both numbers or both strings.');
        }

        // unreachable
        return null;
    };

    visitCallExpr(expr: Expr.Call) {
        var callee = this.evaluate(expr.callee);
        if(!(callee instanceof Callable)){
            throw new RuntimeError(expr.paren, "Can only call functions and classes.");
        }
        if(expr.args.length !== callee.arity /* arity comparison */ ){
            throw new RuntimeError(expr.paren, `Expected ${ callee.arity } arguments but got ${ expr.args.length }.`);
        }

        var args : any[] = [];
        for(var argexp of expr.args){
            args.push(this.evaluate(argexp));
        }

        return callee.call(this, args);

        // inside call function,
        // * lox function will internally throw error and catch it, and return it as a value
        // * native function will directly return result.
    }

    visitGroupingExpr(expr: Expr.Grouping){
        return this.evaluate(expr.expression);
    }

    visitLiteralExpr(expr: Expr.Literal){
        return expr.value;
    }

    visitUnaryExpr(expr: Expr.Unary){
        var right = this.evaluate(expr.right);

        switch(expr.operator.type){
        case TokenType.MINUS: return -Number(right);
        case TokenType.BANG: return !isTruthy(right); // the ! operator behaves as same as ruby (not javascript)
        }

        // unreachable
        return null;
    }

    visitVariableExpr(expr: Expr.Variable) {
        // return this.environment.get(expr.name);
        return this.lookUpVariable(expr.name, expr);
    }

    lookUpVariable(name: Token, expr: Expr.Expr){
        var distance = this.locals.get(expr);
        if(distance === undefined){
            return this.globals.get(name);
        } else{
            return this.environment.getAt(distance, name);
        }
    }

};

function isTruthy(obj: any): boolean{ // ruby-like behavior of truth
    if(obj === null) return false;
    if(typeof obj === 'boolean') return obj;
    return true;
}

function isEqual(a: any, b: any) : boolean{
    return a === b; // use javascript's ===
}

function checkNumberOperand(operator: Token, operand: any){
    if(typeof operand === 'number') return;
    throw new RuntimeError(operator, 'Operand must be a number.');
}

function stringify(obj: any) : string {
    if(obj === null) return 'nil';
    return String(obj);
}
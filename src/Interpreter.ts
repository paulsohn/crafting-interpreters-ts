import { Lox } from './Lox';
import * as Expr from './Expr';
import * as Stmt from './Stmt';
import { Token, TokenType, Primitive } from './Token';

import { RuntimeError } from './Error';
import { Environment } from './Environment';

export class Interpreter implements Expr.Visitor<any>, Stmt.Visitor<void>{
    private environment: Environment = new Environment(); // current environment

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

    /* Stmt visitors */

    visitBlockStmt(stmt: Stmt.Block){
        return this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    visitExpressionStmt(stmt: Stmt.Expression){
        this.evaluate(stmt.expression);
    }

    visitPrintStmt(stmt: Stmt.Expression){
        var value = this.evaluate(stmt.expression);
        console.log(stringify(value));
    }

    visitVarStmt(stmt: Stmt.Var){
        var value = null;
        if(stmt.initializer !== null){
            value = this.evaluate(stmt.initializer);
        }

        this.environment.define(stmt.name, value);
    }

    /* Expr visitors */

    visitAssignExpr(expr: Expr.Assign) {
        var value = this.evaluate(expr.value);
        this.environment.define(expr.name, value);
        return value;
    }

    visitBinaryExpr(expr: Expr.Binary){
        // no short-circuit evaluation here.
        var left = this.evaluate(expr.left);
        var right = this.evaluate(expr.right);

        switch(expr.operator.type){
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
        return this.environment.get(expr.name);
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
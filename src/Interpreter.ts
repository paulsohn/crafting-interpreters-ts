import { Lox } from './Lox';
import * as Expr from './Expr';
import { Token, TokenType } from './Token';

import { RuntimeError } from './Error';

export class Interpreter implements Expr.Visitor<any>{
    interpret(expr: Expr.Expr){
        try {
            var value = this.evaluate(expr);
            console.log();
            console.log('Interpreted result:')
            console.log( stringify(value) );
        } catch (err){
            Lox.runtimeError(err as RuntimeError);
        }
    }

    evaluate(expr: Expr.Expr): any{
        return expr.accept(this);
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
import * as Expr from './Expr';
import { Token, TokenType } from './Token';

export class AstPrinter implements Expr.Visitor<string>{
    print(expr: Expr.Expr){
        return expr.accept(this);
    }

    parenthesize(name: string, ...exprs: Expr.Expr[]): string{
        var result = `(${name}`;
        for(var expr of exprs){
            result += ` ${ this.print(expr) }`;
        }
        result += `)`;
        return result;
    }

    visitBinaryExpr(expr: Expr.Binary): string {
        return this.parenthesize(
            expr.operator.lexeme,
            expr.left, expr.right
        );
    };

    visitGroupingExpr(expr: Expr.Grouping): string {
        return this.parenthesize(
            'group',
            expr.expression
        );
    }

    visitLiteralExpr(expr: Expr.Literal): string {
        if(expr.value === null) return 'nil';
        return String(expr.value);
    }

    visitUnaryExpr(expr: Expr.Unary): string {
        return this.parenthesize(
            expr.operator.lexeme,
            expr.right
        );
    }
};

export class AstPrinterToRPN implements Expr.Visitor<string>{
    print(expr: Expr.Expr){
        return expr.accept(this);
    }

    asRPN(name: string, ...exprs: Expr.Expr[]): string{
        var result = ``;
        for(var expr of exprs){
            result += `${ expr.accept(this) } `;
        }
        result += `${name}`;
        return result;
    }

    visitBinaryExpr(expr: Expr.Binary): string {
        return this.asRPN(
            expr.operator.lexeme,
            expr.left, expr.right
        );
    };

    visitGroupingExpr(expr: Expr.Grouping): string {
        return this.asRPN(
            'group',
            expr.expression
        );
    }

    visitLiteralExpr(expr: Expr.Literal): string {
        if(expr.value === null) return 'nil';
        return expr.value.toString();
    }

    visitUnaryExpr(expr: Expr.Unary): string {
        return this.asRPN(
            expr.operator.lexeme,
            expr.right
        );
    }
};

function main(){
    var expression = new Expr.Binary(
        new Expr.Unary(
            new Token(TokenType.MINUS, '-', null, 1),
            new Expr.Literal(123)
        ),
        new Token(TokenType.STAR, '*', null, 1),
        new Expr.Grouping(
            new Expr.Literal(45.67)
        )
    );

    var expression2 = new Expr.Binary(
        new Expr.Binary(
            new Expr.Literal(1),
            new Token(TokenType.PLUS, '+', null, 2),
            new Expr.Literal(2)
        ),
        new Token(TokenType.STAR, '*', null, 2),
        new Expr.Binary(
            new Expr.Literal(4),
            new Token(TokenType.MINUS, '-', null, 2),
            new Expr.Literal(3)
        )
    );

    console.log(new AstPrinter().print(expression));
    console.log(new AstPrinterToRPN().print(expression));
    console.log(new AstPrinterToRPN().print(expression2));
}

// main();
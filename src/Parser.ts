import { Token, TokenType } from './Token';
import * as Expr from './Expr';
import { Lox } from './Lox';

class ParseError extends Error{}

export class Parser{
    private tokens: Token[] = [];
    private current: number = 0;

    constructor(tokens: Token[]){
        this.tokens = tokens;
    }

    parse(): Expr.Expr | null{
        try {
            return this.expression();
        } catch(error){
            return null;
        }
    }

    // terminal : code to match and consume a token
    // nonterminal : call to that rule's function

    private expression(): Expr.Expr{
        return this.equality();
    }

    private equality(): Expr.Expr{
        // equality → comparison ( ( "!=" | "==" ) comparison )* ;

        var expr: Expr.Expr = this.comparison();

        while(this.matchType(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)){
            var operator: Token = this.advance(); // matched token -- either BANG_EQUAL or EQUAL_EQUAL.

            var right: Expr.Expr = this.comparison();

            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    private comparison(): Expr.Expr{
        // comparison → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;

        var expr: Expr.Expr = this.term();

        while(this.matchType(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)){
            var operator: Token = this.advance();
            var right: Expr.Expr = this.term();
            
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    private term(): Expr.Expr{
        // term → factor ( ( "-" | "+" ) factor )* ;

        var expr: Expr.Expr = this.factor();

        while(this.matchType(TokenType.PLUS, TokenType.MINUS)){
            var operator: Token = this.advance();
            var right: Expr.Expr = this.factor();
            
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    private factor(): Expr.Expr{
        // factor → unary ( ( "/" | "*" ) unary )* ;

        var expr: Expr.Expr = this.unary();

        while(this.matchType(TokenType.SLASH, TokenType.STAR)){
            var operator: Token = this.advance();
            var right: Expr.Expr = this.unary();
            
            expr = new Expr.Binary(expr, operator, right);
        }

        return expr;
    }

    private unary(): Expr.Expr{
        // unary → "!" unary | "-" primary | primary ;

        if(this.matchType(TokenType.BANG)){
            var operator: Token = this.advance();
            var right: Expr.Expr = this.unary();
            return new Expr.Unary(operator, right);
        }
        if(this.matchType(TokenType.MINUS)){
            var operator: Token = this.advance();
            var right: Expr.Expr = this.primary();
            return new Expr.Unary(operator, right);
        }

        return this.primary();
    }

    private primary(): Expr.Expr{
        // primary → NUMBER | STRING | "true" | "false" | "nil"
        //          | "(" expression ")" ;

        if(this.matchType(TokenType.NUMBER, TokenType.STRING, TokenType.TRUE, TokenType.FALSE, TokenType.NIL)){
            var token: Token = this.advance();
            return new Expr.Literal(token.literal);
        }

        if(this.matchType(TokenType.LEFT_PAREN)){
            this.advance();
            var expr: Expr.Expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, `Expect ')' after expression.`);
            return new Expr.Grouping(expr);
        }

        throw this.error(this.peek(), 'Expect expression.');
    }


    // unlike the original Crafting Interpreters code, this doesn't consume any token.
    private matchType(...types: TokenType[]){
        for(var type of types){
            if(this.isAtEnd()) return false;
            if(this.peek().type == type) return true;
        }
        return false;
    }

    private consume(type: TokenType, errorMessage: string): Token {
        if(this.matchType(type)) return this.advance();

        throw this.error(this.peek(), errorMessage);
    }

    private error(token: Token, message: string): ParseError{
        Lox.error(token, message);
        return new ParseError();
    }

    //synchronization: after an error has been found, we should find the next 'supposed-to-be-sane' start statement
    private sync(){
        this.advance();

        while(!this.isAtEnd()){
            if(this.previous().type === TokenType.SEMICOLON) return;

            var type = this.peek().type;
            if([
                TokenType.CLASS,
                TokenType.FUN,
                TokenType.VAR,
                TokenType.FOR,
                TokenType.IF,
                TokenType.WHILE,
                TokenType.PRINT,
                TokenType.RETURN,
            ].indexOf(type) !== -1) return;

            this.advance();
        }
    }


    private advance(): Token {
        if(!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }
};
import { Token, TokenType } from './Token';
import * as Expr from './Expr';
import * as Stmt from './Stmt';
import { Lox } from './Lox';

class ParseError extends Error{}

export class Parser{
    private tokens: Token[] = [];
    private current: number = 0;

    constructor(tokens: Token[]){
        this.tokens = tokens;
    }

    parse(): Stmt.Stmt[]{ // program();
        var statements: Stmt.Stmt[] = [];
        while(!this.isAtEnd()){
            try{
                statements.push( this.declaration() );
            } catch(err){
                this.sync();
            }
        }

        return statements;
    }

    // terminal : code to match and consume a token
    // nonterminal : call to that rule's function

    private declaration(): Stmt.Stmt {
        if(this.matchType(TokenType.VAR)) return this.varDecl();
        return this.statement();
    }

    private varDecl(): Stmt.Stmt {
        this.advance();

        var name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

        var initializer: Expr.Expr | null = null;
        if(this.matchType(TokenType.EQUAL)){
            this.advance();

            initializer = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return new Stmt.Var(name, initializer);
    }

    private statement(): Stmt.Stmt{
        if(this.matchType(TokenType.PRINT)) return this.printStmt();

        if(this.matchType(TokenType.LEFT_BRACE)) return this.block();

        return this.exprStmt();
    }

    private _bracedScope(): Stmt.Stmt[]{
        var stmts: Stmt.Stmt[] = [];

        this.advance();
        while(!this.matchType(TokenType.RIGHT_BRACE)){
            var stmt = this.declaration();
            stmts.push(stmt);
        }
        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");

        return stmts;
    }

    private block(): Stmt.Stmt{
        var stmts = this._bracedScope();

        return new Stmt.Block(stmts);
    }

    private exprStmt(): Stmt.Expression {
        var expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return new Stmt.Expression(expr);
    }

    private printStmt(): Stmt.Print {
        this.advance();

        var expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after print statement.");
        return new Stmt.Print(expr);
    }

    private expression(): Expr.Expr{
        return this.assignment();
    }

    private assignment(): Expr.Expr{
        var expr: Expr.Expr = this.equality(); // first parse left hand side (currently only IDENTIFIER)

        if(this.matchType(TokenType.EQUAL)){
            var equals = this.advance();
            var value = this.assignment();

            // is L-value??
            if(expr instanceof Expr.Variable){
                var name = expr.name;
                return new Expr.Assign(name, value);
            }

            this.error(equals, 'Invalid assignment target.');
        }

        return expr; // turns out that '=' is missing: possible LHS is 
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

        if(this.matchType(TokenType.IDENTIFIER)){
            var name = this.advance();
            return new Expr.Variable(name);
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

    private consume(type: TokenType, errorMessage: string = "UNREACHABLE"): Token {
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
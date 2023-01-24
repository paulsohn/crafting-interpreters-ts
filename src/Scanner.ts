import { Token, TokenType } from './Token';
import { Lox } from './Lox';

// Scanning (= Lexing) : regular grammar.

export class Scanner{
    private source: string;
    private tokens: Token[] = [];

    private start: number = 0;
    private current: number = 0;
    private line: number = 1;

    private keywords: Record<string, TokenType> = {
        'and': TokenType.AND,
        'class': TokenType.CLASS,
        'else': TokenType.ELSE,
        'false': TokenType.FALSE,
        'for': TokenType.FOR,
        'fun': TokenType.FUN,
        'if': TokenType.IF,
        'nil': TokenType.NIL,
        'or': TokenType.OR,
        'print': TokenType.PRINT,
        'return': TokenType.RETURN,
        'super': TokenType.SUPER,
        'this': TokenType.THIS,
        'true': TokenType.TRUE,
        'var': TokenType.VAR,
        'while': TokenType.WHILE
    };

    constructor(source: string){
        this.source = source;
    }

    scanTokens() : Token[] {
        while(!this.isAtEnd()){
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(TokenType.EOF, '', null, this.line));
        return this.tokens;
    }

    private scanToken(){ // scan character-wise.
        var c = this.advance();
        switch(c){
            // single-char token
            case '(': this.addToken(TokenType.LEFT_PAREN); break;
            case ')': this.addToken(TokenType.RIGHT_PAREN); break;
            case '{': this.addToken(TokenType.LEFT_BRACE); break;
            case '}': this.addToken(TokenType.RIGHT_BRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': this.addToken(TokenType.DOT); break;
            case '-': this.addToken(TokenType.MINUS); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case '*': this.addToken(TokenType.STAR); break;

            // possible double-char token : start with the first char.
            case '!':
                this.addToken( this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG );
                break;
            case '=':
                this.addToken( this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL );
                break;
            case '<':
                this.addToken( this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS );
                break;
            case '>':
                this.addToken( this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER );
                break;
            
            // possible longer token
            case '/':
                if(this.match('/')){
                    // A comment. Goes until the end of the line.
                    while(!this.peekMatch('\n') && !this.isAtEnd()) this.advance();

                    // we used peekMatch() instead of match().
                    // We don't want newline to be consumed so we can update line no.
                } else{
                    this.addToken(TokenType.SLASH);
                }
                break;
            
            // ignorables
            case ' ':
            case '\r':
            case '\t':
                break;
            
            case '\n':
                this.line++;
                break;
            
            case '"':
                this.stringLiteral();
                break;
            
            // TODO : string literals, number literals, ...

            default:
                if(Scanner.isDigit(c)){
                    this.numberLiteral();
                } else if(Scanner.isAlpha(c)){
                    this.identifier();
                } else{
                    Lox.error(this.line, `Unexpected character ${c}.`);
                }
                break;
        }
    }

    private stringLiteral(){
        while( !this.peekMatch('"') ){
            if(this.peek() == '\n') this.line++;
            this.advance();
        }

        if(this.isAtEnd()){
            Lox.error(this.line, "Unterminated string.");
            return;
        }

        // the closing ".
        this.advance();

        // trim the surrounding quotes.
        this.addToken(
            TokenType.STRING,
            this.source.substring(this.start+1, this.current-1)
        );
    }

    private numberLiteral(){
        while( Scanner.isDigit( this.peek() ) ){
            this.advance();
        }

        if( this.peek() == '.' && Scanner.isDigit( this.peekNext() ) ){
            //consume "."
            this.advance();

            while( Scanner.isDigit( this.peek() ) ){
                this.advance();
            }
        }

        this.addToken(
            TokenType.NUMBER,
            Number(this.source.substring(this.start, this.current))
        );
    }

    private identifier(){
        while( Scanner.isAlphaNumeric(this.peek()) ){
            this.advance();
        }

        var text: string = this.source.substring(this.start, this.current)
        var type = this.keywords[text] ?? TokenType.IDENTIFIER

        this.addToken(type);
    }

    private isAtEnd() : boolean {
        return this.current >= this.source.length;
    }

    private advance(): string{
        return this.source.charAt(this.current++);
    }

    private match(expected: string): boolean{ // like a conditional advance()
        if(this.isAtEnd()) return false;
        if(this.source.charAt(this.current) != expected) return false;

        this.current++;
        return true;
    }

    private peek(): string{ //lookahead
        if(this.isAtEnd()) return '\0';
        return this.source.charAt(this.current);
    }

    private peekNext(): string{
        if(this.current + 1 >= this.source.length) return '\0';
        return this.source.charAt(this.current + 1);
    }

    private peekMatch(expected: string): boolean{ // shortcut of peek() != expected && !isAtEnd()
        if(this.isAtEnd()) return false;
        return this.source.charAt(this.current) == expected;
    }

    private addToken(type: TokenType, literal?: any){
        var text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token( type, text, literal, this.line ));
    }

    private static isDigit(c: string): boolean{
        return c >= '0' && c <= '9';
        // return c.length == 1 && c >= '0' && c <= '9';
    }

    private static isAlpha(c: string): boolean{
        return (c >= 'a' && c <= 'z')
            || (c >= 'A' && c <= 'Z')
            || c == '_';
    }

    private static isAlphaNumeric(c: string): boolean{
        return Scanner.isAlpha(c) || Scanner.isDigit(c);
    }
}
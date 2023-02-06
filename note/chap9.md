# Chap 9. Control Flow

## extending the EBNF rule

```
program        → declaration* EOF ; // ensure that a program consume whole statements

program        → declaration* EOF ;

declaration    → varDecl
               | statement ;

varDecl        → "var" IDENTIFIER ( "=" expression )? ";" ;
statement      → exprStmt 
                | printStmt
                | ifStmt
                | whileStmt
                | forStmt // sugar!
                | block;

exprStmt       → expression ";" ;
printStmt      → "print" expression ";" ;

ifStmt         → "if" "(" expression ")" statement ( "else" statement )?;
whileStmt      → "while" "(" expression ")" statement ; // no loop break / continue defined here... @TODO
forStmt        → "for" "(" ( varDecl | exprStmt | ";" ) expression? ";" expression? ")" statement ;

block          → "{" declaration* "}" ;

expression     → assignment ;
assignment     → IDENTIFIER "=" assignment //right recursive here
               | logic_or ;
logic_or       → logic_and ( "or" logic_and )* ;
logic_and      → equality ( "and" equality )* ;
equality       → comparison ( ( "!=" | "==" ) comparison )* ;
comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term           → factor ( ( "-" | "+" ) factor )* ;
factor         → unary ( ( "/" | "*" ) unary )* ;
unary          → ( "!" | "-" ) unary
               | primary ;
primary        → NUMBER | STRING | "true" | "false" | "nil"
               | "(" expression ")"
               | IDENTIFIER ;
```

## AST types

```
defineAst(outputDir, 'Expr', [], {
    'Binary' : [ 'left: Expr', 'operator: Token', 'right: Expr'  ],
    'Grouping': [ 'expression: Expr' ],
    'Literal' : [ 'value: Primitive' ],
    'Unary' : [ 'operator: Token', 'right: Expr' ],
    'Variable': [ 'name: Token' ],
});

defineAst(outputDir, 'Stmt', ['Expr'], {
    'Block': [ 'statements: Stmt[]' ],
    'Expression': [ 'expression: Expr' ],
    'Print': [ 'expression: Expr' ],
    'Var': [ 'name: Token', 'initializer: Expr | null' ],
});
```

## Things we have done so far

* expression evaluation
* statement
* variable and its declaration (via environments)
* variable assignment
* scope block (environment chaining)

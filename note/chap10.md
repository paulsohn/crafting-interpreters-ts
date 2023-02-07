# Chap 9. Control Flow

## EBNF rule

```
program        → declaration* EOF ; // ensure that a program consume whole statements

program        → declaration* EOF ;

declaration    → funDecl
               | varDecl
               | statement ;

funDecl        → "fun" function ;
function       → IDENTIFIER "(" parameters? ")" block ;
parameters     → IDENTIFIER ( "," IDENTIFIER )* ;

varDecl        → "var" IDENTIFIER ( "=" expression )? ";" ;
statement      → exprStmt 
                | printStmt
                | ifStmt
                | whileStmt
                | forStmt // sugar
                | ctrlStmt
                | block ;

exprStmt       → expression ";" ;
printStmt      → "print" expression ";" ;

ifStmt         → "if" "(" expression ")" statement ( "else" statement )?;
whileStmt      → "while" "(" expression ")" statement ;
forStmt        → "for" "(" ( varDecl | exprStmt | ";" ) expression? ";" expression? ")" statement ;
ctrlStmt       → ("continue" | "break" | "return" expression? ) ";" ;

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
               | call ;
call           → primary ( "(" arguments? ")" )* ;
arguments      → expression ( "," expression )* ;

primary        → NUMBER | STRING | "true" | "false" | "nil"
               | "(" expression ")"
               | IDENTIFIER ;
```

## AST types

```
defineAst(outputDir, 'Expr', [], {
    'Assign' : [ 'name: Token', 'value: Expr' ],
    'Binary' : [ 'left: Expr', 'operator: Token', 'right: Expr'  ],
    'Call' : [ 'callee: Expr', 'paren: Token', 'arguments: Expr[]' ],
    'Grouping': [ 'expression: Expr' ],
    'Literal' : [ 'value: Primitive' ],
    'Unary' : [ 'operator: Token', 'right: Expr' ],
    'Variable': [ 'name: Token' ],
});

defineAst(outputDir, 'Stmt', ['Expr'], {
    'Block': [ 'statements: Stmt[]' ],
    'Expression': [ 'expression: Expr' ],
    'Function': [ 'name: Token', 'params: Token[]', 'body: Stmt[]' ], // body as array (for simplicity, not Expr.Block)
    'Var': [ 'name: Token', 'initializer: Expr | null' ],
    'If': [ 'condition: Expr', 'thenBranch: Stmt', 'elseBranch: Stmt | null' ],
    'While': [ 'condition: Expr', 'body: Stmt' ],
    'Print': [ 'expression: Expr' ],
    'Control': [ 'keyword: Token', 'value: Expr | null' ],
});
```

## Things we have done so far

* TODO

up to 10.5.
next: 10.6
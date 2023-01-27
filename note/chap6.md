# Chap 6. Parsing Expressions

## Recursive Descent Parsing

An easy way to handle precedence / associativity : deploy a context-free(BNF) grammar **from low to high precedence.**

To make the rule left associative, make the rule left-recursive (**first symbol** of the rule body is equal to the head)
-- but the parsing of left-recursive rule will be troublesome(namely, cause infinite recursion) for recursive descent. Instead, use star operation.

A match will correspond to a node in out parse tree.

For Lox, we may have the following EBNF rules:

```
expression     → equality ;
equality       → comparison ( ( "!=" | "==" ) comparison )* ;
comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
term           → factor ( ( "-" | "+" ) factor )* ;
// factor         → factor ( "/" | "*" ) unary | unary ;
factor         → unary ( ( "/" | "*" ) unary )* ;
unary          → ( "!" | "-" ) unary
               | primary ;
primary        → NUMBER | STRING | "true" | "false" | "nil"
               | "(" expression ")" ;
```

one thing I would like to modify is to prevent nested `-`.
```
unary   → "!" unary | "-"  primary | primary ;
```

## Implementing recursive descent parsing

for each entry, implement a function which consume that entry.

```
Expression(){ return Equality(); }
Equality(){
    result = Comparison();
    while match in '!=' or '==' {
        result = binaryNode( match, result, Comparison() );
    }
}
...
```
and so on.
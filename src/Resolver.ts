import * as Expr from "./Expr";
import { Interpreter } from "./Interpreter";
import { Lox } from "./Lox";
import * as Stmt from "./Stmt";
import { Token, TokenType } from "./Token";

// in strongly-typed languages,
// the resolver phase usually comes the type checker
// (and, in the case of rust, borrow checker)

enum FunType{
    NONE,
    FUNCTION
};

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
    private interpreter: Interpreter;
    private scopes: Map<string, boolean>[] = [];
    private currentFun: FunType = FunType.NONE;

    constructor(interpreter: Interpreter){
        this.interpreter = interpreter;
    }

    resolveStmts(stmts: Stmt.Stmt[]){
        for(var stmt of stmts){
            this.resolveStmt(stmt);
        }
    }

    resolveStmt(stmt: Stmt.Stmt){
        stmt.accept(this);
    }

    resolveExpr(expr: Expr.Expr){
        expr.accept(this);
    }

    beginScope(){
        this.scopes.push(new Map<string, boolean>());
    }
    endScope(){
        this.scopes.pop();
    }

    declare(name: Token){
        if(this.scopes.length === 0) return;
        var scope = this.scopes[this.scopes.length - 1];
        
        // if(scope.has(name.lexeme)){
        //     Lox.error(name, "Already a variable with this name in this scope.");
        // }

        scope.set(name.lexeme, false);
    }
    define(name: Token){
        if(this.scopes.length === 0) return;
        this.scopes[this.scopes.length - 1].set(name.lexeme, true);
    }

    /* visiting stmts */

    visitBlockStmt(stmt: Stmt.Block) {
        this.beginScope();
        this.resolveStmts(stmt.statements);
        this.endScope();
    }

    visitVarStmt(stmt: Stmt.Var) {
        // we choose 'rust-style' shadowing, so this should be perfectly fine ( along with double declaration )
        // ```
        // var a = "outer";
        // {
        //     var a = a;
        // }
        // ```

        // if the above example should be prohibited,
        // then declaration comes BEFORE resolving initializer.

        // this.declare(stmt.name);
        if(stmt.initializer !== null){
            this.resolveExpr(stmt.initializer);
        }
        this.declare(stmt.name);
        this.define(stmt.name);
    }

    resolveFunction(stmt: Stmt.Function, type: FunType){
        var enclosingFun = this.currentFun;
        this.currentFun = type;

        this.beginScope();
        for(var param of stmt.params){
            this.declare(param);
            this.define(param);
        }
        this.resolveStmts(stmt.body);
        this.endScope();

        this.currentFun = enclosingFun;
    }

    visitFunctionStmt(stmt: Stmt.Function){
        this.declare(stmt.name);
        this.define(stmt.name);

        this.resolveFunction(stmt, FunType.FUNCTION);
    }

    visitExpressionStmt(stmt: Stmt.Expression){
        this.resolveExpr(stmt.expression);
    }

    visitIfStmt(stmt: Stmt.If): void {
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.thenBranch);
        if(stmt.elseBranch !== null){
            this.resolveStmt(stmt.elseBranch);
        }
    }

    visitWhileStmt(stmt: Stmt.While){
        this.resolveExpr(stmt.condition);
        this.resolveStmt(stmt.body);
        if(stmt.increment !== null){
            this.resolveExpr(stmt.increment);
        }
    }

    visitPrintStmt(stmt: Stmt.Print) {
        this.resolveExpr(stmt.expression);
    }

    visitControlStmt(stmt: Stmt.Control): void {
        if(stmt.keyword.type === TokenType.RETURN){
            if(this.currentFun === FunType.NONE){
                Lox.error(stmt.keyword, "Can't return from top-level code.");
            }

            if(stmt.value !== null){
                this.resolveExpr(stmt.value);
            }
        }
        
    }

    /* visiting exprs */

    resolveLocal(expr: Expr.Expr, name: Token){
        for(var i = this.scopes.length - 1; i >= 0; i--){
            if(this.scopes[i].has(name.lexeme)){
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;

                // current scope : 0
                // immediately enclosing scope : 1
                // ...
            }
        }
    }

    visitAssignExpr(expr: Expr.Assign){
        this.resolveExpr(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    visitVariableExpr(expr: Expr.Variable) {
        // if(this.scopes.length > 0 && this.scopes[this.scopes.length - 1].get(expr.name.lexeme) === false ){
        //     Lox.error(expr.name, "Can't read local variable in its own initializer.");
        // }

        this.resolveLocal(expr, expr.name);
    }

    visitBinaryExpr(expr: Expr.Binary){
        this.resolveExpr(expr.left);
        this.resolveExpr(expr.right);
    }

    visitCallExpr(expr: Expr.Call){
        this.resolveExpr(expr.callee);

        for(var arg of expr.args){
            this.resolveExpr(arg);
        }
    }

    visitGroupingExpr(expr: Expr.Grouping){
        this.resolveExpr(expr.expression);
    }

    visitLiteralExpr(expr: Expr.Literal){ }

    visitUnaryExpr(expr: Expr.Unary) {
        this.resolveExpr(expr.right);
    }

}
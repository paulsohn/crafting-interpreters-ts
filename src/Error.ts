import * as Expr from './Expr';
import { Token, TokenType } from './Token';

export class RuntimeError extends Error {
    token: Token;

    constructor(token: Token, message: string){
        super(message);
        this.token = token;
    }
}
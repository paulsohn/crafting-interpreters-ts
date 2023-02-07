import * as Expr from './Expr';
import { Token, TokenType } from './Token';

export class RuntimeError extends Error {
    token: Token | null;

    constructor(token: Token | null, message: string){
        super(message);
        this.token = token;
    }
}
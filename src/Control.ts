import { Token, TokenType, Primitive } from './Token';

export class Control{
    keyword: TokenType;
    value: any; // for return : return value. for break/continue : label if possible.

    constructor(keyword: TokenType, value?: any){
        this.keyword = keyword;
        this.value = value;
    }
}
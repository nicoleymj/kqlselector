namespace KQLSelector {
    
    export interface IExpression {
        id:string;
        parent:IExpression;
        queryies:Query[];
        getCode(): KqlCode;
    }

}
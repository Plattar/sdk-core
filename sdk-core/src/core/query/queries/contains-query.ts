import { Query } from "./query";

/**
 * The operation types that can be used for comparison operations
 * 
 * operator == or = is 'equals'
 * operator != is 'not equals'
 */
export type QueryContainsOperator = '==' | '=' | '!=';

/**
 * Used internally for constructing the query
 */
type ContainsOperator = 'eq' | 'ne';

export class ContainsQuery extends Query {
    private readonly operation: ContainsOperator;
    private readonly objects: Array<string>;

    public constructor(operation: QueryContainsOperator, objects: Array<string>) {
        super();

        this.operation = operation === '==' || operation === '=' ? 'eq' : 'ne';
        this.objects = objects ? objects : [];
    }

    public override toString(): string {
        let retData: string = ',';

        if (this.objects.length > 0) {
            retData = `contains[${this.operation}]=`;

            this.objects.forEach((object: string) => {
                retData += `${object},`;
            });
        }

        // get rid of the last element
        return retData.slice(0, -1);
    }
}
import { Query } from "./query";

/**
 * The operation types that can be used for comparison operations
 * 
 * operator == or = is 'equals'
 * operator != is 'not equals'
 * operator > is 'greater than'
 * operator < is 'less than'
 * operator >= is 'greater than or equals to'
 * operator <= is 'less than or equals to'
 */
export type FilterQueryOperator = '==' | '=' | '!=' | '>' | '<' | '>=' | '<=';

type FilterOperator = 'eq' | 'ne' | 'gt' | 'ge' | 'lt' | 'le';

export class FilterQuery extends Query {
    private readonly variable: string;
    private readonly operator: FilterOperator;
    private readonly value: string | number | boolean;
    private readonly target: string;

    public constructor(object: string, variable: string, operator: FilterQueryOperator, value: string | number | boolean) {
        super();

        this.target = object;
        this.variable = variable;
        this.value = value;

        switch (operator) {
            case '=':
            case '==':
                this.operator = 'eq';
                break;
            case '!=':
                this.operator = 'ne';
                break;
            case '<':
                this.operator = 'lt';
                break;
            case '>':
                this.operator = 'gt';
                break;
            case '<=':
                this.operator = 'le';
                break;
            case '>=':
                this.operator = 'ge';
                break;
            default:
                this.operator = 'eq';
        }
    }

    public override toString(): string {
        return `filter[${this.target}.${this.variable}][${this.operator}]=${this.value}`;
    }
}
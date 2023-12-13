import { Query } from "./query";

/**
 * The operation types that can be used for sorting operations
 * 
 * operator ascending or asc is 'sort by ascending order'
 * operator descending or desc is 'sort by descending order'
 */
export type QuerySortOperator = 'ascending' | 'descending' | 'asc' | 'desc';

type SortOperator = '-' | '';

export class SortQuery extends Query {
    private readonly operation: SortOperator;
    private readonly object: string;
    private readonly attribute: string;

    public constructor(operation: QuerySortOperator, object: string, attribute: string) {
        super();

        switch (operation) {
            case 'asc':
            case 'ascending':
                this.operation = '';
                break;
            case 'desc':
            case 'descending':
                this.operation = '-';
                break;
            default:
                this.operation = '';
        }

        this.object = object;
        this.attribute = attribute;
    }

    public override toString(): string {
        return `sort=${this.object}.${this.operation}${this.attribute}`;
    }
}
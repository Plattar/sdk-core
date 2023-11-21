import { Query } from "./query";

export type SearchQueryOperator = '~=' | 'like';

export class SearchQuery extends Query {
    private readonly variable: string;
    private readonly value: string | number | boolean;
    private readonly target: string;

    public constructor(object: string, variable: string, value: string | number | boolean) {
        super();

        this.target = object;
        this.variable = variable;
        this.value = value;
    }

    public override toString(): string {
        return `query[${this.target}.${this.variable}]=${this.value}`;
    }
}
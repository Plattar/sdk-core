import { Query } from "./query";

export class PaginationQuery extends Query {
    private readonly count: number;
    private readonly size: number;

    public constructor(count: number, size: number) {
        super();

        this.count = count ? count : 0;
        this.size = size ? size : 10;
    }

    public override toString(): string {
        return `page[count]=${this.count}&page[size]=${this.size}`;
    }
}
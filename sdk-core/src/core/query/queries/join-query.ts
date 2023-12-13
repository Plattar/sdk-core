import { Query } from "./query";

export class JoinQuery extends Query {
    private readonly query: string;

    public constructor(query: string) {
        super();

        this.query = query;
    }

    public override toString(): string {
        return this.query;
    }
}
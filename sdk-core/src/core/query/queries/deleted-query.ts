import { Query } from "./query";

export class DeletedQuery extends Query {
    public override toString(): string {
        throw new Error("Method not implemented.");
    }
}
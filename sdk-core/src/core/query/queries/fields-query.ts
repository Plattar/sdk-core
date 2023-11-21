import { Query } from "./query";

export class FieldsQuery extends Query {
    private readonly attributes: Array<string>;
    private readonly object: string;

    public constructor(object: string, attributes: Array<string>) {
        super();

        this.attributes = attributes ? attributes : [];
        this.object = object;
    }

    public override toString(): string {
        let retData: string = ',';

        if (this.attributes.length > 0) {
            retData = `fields[${this.object}]=`;

            this.attributes.forEach((object: string) => {
                retData += `${object},`;
            });
        }

        // get rid of the last element
        return retData.slice(0, -1);
    }
}
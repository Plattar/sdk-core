import { Query } from "./query";

export class IncludeQuery extends Query {
    private readonly objects: Array<string>;

    public constructor(objects: Array<string>) {
        super();

        this.objects = objects ? objects : [];
    }

    public override toString(): string {
        let retData: string = ',';

        if (this.objects.length > 0) {
            retData = `include=`;

            this.objects.forEach((object: string) => {
                retData += `${object},`;
            });
        }

        // get rid of the last element
        return retData.slice(0, -1);
    }
}
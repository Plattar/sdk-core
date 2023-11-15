import { CoreObject, CoreObjectAttributes } from '../core-object';
import { Service } from '../service';
import { CoreQuery } from './core-query';

/**
 * CoreFileQuery has the added functionality to process uploading of files onto the API such as images, 3D models or videos
 */
export abstract class CoreFileQuery<T extends CoreObject<U>, U extends CoreObjectAttributes> extends CoreQuery<T, U> {

    /**
     * One-Shot upload the provided file into the provided key that belongs to the file
     */
    public async upload(key: keyof U, file: File): Promise<T> {
        if (!this.instance.hasID()) {
            throw new Error('CoreQuery._UploadFile - cannot upload a file using an uninitialized instance');
        }

        // hit our API to get the url for uploading to s3
        const uploadRes: Response = await fetch(this.service.url + '/' + this.instance.type + '/' + this.instance.id + '/upload', {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            method: 'post',
            mode: 'cors',
            body: JSON.stringify({
                data: {
                    attributes: {
                        key: key,
                        filename: file.name
                    }
                }
            }),
        });

        // upload into S3
        const json: any = await uploadRes.json();

        const fileId: string = json.data.id;
        const fileType: string = json.data.type;

        await fetch(json.data.attributes.url, { method: 'put', body: file });

        // re-fetch the file (simple GET request)
        const apiResult = await fetch(this.service.url + '/' + fileType + '/' + fileId, { method: 'get' });
        const fileData: any = await apiResult.json();

        this.instance.setFromAPI(fileData);

        return this.instance;
    }
}
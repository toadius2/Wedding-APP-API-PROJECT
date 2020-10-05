import { S3 } from "aws-sdk"
import * as nconf from 'nconf'
export default function s3Upload(key: string, data: Buffer, contenType: 'image' | 'video'): Promise<S3.PutObjectOutput> {
    return new Promise((resolve, reject) => {
        new S3({
            region: nconf.get('BUCKET_REGION')
        }).putObject({
            Bucket: nconf.get('BUCKET_NAME'),
            Key: key,
            Body: data,
            ACL: 'public-read',
            ContentType: contenType == 'image' ? 'image/jpeg' : 'video/quicktime'
        }, function (err, response) {
            if (err) {
                reject(err);
            } else {
                resolve(response);
            }
        });
    })
}
import * as graphicsmagick from "gm"
import { writeFile, mkdirSync, rmdirSync, existsSync, unlinkSync } from "fs";
import * as uuid from 'uuid'
import { get } from "https";
import { Transform as Stream } from "stream";
import * as async from "async";

const gm = graphicsmagick.subClass({
    imageMagick: true
});

export class ImageDetectionError extends Error {
    underlyingError?: any

    constructor(message: string = "The image could not be read", err?: any) {
        super(message);
        Object.setPrototypeOf(this, ImageDetectionError.prototype);
        this.underlyingError = err
    }
}

export interface ImageData {
    size: { width: number, height: number };
    format: string;
    type: string;
}

export function detectImageData(filePath: string): Promise<ImageData> {
    return new Promise<ImageData>((resolve, reject) => {
        gm(filePath)
            .identify(function (err, data) {
                if (err) {
                    reject(new ImageDetectionError("The image could not be read", err));
                } else {
                    resolve({
                        size: {
                            width: data.size.width,
                            height: data.size.height
                        },
                        format: data.format,
                        type: 'image'
                    });
                }
            })
    });
}
export function imageToBuffer(filePath: string, quality: number = 100, width = 800): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        gm(filePath)
            .quality(quality)
            .resize(width)
            .toBuffer('jpg', function (err, buffer) {
                if (err) {
                    reject(err)
                } else {
                    resolve(buffer);
                }
            });
    })
}
export function resize(filePath: string, size: { width: number, height: number }, quality: number = 100): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        gm(filePath)
            .quality(quality)
            .resize(size.width, size.height)
            .gravity('Center')
            .crop(size.width, size.height)
            .noProfile()
            .toBuffer('jpg', function (err, buffer) {
                if (err) {
                    reject(err)
                } else {
                    resolve(buffer);
                }
            });
    })
}
export function download(image: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        get(image, (res) => {
            var data = new Stream();

            res.on('data', function (chunk) {
                data.push(chunk);
            });
            res.on('end', () => {
                resolve(data.read());
            })
            res.on('error', (err) => {
                reject(err);
            })
        })
    });
}

export function donwloadImage(image: string): Promise<string> {
    if (!existsSync('.downloads')) {
        mkdirSync('.downloads')
    }
    let local_dir = ".downloads/" + uuid.v4()
    mkdirSync(local_dir);
    return download(image).then(res => {
        let path = local_dir + "/" + uuid.v4() + ".jpg";
        return new Promise<string>((resolve, reject) => {
            writeFile(path, res, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(path);
                }
            });
        });
    })
}
export function removeLocalFile(image: string) {
    unlinkSync(image);
}

export function promotePicture(localImage: string, watermark: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        gm(localImage)
            .draw('gravity NorthEast image Over 10,10 100,100 "' + watermark + '"')
            .toBuffer('jpg', function (err, buffer) {
                if (err) {
                    reject(err);
                } else {
                    resolve(buffer);
                }
            })
    })
}


export function mosaic(images: Array<string>): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (!existsSync('.downloads')) {
            mkdirSync('.downloads')
        }
        let local_dir = ".downloads/" + uuid.v4()
        mkdirSync(local_dir);
        async.parallel<string, Error>(images.map(i => {
            return (callback) => {
                download(i).then(result => {
                    let path = local_dir + "/" + uuid.v4() + ".jpg";

                    writeFile(path, result, (err) => {
                        callback(err, path);
                    });
                }).catch(err => {
                    callback(err);
                })
            }
        }), (err, results) => {
            if (err || !results) {
                reject(err);
            } else {
                let pipe = (gm((results[0] as string)) as any);
                results.forEach((image, index) => {
                    if (index > 0) {
                        pipe = pipe.montage(image)
                    }
                })
                pipe.geometry("+0+0")
                    .toBuffer('jpg', function (err, buffer) {
                        results.forEach(r => {
                            unlinkSync(r!);
                        })
                        rmdirSync(local_dir);
                        if (err) {
                            reject(err);
                        }
                        else {
                            let path = '.uploads/' + uuid.v4() + '.jpg'
                            writeFile(path, buffer, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(path);
                                }
                            })
                        }
                    })
            }
        })


    })
}

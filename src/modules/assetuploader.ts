import { detectVideoData, VideoData } from "./videoconversion";
import { imageToBuffer, detectImageData } from "./imageconversion";
import S3Upload from './s3uploader'
import { InvalidParametersError } from "../error";
import * as fs from 'fs'
import * as async from "async"

export class Uploader {
    private pipeline = new Array<Function[]>();
    imageRatio: Number;
    constructor() {

    }
    image(fromPath: string, to: string, newWidth = 640, quality = 100, onlyOriginal: boolean = false): Uploader {
        if (!onlyOriginal) {
            this.pipeline.push(
                [(next) => {
                    detectImageData(fromPath).then((identify) => {
                        if (identify.type == 'image') {
                            this.imageRatio = identify.size.height / identify.size.width;
                            next(null, identify);
                        } else {
                            next(new InvalidParametersError([], {}, 'Unsupported file format'));
                        }
                    }).catch(next)
                },
                (data, next) => {
                    imageToBuffer(fromPath, quality, newWidth).then((buffer) => {
                        next(null, buffer);
                    }).catch(next);
                },
                (data, next) => {
                    S3Upload(to, data, 'image').then(result => {
                        next(null, result);
                    }).catch(next);
                }]
            );
        }

        this.pipeline.push(
            [
                (next) => {
                    fs.readFile(fromPath, (err, buffer) => {
                        next(err, buffer)
                    })
                },
                (data, next) => {
                    let toNewPath = to;
                    if (!onlyOriginal) {
                        let key = to.split(".");
                        toNewPath = key.slice(0, key.length - 1).join(".");
                        toNewPath += "@orig.jpg"
                    }
                    S3Upload(toNewPath, data, 'image').then(result => {
                        next(null, result);
                    }).catch(next);
                }
            ]
        );
        return this;
    }
    video(fromPath: string, to: string, convert: boolean = true): Uploader {
        this.pipeline.push(
            [(next) => {
                detectVideoData(fromPath, false, convert).then((identify) => {
                    if (identify.type == 'video') {
                        next(null, identify);
                    } else {
                        next(new InvalidParametersError([], {}, 'Unsupported file format'));
                    }
                }).catch(err => {
                    next(err);
                })
            },
            (data: VideoData, next) => {
                S3Upload(to, data.data, 'video').then(result => {
                    next(null, result);
                }).catch(err => {
                    next(err);
                });
            }]
        );
        return this;
    }

    exec(): Promise<any> {
        return new Promise((resolve, reject) => {
            async.parallel<any, any>(
                this.pipeline.map(t => {
                    return (callback) => {
                        async.waterfall(t, (err: Error | undefined, results) => {
                            callback(err, results);
                        })
                    }
                }), (err, reuslts) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(reuslts);
                    }
                });
        })
    }
}

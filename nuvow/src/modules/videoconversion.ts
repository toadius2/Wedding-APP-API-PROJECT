import * as ffmpeg from "fluent-ffmpeg"
import * as fs from "fs"
import BasicError from "../error/baseerror";
import * as uuid from 'uuid'
const supportedCodecs = ['h264', 'hevc'];

export class UnsupportedVideoCodedError extends BasicError {
    codec_name: any;
    supported_codecs: string[];

    constructor(message: string = "This video codec is not supported", codec?: string) {
        super(message);
        Object.setPrototypeOf(this, UnsupportedVideoCodedError.prototype);
        this.type = 'UnsupportedVideoCodedError';
        this.codec_name = codec;
        this.supported_codecs = supportedCodecs;
        this.status = 400;
    }
}

export class VideoDetectionError extends BasicError {
    underlyingError?: any;

    constructor(message: string = "The video could not be read", err?: any) {
        super(message);
        Object.setPrototypeOf(this, VideoDetectionError.prototype);
        this.type = 'VideoDetectionError';
        this.underlyingError = err;
        this.status = 400;
    }
}

export interface VideoData {
    format: string;
    duration: number;
    codec_type: string;
    type: string;
    data: Buffer;
    thumbnail?: string;
}
export function detectVideoData(filePath: string, generateThumbnail: boolean, convertToMpeg: boolean = false): Promise<VideoData> {
    return new Promise<VideoData>((resolve, reject) => {
        let readStream = fs.createReadStream(filePath);

        const command = ffmpeg(readStream).on('error', function (err) {
            readStream.close();
            reject(err);
        });
        command.ffprobe(function (err, data) {
            readStream.close();
            if (err) {
                return reject(new VideoDetectionError("The video could not be read", err))
            }
            if (data && data['streams'] && (<any[]>data['streams']).length >= 1) {
                const videoData = (<any[]>data['streams']).find(d => {
                    return d['codec_type'] == 'video';
                });
                if (videoData && videoData['codec_type'] === 'video' && supportedCodecs.indexOf(videoData['codec_name']) !== -1) {
                    if (convertToMpeg) {
                        let tempFile = ".uploads/" + uuid.v4() + '.mp4';
                        ffmpeg((filePath))
                            .on('error', (err) => {
                                reject(err);
                            })
                            .videoCodec('mpeg4')
                            .size('800x?')
                            .on('end', () => {
                                fs.readFile(tempFile, (err, buffer) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve({
                                            format: videoData['codec_name'],
                                            duration: videoData['duration'],
                                            codec_type: videoData['codec_type'],
                                            type: 'video',
                                            data: buffer
                                        })
                                    }
                                })
                            }).output(tempFile).run()
                    } else {
                        fs.readFile(filePath, (err, buffer) => {
                            if (err) {
                                return reject(err);
                            }
                            return resolve({
                                format: videoData['codec_name'],
                                duration: videoData['duration'],
                                codec_type: videoData['codec_type'],
                                type: 'video',
                                data: buffer
                            })
                        })
                    }
                    /*if (generateThumbnail) {
                        let fileid = uuid.v4() + '.png';
                        let path = '.uploads/'
                        passThrough = new stream.PassThrough();
                        ffmpeg(passThrough).on('error', function (err) {
                            reject(err);
                        }).takeScreenshots({
                            folder: path,
                            filename: fileid,
                            timemarks: [0]
                        }, path).on('end', function () {
                            resolve({
                                format: videoData['codec_name'],
                                duration: videoData['duration'],
                                codec_type: videoData['codec_type'],
                                type: 'video',
                                data: videoDataBuffer,
                                thumbnail: path + fileid
                            })
                        })
                        passThrough.write(videoDataBuffer);
                        passThrough.end();
                    } else {
                        return resolve({
                            format: videoData['codec_name'],
                            duration: videoData['duration'],
                            codec_type: videoData['codec_type'],
                            type: 'video',
                            data: videoDataBuffer
                        })
                    }*/
                } else {
                    return reject(new UnsupportedVideoCodedError(undefined, videoData['codec_name']));
                }
            } else
                return reject(new VideoDetectionError())
        });
    });
}

import * as wn from "winston"
import * as n from "nconf"
import * as p from "path"

let infoTransport = new wn.transports.File({
    filename: p.join(n.get("LOG_DIR"), 'info.log'),
    prettyPrint: true
});
if (n.get("LOCAL")) {
    infoTransport = new wn.transports.Console()
}

let infoLogger = new wn.Logger({
    level: 'info',
    transports: [
        infoTransport
    ]
});

let dataTransport = new wn.transports.File({
    filename: p.join(n.get("LOG_DIR"), 'database.log')
});

if (n.get("LOCAL")) {
    dataTransport = new wn.transports.Console()
}

let databaseLogger = new wn.Logger({
    level: 'info',
    transports: [
        dataTransport
    ]
});

export function error(message: string | undefined, error?: any, path?: string | undefined) {

    let toLog = error
    if (error && typeof error == 'object') {
        if ('toLogJSON' in error) {
            toLog = error.toLogJSON();
        } else if ('toJSON' in error) {
            toLog = error.toJSON()
            toLog.stack = (toLog.stack || '').split('\n')
        }
    }
    infoLogger.log('error', message || 'An error occurred', {
        error: toLog,
        path: path
    });
}

export function info(message: string, params?: any) {
    infoLogger.log('info', message, { params: (typeof params == 'object') ? JSON.parse(JSON.stringify(params)) : (params == undefined ? {} : params) });
}

export function redis(message: string, params?: any) {
    if (!n.get("LOCAL")) {
        infoLogger.log('redis', message, { params: (typeof params == 'object') ? JSON.parse(JSON.stringify(params)) : (params == undefined ? {} : params) });
    }
}

export function database(message: string, params?: any) {
    if (!n.get("LOCAL")) {
        databaseLogger.log('info', message, { params: (typeof params == 'object') ? JSON.parse(JSON.stringify(params)) : (params == undefined ? {} : params) });
    }
}

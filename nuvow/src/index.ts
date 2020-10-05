import * as nconf from "nconf"
nconf.env()
import DataBase from "./database"
import * as logger from "./logger"
import { default as modelsetup } from "./model/setup"
import AWS = require("aws-sdk");
import * as Cluster from 'cluster'
import { cpus } from 'os'

declare global {
    interface Array<T> {
        toJSON(options?: any): any;
        unique(property?: string): Array<T>;
    }
}
Array.prototype.toJSON = function <T>(this: Array<T>, options) {
    let items = new Array();
    this.forEach(i => {
        if (i && (i as any).toJSON) {
            items.push((i as any).toJSON(options));
        } else {
            items.push(i);
        }

    })
    return items;
};

Array.prototype.unique = function <T>(this: Array<T>, property?: string) {
    let s = new Set();
    return this.filter((value, index, self) => {
        if (property && s.has(value[property])) {
            return false;
        } else if (property) {
            s.add(value[property])
            return true;
        }
        if (s.has(value)) {
            return false;
        }
        s.add(value);
        return true;
    })
}

if (!('toJSON' in Error.prototype))
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            var alt = {};

            Object.getOwnPropertyNames(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true,
        writable: true
    });

if (nconf.get("LOCAL")) {
    var credentials = new AWS.SharedIniFileCredentials({ profile: nconf.get("AWS_PROFILE_NAME") });
    AWS.config.credentials = credentials;
} else {
    AWS.config.update({
        region: nconf.get('AWS_REGION')
    })
}

function init(force: boolean = false) {
    console.log = (message?: any, ...optionalParams: any[]) => {
        logger.info(message, optionalParams)
    }
    console.error = (message?: any, ...optionalParams: any[]) => {
        if (message instanceof Error) {
            logger.error(message.message, message)
        } else
            logger.error(message, optionalParams)
    }
    console.info = (message?: any, ...optionalParams: any[]) => {
        logger.info(message, optionalParams)
    }
    let db = new DataBase(nconf.get('DB_ADMIN'), nconf.get('DB_USER'),
        nconf.get('DB_PW'), nconf.get('DB_MAIN_HOST'))

    db.connect().then((s) => {
        logger.info("Database connected")
        modelsetup(s);
        s.sync({ force: force, alter: nconf.get("LOCAL") && (nconf.get("NODE_ENV") == 'development') }).then(() => {
            logger.info("Setup finished")
            const Server = require('./server')['default'];
            if (Cluster.isMaster && !nconf.get('LOCAL')) {
                for (var i = 0; i < cpus().length; i += 1) {
                    Cluster.fork(process.env);
                }
                Cluster.on('exit', () => {
                    Cluster.fork(process.env);
                })
            } else {
                new Server(s, nconf.get('PORT') || 8081);
            }
        }).catch(err => {
            logger.error("Error in setup", err, "Startup-init-sync-catch")
        })
    }).catch((err) => {
        logger.error("Error connecting to database", err, "Startup-connect");
        init();
    })
}
init(false);

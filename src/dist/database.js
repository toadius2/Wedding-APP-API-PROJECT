"use strict";
exports.__esModule = true;
var sequelize = require("sequelize");
// import * as logger from './logger'
var DataBase = /** @class */ (function () {
    function DataBase(database, username, password, host, readHost) {
        this.connection = new sequelize(database, username, password, {
            dialect: 'mysql',
            pool: {
                max: 20,
                min: 3,
                idle: 10000
            },
            replication: {
                read: readHost ? [
                    { host: readHost, username: username, password: password },
                    { host: host, username: username, password: password }
                ] : [{ host: host, username: username, password: password }],
                write: { host: host, username: username, password: password }
            },
            operatorsAliases: false,
            define: {
                timestamps: false,
                paranoid: false,
                underscored: true,
                freezeTableName: true
            },
            isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
            // logging: (log: string, time) => {
            //     if (log.indexOf('1+1') == -1) {
            //         logger.database('Execution time', {
            //             time: time,
            //             sql: (time > 1500 ? log : '')
            //         });
            //     }
            // },
            logging: console.log,
            benchmark: true
        });
    }
    DataBase.prototype.connect = function () {
        var _this = this;
        return new Promise(function (res, rej) {
            _this.connection.authenticate().then(function () {
                res(_this.connection);
            })["catch"](function (err) {
                rej(err);
            });
        });
    };
    DataBase.prototype.define = function () {
        return this.connection.define.call(arguments);
    };
    return DataBase;
}());
exports["default"] = DataBase;

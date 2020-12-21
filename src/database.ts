import * as sequelize from "sequelize"
import * as logger from './logger'

export default class DataBase {
    private connection: sequelize.Sequelize;

    constructor(database: string, username: string, password: string, host: string, readHost?: string) {
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
                timestamps: true,
                paranoid: false,
                underscored: true,
                freezeTableName: true
            },
            isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
            logging: (log: string, time) => {
                if (log.indexOf('1+1') == -1) {
                    logger.database('Execution time', {
                        time: time,
                        sql: (time > 1500 ? log : '')
                    });
                }
            },
            benchmark: true
        });
    }

    connect(): Promise<sequelize.Sequelize> {
        return new Promise<sequelize.Sequelize>((res, rej) => {
            this.connection.authenticate().then(() => {
                res(this.connection);
            }).catch((err) => {
                rej(err);
            });
        });
    }

    define() {
        return this.connection.define.call(arguments);
    }
}

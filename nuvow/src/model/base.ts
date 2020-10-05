import * as Sequelize from "sequelize"
import * as uuid from "uuid"

export interface BaseModelAttributes {
    id?: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date | null;
}

export function defaultColums(): Sequelize.DefineAttributes {
    return {
        id: {
            type: Sequelize.UUID,
            primaryKey: true,
            unique: true,
            defaultValue: uuid.v4
        }
    }
}

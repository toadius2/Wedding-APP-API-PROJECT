import * as validator from 'validator'
/**
 * This interface defines a basic outline for a validator function
 */

export interface ValidatorFunction<T> {
    (value: T): true | string
}

/**
 * This rule detects if the provided value is a string
 * @param value
 * @param allowEmpty
 * @returns {boolean}
 */
export function isStringAndNotEmpty(value: any): true | string {
    return isString(value, false)
}

/**
 * This rule detec0ts if the provided value is a string
 * @param value
 * @param allowEmpty
 * @returns {boolean}
 */
export function isString(value: any, allowEmpty: boolean = true): true | string {
    if (value !== undefined && typeof value === 'string') {
        if (!allowEmpty) {
            return value.trim() !== '' || "The provided value was an empty string"
        }
        return true
    }
    return "The provided value was not a string"
}

/**
 * This rule detects if the provided value is a valid email
 * @param value
 * @returns {boolean}
 */
export function isEmail(value: any): true | string {
    if (validator.isEmail(value)) {
        return true
    }
    return 'The provided value was not a valid email'
}

/**
 * This rule detects if the provided value is an array
 * @param value
 * @returns {boolean}
 */
export function isArray(value: any): true | string {
    return value !== undefined && Array.isArray(value) || 'The provided value was not an array'
}

export function isDate(value: any): true | string {
    return (value !== undefined && !isNaN(Date.parse(value))) || 'The provided value was not a valid ISO8601 date string'
}

/**
 * This rule detects if the provided value is an array
 * @param ofType
 * @returns {boolean}
 */
export function isArrayOfType(ofType: string): ValidatorFunction<any> {
    return (value: any): true | string => {
        if (value !== undefined && Array.isArray(value)) {
            let isDifferentType = false;
            value.forEach(function (item) {
                if (typeof item !== ofType) {
                    isDifferentType = true;
                }
            });
            return !isDifferentType || 'The provided array didn\'t contain the correct type';
        }
        return 'The provided value was not an array'
    }
}

/**
 * This rule detects if the provided value is a number
 * @param value
 * @returns {boolean}
 */
export function isNumber(value: any): true | string {
    return (value !== undefined && typeof value === 'number') || 'The provided value was not a number'
}

/**
 * This rule detects if the provided value exists
 * @param value
 * @returns {boolean}
 */
export function isExists(value: any): true | string {
    return (value !== undefined) || 'The value is missing'
}

/**
 * This rule detects if the provided value is an object
 * @param value
 * @returns {boolean}
 */
export function isObject(value: any): true | string {
    return (value !== undefined && typeof value === 'object') || 'The provided value was not an object'
}

/**
 * This rule detects if the provided value is a boolean
 * @param value
 * @returns {boolean}
 */
export function isBoolean(value: any): true | string {
    return (value !== undefined && ((typeof value === 'boolean') || ['true', 'false'].indexOf(value) != -1)) || 'The provided value was not a boolean'
}

/**
 * This rule detects if the provided string has a minimum length
 * @param {number} length
 * @returns {ValidatorFunction<string>}
 */
export function minLength(length: number): ValidatorFunction<string> {
    return (value: string): true | string => {
        return (value.length >= length) || 'The provided value was too short (min: ' + length + ')';
    }
}

/**
 * This rule detects if the provided string is below a maximum length
 * @param {number} length
 * @returns {ValidatorFunction<string>}
 */
export function maxLength(length: number): ValidatorFunction<string> {
    return (value: string): true | string => {
        return (value.length <= length) || 'The provided value was too long (max: ' + length + ')';
    }
}

/**
 * This rule detects if the provided number is same or above the provided minValue
 * @param {number} minValue
 * @returns {ValidatorFunction<number>}
 */
export function min(minValue: number): ValidatorFunction<number> {
    return (value: number): true | string => {
        return (value >= minValue) || 'The provided value was too small (min: ' + minValue + ')';
    }
}

/**
 * This rule detects if the provided number is same or below the provided maxValue
 * @returns {ValidatorFunction<number>}
 * @param maxValue
 */
export function max(maxValue: number): ValidatorFunction<number> {
    return (value: number): true | string => {
        return (value <= maxValue) || 'The provided value was too large (max: ' + maxValue + ')';
    }
}

/**
 * This rule detects if the provided value is within the provided array
 * @param enumeration
 * @returns {boolean}
 */
export function isEnum(enumeration: any[]): ValidatorFunction<any[]> {
    return (value: any): true | string => {
        if (value !== undefined) {
            return (enumeration.indexOf(value) !== -1) || 'The value is not a member of (' + enumeration.join(', ') + ')';
        }
        return 'The value is missing'
    }
}

/**
 * This helper function runs a series of validator functions and returns false once a rule fails
 * @param {ValidatorFunction<any>[]} rules
 * @param value
 * @returns {boolean}
 */
export function parallelValidateBlock(rules: ValidatorFunction<any>[]): ((value: any) => true | string) {

    return (value) => {
        for (let checker of rules) {
            let result = checker(value)
            if (result !== true) {
                return result
            }
        }
        return true
    }
}

/**
 * This helper function runs a series of validator functions and returns false once a rule fails
 * @param {ValidatorFunction<any>[]} rules
 * @param value
 * @returns {boolean}
 */
export function parallelValidate(rules: ValidatorFunction<any>[], value?: any | undefined): true | string {
    for (let checker of rules) {
        let result = checker(value)
        if (result !== true) {
            return result
        }
    }
    return true
}

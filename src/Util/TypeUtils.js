import {defined} from "./NormalUtils"

export const isType = (instance, typeName) => {
    if (typeof instance === "object" && defined(instance.constructor)) {
        return instance.constructor.toString().match(/^function\s*([^\s(]+)/)[1] === typeName;
    }
    return false;
}

/**
 * 类名包含
 * @param instance
 * @param typeName
 * @returns {boolean}
 */
export const typeContaines = (instance, typeName) => {
    if (typeof instance === "object" && defined(instance.constructor)) {
        let typeMatchGroup = instance.constructor.toString().match(/^function\s*([^\s(]+)/);
        if (defined(typeMatchGroup) && defined(typeMatchGroup[1])) {
            return typeMatchGroup[1].indexOf(typeName) !== -1;
        }
    }
    return false;
}

export const getType = (instance) => {
    if (typeof instance === "object" && defined(instance.constructor)) {
        let typeMatchGroup = instance.constructor.toString().match(/^function\s*([^\s(]+)/);
        if (defined(typeMatchGroup) && defined(typeMatchGroup[1])) {
            return typeMatchGroup[1];
        }
    }
    return undefined;
}

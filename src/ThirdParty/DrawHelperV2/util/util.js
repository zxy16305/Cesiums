export const fillOptions = (options, defaultOptions) => {
    options = options || {};
    let option;
    for (option in defaultOptions) {
        if (options[option] === undefined) {
            options[option] = clone(defaultOptions[option]);
        }
    }
}

export const copyOptions = (options, defaultOptions) => {
    let newOptions = clone(options), option;
    for (option in defaultOptions) {
        if (newOptions[option] === undefined) {
            newOptions[option] = clone(defaultOptions[option]);
        }
    }
    return newOptions;
}

export const clone = (from, to) => {
    if (from == null || typeof from != "object") return from;
    if (from.constructor != Object && from.constructor != Array) return from;
    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
        from.constructor == String || from.constructor == Number || from.constructor == Boolean)
        return new from.constructor(from);

    to = to || new from.constructor();

    for (let name in from) {
        to[name] = typeof to[name] == "undefined" ? clone(from[name], null) : to[name];
    }

    return to;
}


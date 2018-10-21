export const setListener = (primitive, type, callback) => {
    primitive[type] = callback;
}

export const removeListener = (primitive, type) => {
    delete primitive[type];
}

/**
 * 给对象设置监听器
 * @param element
 */
export const enhanceWithListeners = (element) => {
    element._listeners = {};

    element.addListener = function (name, callback) {
        this._listeners[name] = (this._listeners[name] || []);
        this._listeners[name].push(callback);
        return this._listeners[name].length;
    }

    element.executeListeners = function (event, defaultCallback) {
        if (this._listeners[event.name] && this._listeners[event.name].length > 0) {
            var index = 0;
            for (; index < this._listeners[event.name].length; index++) {
                this._listeners[event.name][index](event);
            }
        } else {
            if (defaultCallback) {
                defaultCallback(event);
            }
        }
    }
}
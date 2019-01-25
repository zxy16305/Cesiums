import {defined} from "../Util/NormalUtils";
import {Uuid} from "../Util/Uuid";
import {typeContaines} from "../Util/TypeUtils";
import {debugManager} from "../index";
import {DrillPickThrottle, Pickthrottle} from "../Util/InnerUtils";
import {Settings} from "..";

export const EventType = Object.freeze({
    LEFT_CLICK: "leftClick",
    LEFT_DOUBLE_CLICK: "leftDoubleClick",
    MOUSE_MOVE: "mouseMove",
    MOUSE_MOVE_OUT: "mouseMoveOut",
    MOUSE_MOVE_IN: "mouseMoveIn",
    LEFT_UP: "leftUp",
    LEFT_DOWN: "leftDown",
    DRAW_START: "drawStart",
    DRAW: "draw",
    DRAW_END: "drawEnd",
    DROP: "drop",
    DRAG_OVER: "dragOver"
})

export class EventSystemFactory {
    static eventSystemMap = {};

    static createEventSystem(viewer) {
        if (defined(viewer)) {
            if (defined(viewer._eventSystemUUID) && defined(this.eventSystemMap[viewer._eventSystemUUID])) {
                return this.eventSystemMap[viewer._eventSystemUUID];
            }

            let eventSystem = new EventSystemV2(viewer);
            let id = Uuid();
            // eventSystem.setView(viewer);
            viewer._eventSystemUUID = id;
            this.eventSystemMap[id] = eventSystem;
            return eventSystem;
        }
    }

    static closeEventSystem(viewer) {
        if (defined(viewer._eventSystemUUID) && defined(this.eventSystemMap[viewer._eventSystemUUID])) {
            this.eventSystemMap[viewer._eventSystemUUID].destroy();
            delete this.eventSystemMap[viewer._eventSystemUUID];
        }
    }
}

/**
 * 相比1版，
 * 1. 分离了drag事件和move事件，仅对left down对象具有drag系事件时才触发drag系事件
 * 2. 增加了{@link EventSystemFactory},管理多个viewer下的事件（1版未使用
 * 3. 增加了moveIn事件
 * 4. 实例化了节流对象
 *
 * 但仍不支持多次绑定同一事件。TODO
 *
 */
export class EventSystemV2 {
    constructor(viewer, {accuracy = 3, doubleClickTime = 500} = {}) {
        this._init = false;
        this._doubleClickTime = doubleClickTime;
        this._enable = true;
        this._enableRotation = true;
        this.viewer = viewer;

        this._pickthrottle = new Pickthrottle(this.viewer.scene)
        this._drillPickThrottle = new DrillPickThrottle(this.viewer.scene);
        this._dataTransfer = new DataTransfer();
        this._accuracy = new Accuracy();
        this._eventBind()
    }

    get accuracy() {
        return this._accuracy;
    }

    enableEvent(enable = true) {
        this._enable = enable;
    }

    _eventBind() {
        if (this._run || this._init) return;
        this._run = true;

        this._handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        let moveStopTimeout = null;
        let doubleClickTimeout = null;
        let pressFlag = false;


        this._handler.setInputAction((movement) => {
            if (!this._enable) return;
            let _position = {...movement.position};
            clearTimeout(doubleClickTimeout);
            doubleClickTimeout = setTimeout(() => {
                this.callPrimitiveCallback(EventType.LEFT_CLICK, _position);
            }, this._doubleClickTime)
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        this._handler.setInputAction((movement) => {
            if (!this._enable) return;
            let _position = {...movement.position};
            clearTimeout(doubleClickTimeout)
            this.callPrimitiveCallback(EventType.LEFT_DOUBLE_CLICK, _position);
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        this._handler.setInputAction((movement) => {
            if (!this._enable) return;
            //按下的时候 不触发mousemove
            if (pressFlag) return;
            let _position = {...movement.endPosition};
            this._lastPickObject = this._currentPickObject;

            this._currentPickObject = EventSystemV2.getPickObject(this._pickthrottle.pick(_position));//TODO 精度控制

            if (this._lastPickObject?.id !== this._currentPickObject?.id  /*|| this._lastPickObject !== this._currentPickObject*/) {
                EventSystemV2.callPrimitiveCallbackCurrent(this._currentPickObject, EventType.MOUSE_MOVE_IN, _position)
                EventSystemV2.callPrimitiveCallbackCurrent(this._lastPickObject, EventType.MOUSE_MOVE_OUT, _position)
                // this._currentPickObject?.[EventType.MOUSE_MOVE_IN]?.(_position);
                // this._lastPickObject?.[EventType.MOUSE_MOVE_OUT]?.(_position);
                this._lastPickObject = this._currentPickObject;
            }
            EventSystemV2.callPrimitiveCallbackCurrent(this._currentPickObject, EventType.MOUSE_MOVE, _position)
            // this._currentPickObject?.[EventType.MOUSE_MOVE]?.(_position);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)


        //up && drag end
        this._handler.setInputAction((movement) => {
            if (!this._enable) return;

            if (pressFlag) {
                let _position = {...movement.position};
                pressFlag = false;

                try {
                    !this._dragHandler?.isDestroyed() && this._dragHandler?.destroy();
                    // this._currentDragObject?.[EventType.DRAW_END]?.(_position);
                    this.callPrimitiveCallbackDrag(EventType.DROP, _position);
                    EventSystemV2.callPrimitiveCallbackCurrent(this._currentDragObject, EventType.DRAW_END, _position, [this._dataTransfer])
                    this._dataTransfer._clear();

                    EventSystemV2.callPrimitiveCallbackCurrent(this._currentDragObject, EventType.LEFT_UP, _position)
                } catch (e) {
                    console.error(e)
                } finally {
                    Settings.enableRotation(this.viewer, true);
                }
            }

        }, Cesium.ScreenSpaceEventType.LEFT_UP);


        //down && drag && drag start
        this._handler.setInputAction((movement) => {
            if (!this._enable) return;

            let _position = {...movement.position};

            this._currentDragObject = this.callPrimitiveCallback(EventType.LEFT_DOWN, _position);

            if (this.hasEventOr(this._currentDragObject, [EventType.DRAW, EventType.DRAW_START, EventType.DRAW_END])) {
                Settings.enableRotation(this.viewer, false);
                pressFlag = true;
                let first = true;


                this._dragHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
                this._dragHandler.setInputAction((movement) => {
                    if (!this._enable) return;
                    let _movePosition = {...movement.endPosition};
                    if (first) {
                        // this._pickthrottle()
                        first = false;
                        EventSystemV2.callPrimitiveCallbackCurrent(this._currentDragObject, EventType.DRAW_START, _movePosition, [this._dataTransfer])
                        // this._currentDragObject?.[EventType.DRAW_START]?.(_movePosition);
                    } else {
                        EventSystemV2.callPrimitiveCallbackCurrent(this._currentDragObject, EventType.DRAW, _movePosition, [this._dataTransfer])
                        // this._currentDragObject?.[EventType.DRAW]?.(_movePosition);
                        // 特殊处理
                        // this.callPrimitiveCallback(EventType.DRAG_OVER, _movePosition)

                        this.callPrimitiveCallbackDrag(EventType.DRAG_OVER, _movePosition)
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            }

        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);


        this._init = true;
        this._run = false;
    }

    callPrimitiveCallback(eventName, position) {
        //在取点做了节流 目前是100毫秒内都会返回同一个对象
        let {width, height} = this.accuracy.getAccuracy(eventName);
        let pickedObject = this._pickthrottle.pick(position, width, height);
        //entity
        // if (pickedObject && typeContaines(pickedObject.id, "Entity")) {
        //     return EventSystemV2.callPrimitiveCallbackCurrent(pickedObject.id, eventName, position)
        // }
        //primitive
        // if (pickedObject && pickedObject.primitive) {
        //     return EventSystemV2.callPrimitiveCallbackCurrent(pickedObject.primitive, eventName, position)
        // }
        return EventSystemV2.callPrimitiveCallbackCurrent(EventSystemV2.getPickObject(pickedObject), eventName, position)
    }

    /**
     * 会多传入一个transfer对象
     * @param eventName
     * @param position
     */
    callPrimitiveCallbackDrag(eventName, position) {
        let {width, height} = this.accuracy.getAccuracy(eventName);
        let pickedObject = this._pickthrottle.pick(position, width, height);

        return EventSystemV2.callPrimitiveCallbackCurrent(EventSystemV2.getPickObject(pickedObject), eventName, position, [this._dataTransfer])
    }


    /**
     * 从scene.pick返回的对象中获取需要的对象
     * @param originalPick
     * @returns {*}
     */
    static getPickObject(originalPick) {
        //entity
        if (typeContaines(originalPick?.id, "Entity")) {
            return originalPick.id
        }
        //primitive
        if (originalPick?.primitive) {
            return originalPick.primitive
        }
    }

    static callPrimitiveCallbackCurrent(pickedObjectObj, eventName, position, otherParamArray = []) {
        // pickedObjectObj && pickedObjectObj[eventName] && pickedObjectObj[eventName](position, pickedObjectObj);
        //使用apply
        // pickedObjectObj?.[eventName]?.(position, pickedObjectObj);
        pickedObjectObj?.[eventName]?.apply(this, [position, pickedObjectObj, ...otherParamArray]);
        // debugManager.log([eventName, position, pickedObjectObj])//debug
        return pickedObjectObj;
    }

    destroy() {
        !this._dragHandler?.isDestroyed() && this._dragHandler?.destroy();
        !this._handler?.isDestroyed() && this._handler?.destroy();
    }

    hasEventAnd(object, events) {
        if (Array.isArray(events) && events.length > 0) {
            let V = true;
            events.forEach(event => {
                if (!defined(object?.[event])) V = false;
            })
            return V;
        }
        return false;
    }

    hasEventOr(object, events) {
        if (Array.isArray(events) && events.length > 0) {
            let V = false;
            events.forEach(event => {
                if (defined(object?.[event])) V = true;
            })
            return V;
        }
        return false;
    }

    /**
     *
     * @param {Cesium.Entity | Cesium.Primitive} obj
     * @param {string} type
     * @param callback
     */
    setListener(obj, type, callback) {
        if (defined(obj) && defined(type) && (typeof callback === "function")) {
            obj[type] = callback;
        }
    }

    removeListener(obj, type) {
        delete obj[type];
    }

    setListenerOnce(obj, type, callback) {
        if (defined(obj) && defined(type) && (typeof callback === "function")) {
            obj[type] = (position, pickedObjectObj, ...other) => {
                callback.apply(this, [position, pickedObjectObj, ...other]);
                this.removeListener(obj, type)
            }
        }
    }

    //pass
    onLeftClick(obj, callback) {
        this.setListener(obj, EventType.LEFT_CLICK, callback);
    }

    onLeftDoubleClick(obj, callback) {
        this.setListener(obj, EventType.LEFT_DOUBLE_CLICK, callback);
    }

    onMouseMove(obj, callback) {
        this.setListener(obj, EventType.MOUSE_MOVE, callback);
    }

    onMouseMoveOut(obj, callback) {
        this.setListener(obj, EventType.MOUSE_MOVE_OUT, callback);
    }

    onMouseMoveIn(obj, callback) {
        this.setListener(obj, EventType.MOUSE_MOVE_IN, callback);
    }

    onLeftUp(obj, callback) {
        this.setListener(obj, EventType.LEFT_UP, callback);
    }

    onLeftDown(obj, callback) {
        this.setListener(obj, EventType.LEFT_DOWN, callback);
    }

    onDragStart(obj, callback) {
        this.setListener(obj, EventType.DRAW_START, callback);
    }

    onDrag(obj, callback) {
        this.setListener(obj, EventType.DRAW, callback)
    }

    onDragEnd(obj, callback) {
        this.setListener(obj, EventType.DRAW_END, callback)
    }

    onDragOver(obj, callback) {
        this.setListener(obj, EventType.DRAG_OVER, callback)
    }

    onDrop(obj, callback) {
        this.setListener(obj, EventType.DROP, callback)
    }

}

// TODO: 2019/1/10 全局方法 不依赖于对象
class CommonContainer {
    constructor() {
        this.onLeftClickFuns = []
        this.onLeftDoubleClickFunc = []
        this.onMouseMoveFunc = []
        this.onMouseMoveOutFunc = []
        this.onMouseMoveInFunc = []
        this.onLeftUpFunc = []
        this.onLeftDownFunc = []
        this.onDragStartFunc = []
        this.onDragFunc = []
        this.onDragEndFunc = []
    }
}

/**
 * 用于drag事件的数据传递
 */
class DataTransfer {
    constructor() {
        this.data = {};
    }

    setData(key, value) {
        this.data[key] = value
        return this;
    }

    getData(key) {
        return this.data[key]
    }

    _clear() {
        // for(let key in this.data) {
        //     if(this.data.hasOwnProperty(key)) delete this.data[key];
        // }
        this.data = {};
    }
}

/**
 * 管理pick取值时的精准度
 */
class Accuracy {
    constructor() {
        //初始化默认精度
        Object.values(EventType).forEach((type) => {
            this[type] = {
                width: 3,
                height: 3
            }
        })
    }

    setAccuracy(eventType, {width, height}) {
        this[eventType] = {width, height}
    }

    getAccuracy(eventType) {
        return this[eventType];
    }
}

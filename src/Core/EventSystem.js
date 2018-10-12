import * as Cesium from "Cesium";
import {defined} from "../Util/NormalUtils"
import {typeContaines} from "../Util/TypeUtils"

/**
 * 接管Cesium的事件系统（对于entity和primitive）
 */

class EventSystem {

    constructor(accuracy = 3) {
        this._init = false;
        this._accuracy = accuracy;
    }

    /**
     * 单地图
     * @param viewer
     */
    setView(viewer) {
        if (!this._init) {
            this.viewer = viewer;
            if (defined(viewer)) {
                this._init = true;
                this.eventBind();
            }
        }
        return this;
    }


    setAccuracy(value = 3) {
        this._accuracy = value;
        return this;
    }

    eventBind() {
        let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

        handler.setInputAction((movement) => {
            this.callPrimitiveCallback('leftClick', movement.position);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction((movement) => {
            this.callPrimitiveCallback('leftDoubleClick', movement.position);
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        handler.setInputAction((movement) => {

        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((movement) => {
            this.callPrimitiveCallback('leftUp', movement.position);
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        handler.setInputAction((movement) => {
            this.callPrimitiveCallback('leftDown', movement.position);
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    }

    callPrimitiveCallback(eventName, position) {
        let pickedObject = this.viewer.scene.pick(position, this._accuracy, this._accuracy);
        //primitive
        if (pickedObject && pickedObject.primitive && pickedObject.primitive[eventName]) {
            pickedObject.primitive[eventName](position);
        }
        //entity
        if (pickedObject && typeContaines(pickedObject.id, "Entity") && pickedObject.id[eventName]) {
            pickedObject.id[eventName](position);
        }
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

    onLeftUp(obj, callback) {
        this.setListener(obj, EventType.LEFT_UP, callback);
    }

    onLeftDown(obj, callback) {
        this.setListener(obj, EventType.LEFT_DOWN, callback);
    }
}

const EventType = Object.freeze({
    LEFT_CLICK: "leftClick",
    LEFT_DOUBLE_CLICK: "leftDoubleClick",
    MOUSE_MOVE: "mouseMove",
    LEFT_UP: "leftUp",
    LEFT_DOWN: "leftDown"
})

export const eventSystem = new EventSystem();

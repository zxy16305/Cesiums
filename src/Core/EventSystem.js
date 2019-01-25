// import * as Cesium from "Cesium";
import {defined} from "../Util/NormalUtils"
import {typeContaines} from "../Util/TypeUtils"
import {setListener} from "../ThirdParty/DrawHelperV2/util/EventHelper";
import {Settings} from "../Widgets/Settings"
import {Uuid} from "../Util/Uuid"
import * as lodash from "../ThirdParty/lodash.min"
import {Scenes} from "../Scene/Scenes";
import {debugManager} from "../index";

let consumeMoveOutFlag = true;
let pickTimeout = 100;
const pickthrottle = {
    lastPick: null,
    lastTime: new Date(),
    pick: function (scene, position, accuracy) {
        let time = new Date();
        if (this.lastPick === null || time.getTime() - this.lastTime.getTime() > pickTimeout) {
            this.lastTime = time;
            this.lastPick = scene.pick(position, accuracy, accuracy);
            // debugManager.log("new")
        }else{
            // debugManager.log("old")
        }
        // if(defined(this.lastPick))
        return lodash.merge({}, this.lastPick);
    }
}


/**
 * 接管Cesium的事件系统（对于entity和primitive）
 */

class EventSystem {

    constructor(accuracy = 3) {
        this._init = false;
        this._accuracy = accuracy;
        this._enableRotation = true;
        this._frameRate = 60;
        this.updateMoveTime()
        this._cunsumeMoveOutObject = [];
        this._enable = true;
        window.logs = [];
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

    /**
     * 设置帧率，帧率会影响move事件的节流时间
     * @param frameRate
     */
    setFrameRate(frameRate) {
        this._frameRate = frameRate;
        this.updateMoveTime();
    }

    updateMoveTime() {
        this._moveTime = parseInt(1000 / this._frameRate);
    }

    setAccuracy(value = 3) {
        this._accuracy = value;
        return this;
    }

    eventBind() {
        const throttleV2 = (fn, mustRunDelay) => {
            var timer = null;
            var t_start;
            return function () {
                var _self = this;
                var t_curr = +new Date();
                if (!t_start) {
                    t_start = t_curr;
                }
                if (t_curr - t_start >= mustRunDelay) {
                    fn.apply(_self, arguments);
                    t_start = t_curr;
                }
            };
        };

        let moveCunt = 0;
        const f = (currentMouseMoveObject, markPosition) => {
            if (currentMouseMoveObject !== mouseMoveObject) {
                mouseMoveObject = currentMouseMoveObject;
                mouseMoveObject && this.callPrimitiveCallbackCurrent(mouseMoveObject, EventType.MOUSE_MOVE_OUT, markPosition)
            }
        };

        const mouseMove = (movementStep) => {

            let markPosition = {
                x: movementStep.endPosition.x,
                y: movementStep.endPosition.y
            };
            if (pressFlag) {
                //第一次按下
                if (firstFlag) {
                    firstFlag = false;
                    this.callPrimitiveCallbackCurrent(currentObject, EventType.DRAW_START, markPosition)
                    if (currentObject && !this._enableRotation) {
                        Settings.enableRotation(this.viewer, false);
                    }
                } else {
                    this.callPrimitiveCallbackCurrent(currentObject, EventType.DRAW, markPosition)
                }
            } else {
                let currentMouseMoveObject = this.callPrimitiveCallback(EventType.MOUSE_MOVE, markPosition);
                debugManager.log([currentMouseMoveObject, mouseMoveObject, markPosition])
                // if (!(currentMouseMoveObject === undefined && mouseMoveObject === undefined)
                //     && (currentMouseMoveObject === undefined || mouseMoveObject === undefined )
                //     && currentMouseMoveObject.id !== mouseMoveObject.id) {
                if (currentMouseMoveObject !== mouseMoveObject) {

                    mouseMoveObject && this.callPrimitiveCallbackCurrent(mouseMoveObject, EventType.MOUSE_MOVE_OUT, markPosition)
                    mouseMoveObject = currentMouseMoveObject;
                }
            }
        };

        let pressFlag = false;
        let currentObject = null;
        let firstFlag = true;
        let mouseMoveObject = null;
        let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        let moveStopTimeout = null;

        handler.setInputAction((movement) => {
            if (!this._enable) return;
            this.callPrimitiveCallback(EventType.LEFT_CLICK, movement.position);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction((movement) => {
            if (!this._enable) return;
            this.callPrimitiveCallback(EventType.LEFT_DOUBLE_CLICK, movement.position);
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        handler.setInputAction((movementStep) => {
            if (!this._enable) return;

            // lodash.throttle(mouseMove, this._moveTime)(movementStep);
            mouseMove(movementStep)
            //鼠标静止不动时再触发一次
            if(defined(moveStopTimeout)) clearTimeout(moveStopTimeout);
            moveStopTimeout = setTimeout(()=>{
                debugManager.log("on mouse stop!")
                mouseMove(movementStep)
            },pickTimeout * 3)

        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction((movement) => {
            if (!this._enable) return;

            if (pressFlag) {
                pressFlag = false;
                currentObject && this.callPrimitiveCallbackCurrent(currentObject, EventType.DRAW_END, movement.position);
            }
            this.callPrimitiveCallback(EventType.LEFT_UP, movement.position);


            Settings.enableRotation(this.viewer, true);
            currentObject = null;
            firstFlag = true;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        handler.setInputAction((movement) => {
            if (!this._enable) return;

            pressFlag = true;
            currentObject = this.callPrimitiveCallback(EventType.LEFT_DOWN, movement.position);
            // if (currentObject && (currentObject[EventType.DRAW] || currentObject[EventType.DRAW_START] || currentObject[EventType.DRAW_END])) {

        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    }

    callPrimitiveCallback(eventName, position) {
        //在取点做了节流 目前是100毫秒内都会返回同一个对象
        // let pickedObject = this.viewer.scene.pick(position, this._accuracy, this._accuracy);
        let pickedObject = pickthrottle.pick(this.viewer.scene, position, this._accuracy, this._accuracy);
        // let pickedObject = Scenes.pick(this.viewer.scene,position, this._accuracy, this._accuracy);
        //entity
        if (pickedObject && typeContaines(pickedObject.id, "Entity")) {
            return this.callPrimitiveCallbackCurrent(pickedObject.id, eventName, position)
        }
        //primitive
        if (pickedObject && pickedObject.primitive) {
            return this.callPrimitiveCallbackCurrent(pickedObject.primitive, eventName, position)
        }

        return undefined;
    }

    callPrimitiveCallbackCurrent(pickedObjectObj, eventName, position) {
        pickedObjectObj && pickedObjectObj[eventName] && pickedObjectObj[eventName](position, pickedObjectObj);
        debugManager.log(eventName)//debug
        return pickedObjectObj;
    }

    consumeMoveOut() {
        if (consumeMoveOutFlag) {
            consumeMoveOutFlag = false;
            let cunsumeObjects = this._cunsumeMoveOutObject.slice(0);
            this._cunsumeMoveOutObject.length = 0;
            cunsumeObjects.forEach((obj) => {
                obj.obj && this.callPrimitiveCallbackCurrent(obj.obj, EventType.MOUSE_MOVE_OUT, obj.position)
            })

            consumeMoveOutFlag = true;
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

    removeListener(obj, type) {
        delete obj[type];
    }

    enableDrawRotation(enable = true) {
        this._enableRotation = enable;
    }

    enableEvent(enable = true) {
        this._enable = enable;
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
}

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
    DRAW_END: "drawEnd"
})

const eventSystemMap = {};

// 应对多viewer的情况
// 但是内部模块（Entity）的事件不好管理，除非全部用SetView的方式
// 目前
export class EventSystemFactory {
    static createEventSystem(viewer) {
        if (defined(viewer)) {
            if (defined(viewer._eventSystemUUID) && defined(eventSystemMap[viewer._eventSystemUUID])) {
                return eventSystemMap[viewer._eventSystemUUID];
            }

            let eventSystem = new EventSystem();
            let id = Uuid();
            eventSystem.setView(viewer);
            viewer._eventSystemUUID = id;
            eventSystemMap[id] = eventSystem;
            return eventSystem;
        }
    }
}

const eventSystem = new EventSystem();

// 默认单个viewer ， 内部模块更容易接入事件系统
export class EventSystemInstance {
    static setViewer(viewer) {
        if (!eventSystem._init) {
            eventSystem.setView(viewer)
        }
    }

    static getInstance(viewer) {
        if (defined(viewer))
            this.setViewer(viewer);
        return eventSystem;
    }

}


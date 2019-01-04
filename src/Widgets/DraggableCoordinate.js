/**
 * 可拖动的坐标系
 */
import {CalcTwoLineCommonVertByFourPoints} from "../Util/Math";
import {__dirpath, debugManager, Settings} from "../index";

export class DragableCoordinate {
    constructor({viewer, size = 10000, position = new Cesium.Cartesian3()} = {}) {
        this.position = position;
        this.size = size;
        this.viewer = viewer;
        this.bindEntities = [];
        this._createAxis(size)
    }

    _createAxis(size) {
        //校正相机坐标变化
        this. onCameraChanged = () => {
            let multi = this.oDistance / Cesium.Cartesian3.distance(this.oPosition, this.viewer.camera.position);
            this.delta = {
                x: this.oDetal.x * multi,
                y: this.oDetal.y * multi
            }
        }

        this.axisz = this.viewer.entities.add({
            position: new Cesium.CallbackProperty((time, result) => {
                return this.position;
            }, false),
            model: {
                uri: __dirpath + "/resources/axisz.glb",
                scale: size,
                color: Cesium.Color.GREEN,
                maximumScale: 1,
                // color: modelColor,
                show: true
            }
        });

        this.axisx = this.viewer.entities.add({
            position: new Cesium.CallbackProperty((time, result) => {
                return this.position;
            }, false),
            model: {
                uri: __dirpath + "/resources/axisx.glb",
                scale: size,
                color: Cesium.Color.RED,

                maximumScale: 1,
                // color: modelColor,
                show: true
            }
        });

        this.axisy = this.viewer.entities.add({
            position: new Cesium.CallbackProperty((time, result) => {
                return this.position;
            }, false),
            model: {
                uri: __dirpath + "/resources/axisy.glb",
                scale: size,
                color: Cesium.Color.YELLOW,

                maximumScale: 1,
                // color: modelColor,
                show: true
            }
        });

        this.eventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

        this.dragHandle = null;

        this.eventHandler.setInputAction((event) => {
            // debugManager.log("down");
            this.dragHandle && !this.dragHandle.isDestroyed() && this.dragHandle.destroy();
            let pick = this.viewer.scene.pick(event.position);
            if (pick && pick.id) {
                if (pick.id.id === this.axisz.id) {
                    this.pick = CalcType.Z;
                } else if (pick.id.id === this.axisx.id) {
                    this.pick = CalcType.X;
                } else if (pick.id.id === this.axisy.id) {
                    this.pick = CalcType.Y;
                } else return;
            } else return;

            Settings.enableRotation(this.viewer, false);
            this.onDrag = true;
            //偏移量
            let cartesian2 = this.viewer.scene.cartesianToCanvasCoordinates(this.position);
            this.delta = {
                x: cartesian2.x - event.position.x,
                y: cartesian2.y - event.position.y
            }
            //校正
            this.oDetal = {
                x: cartesian2.x - event.position.x,
                y: cartesian2.y - event.position.y
            }
            ///记录当前坐标 用于计算相机坐标距离变化比例
            this.oPosition = this.position.clone();
            this.oDistance = Cesium.Cartesian3.distance(this.position, this.viewer.camera.position);
            this.viewer.camera.changed.addEventListener(this.onCameraChanged);


            this.dragHandle = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
            this.dragHandle.setInputAction((event) => {
                // debugManager.log("move");
                switch (this.pick) {
                    case CalcType.X:
                        this._onLatDrag({
                            x: event.endPosition.x + this.delta.x,
                            y: event.endPosition.y + this.delta.y,
                        })
                        break;
                    case CalcType.Y:
                        this._onLngDrag({
                            x: event.endPosition.x + this.delta.x,
                            y: event.endPosition.y + this.delta.y,
                        })
                        break;
                    case CalcType.Z:
                        this._onHeightDrag({
                            x: event.endPosition.x + this.delta.x,
                            y: event.endPosition.y + this.delta.y,
                        })
                        break;
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        this.eventHandler.setInputAction((event) => {
            // debugManager.log("up");
           this._DestroyDragHandle();
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    _DestroyDragHandle(){
        if (this.onDrag) {
            this.viewer.camera.changed.removeEventListener(this.onCameraChanged)
            Settings.enableRotation(this.viewer, true);
            this.onDrag = false
        }
        this.dragHandle && !this.dragHandle.isDestroyed() && this.dragHandle.destroy();
    }

    _getPositionParam(windowPosition) {
        let ray = this.viewer.camera.getPickRay(windowPosition);
        //test
        let point = Cesium.Ray.getPoint(ray, 1000);
        let origin = ray.origin;

        let to = Cesium.Cartographic.fromCartesian(point);
        let from = Cesium.Cartographic.fromCartesian(origin);
        let pre = Cesium.Cartographic.fromCartesian(this.position);

        return {from, to, pre};
    }

    _onLatDrag(windowPosition) {
        let returnParam = this._getPositionParam(windowPosition);
        let [longitude, latitude, height] = DragableCoordinate._getNewPoint({
            from: returnParam.from,
            to: returnParam.to,
            pre: returnParam.pre,
            type: CalcType.Y
        });
        this.position = Cesium.Cartesian3.fromRadians(longitude, latitude, height);
    }


    _onLngDrag(windowPosition) {
        let returnParam = this._getPositionParam(windowPosition);
        let [longitude, latitude, height] = DragableCoordinate._getNewPoint({
            from: returnParam.from,
            to: returnParam.to,
            pre: returnParam.pre,
            type: CalcType.X
        });
        this.position = Cesium.Cartesian3.fromRadians(longitude, latitude, height);
    }

    _onHeightDrag(windowPosition) {
        let returnParam = this._getPositionParam(windowPosition);
        let [longitude, latitude, height] = DragableCoordinate._getNewPoint({
            from: returnParam.from,
            to: returnParam.to,
            pre: returnParam.pre,
            type: CalcType.Z
        });
        this.position = Cesium.Cartesian3.fromRadians(longitude, latitude, height);
    }

    /**
     *
     * @param from 相机坐标
     * @param to 方向上另一点
     * @param pre 对象当前坐标
     * @param type 可移动方向
     */
    static _getNewPoint({from, to, pre, type = CalcType.X}) {
        let otherPoint = null;
        if (type === CalcType.X) {
            otherPoint = [0, pre.latitude, pre.height]
        } else if (type === CalcType.Y) {
            otherPoint = [pre.longitude, 0, pre.height]
        } else {
            otherPoint = [pre.longitude, pre.latitude, 0]
        }
        let newPoint = CalcTwoLineCommonVertByFourPoints(
            [from.longitude, from.latitude, from.height],
            [to.longitude, to.latitude, to.height],
            [pre.longitude, pre.latitude, pre.height],
            [...otherPoint]);
        return newPoint;
    }

    /**
     * 用于外部调用 （CallbackProperty
     * @returns {function()}
     */
    getPositionFunction(){
        return ()=> this.position
    }

    destory(){
        this.viewer.entities.remove(this.axisz)
        this.viewer.entities.remove(this.axisx)
        this.viewer.entities.remove(this.axisy)
        this.unbindAllEntities();
        this._DestroyDragHandle();
    }

    /**
     * 将坐标原点和entity坐标绑定
     * 目前bind系列不支持高并发
     * @param entity
     */
    bindEntity(entity) {
        this.bindEntities.push(entity);

        entity.position = new Cesium.CallbackProperty((time, result) => {
            return this.position;
        }, false)
    }

    unbindEntity(entity) {
        // entity.position = entity.position.getValue(0);
        if(this.bindEntities.find(entityBind=> entityBind.id === entity.id)){
            entity.position = this.position.clone();
            this.bindEntities = this.bindEntities.filter((filterEntity) => filterEntity !== entity)
        }

    }

    unbindAllEntities() {
        this.bindEntities.forEach((entity) => {
            // FIXME: 2018/12/30 可能不正确
            entity.position = this.position.clone();
        })
    }
}

export const CalcType = Object.freeze({
    X: "X",
    Y: "Y",
    Z: "Z"
})

import * as Cesium from "Cesium";
import {EventSystemInstance} from "..";
import {defined} from "../Util/NormalUtils";


export class BuildingHightlightBuilder {

    setPositions(positions) {
        this._position = positions;
        return this;
    }

    setColor(color) {
        this._color = color;
        return this;
    }

    setHoverColor(hoverColor) {
        this._hoverColor = hoverColor;
        return this;
    }

    setOnClick(clickCallBack) {
        this.clickCallback = clickCallBack;
        return this;
    }

    setViewer(viewer) {
        this._viewer = viewer;
        return this;
    }

    _setDefault() {
        if (!defined(this._hoverColor)) {
            this._hoverColor = Cesium.Color.YELLOW.withAlpha(0.5);
        }
        this._hoverColorBytes = this._hoverColor.toBytes();
        if (!defined(this._color)) {
            this._color = Cesium.Color.YELLOW.withAlpha(0);
        }
        this._colorBytes = this._color.toBytes();
    }

    build() {
        this._setDefault();

        let eventSystem = EventSystemInstance.getInstance();
        let classificationPrimitive = new Cesium.ClassificationPrimitive({
            geometryInstances: new Cesium.GeometryInstance({
                geometry: Cesium.PolygonGeometry.fromPositions({
                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                    positions: this._position,
                    extrudedHeight: 100
                }),
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(this._color),
                    show: new Cesium.ShowGeometryInstanceAttribute(true)
                },
                id: 'box-2'
            }),
            classificationType: Cesium.ClassificationType.BOTH//CESIUM_3D_TILE
        });
        eventSystem.onMouseMove(classificationPrimitive, (position,obj) => {
            if(!obj) return;//暂时过滤掉drawhelper的事件
            console.log(["move in",position,obj])
            let attributes = classificationPrimitive.getGeometryInstanceAttributes('box-2');
            attributes.color = this._hoverColorBytes;
        })

        eventSystem.onMouseMoveOut(classificationPrimitive, (position,obj) => {
            console.log(["move out",position,obj])
            let attributes = classificationPrimitive.getGeometryInstanceAttributes('box-2');
            attributes.color = this._colorBytes;
        })

        this.clickCallback && eventSystem.onLeftClick(classificationPrimitive, (position) => {
            typeof this.clickCallback === "function" && this.clickCallback(position, classificationPrimitive);
        })

        return classificationPrimitive;
    }

}
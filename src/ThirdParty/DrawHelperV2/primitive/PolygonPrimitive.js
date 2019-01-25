// import * as Cesium from "Cesium";
import {ChangeablePrimitive} from "./ChangeablePrimitive";
import {copyOptions} from "../util/util";
import {defaultSurfaceOptions,ellipsoid} from "../constant/DefaultValue";
import {enhanceWithListeners} from "../util/EventHelper";
import {PolySharpPrimitive} from "./PolySharpPrimitive";


export class PolygonPrimitive extends PolySharpPrimitive {
    constructor(options,drawHelper) {
        super();
        options = copyOptions(options, defaultSurfaceOptions);

        this._drawHelper = drawHelper;

        this.initialiseOptions(options);

        this.isPolygon = true;
        drawHelper.registerEditableShape(this);
        enhanceWithListeners(this);

    }

    setPositions(positions) {
        this.setAttribute('positions', positions);
    };

    getPositions() {
        return this.getAttribute('positions');
    };

    getGeometry() {
        if (!Cesium.defined(this.positions) || this.positions.length < 3) {
            return;
        }

        return Cesium.PolygonGeometry.fromPositions({
            positions: this.positions,
            height: this.height,
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            stRotation: this.textureRotationAngle,
            ellipsoid: this.ellipsoid,
            granularity: this.granularity
        });
    };

    getOutlineGeometry() {
        return Cesium.PolygonOutlineGeometry.fromPositions({
            positions: this.getPositions()
        });
    }

}

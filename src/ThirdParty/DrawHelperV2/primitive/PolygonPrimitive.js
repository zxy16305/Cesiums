import * as Cesium from "Cesium";
import {ChangeablePrimitive} from "./ChangeablePrimitive";
import {copyOptions} from "../util/util";
import {defaultSurfaceOptions} from "../constant/DefaultValue";


export class PolygonPrimitive extends ChangeablePrimitive {
    constructor(options) {
        super();
        options = copyOptions(options, defaultSurfaceOptions);

        this.initialiseOptions(options);

        this.isPolygon = true;
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
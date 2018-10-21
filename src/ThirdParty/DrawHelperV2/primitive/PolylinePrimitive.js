import * as Cesium from "Cesium";
import {ChangeablePrimitive} from "./ChangeablePrimitive";
import {copyOptions} from "../util/util";
import {defaultPolylineOptions} from "../constant/DefaultValue";

export class PolylinePrimitive extends ChangeablePrimitive {
    constructor(options) {
        super();
        options = copyOptions(options, defaultPolylineOptions);
        this.initialiseOptions(options);
    }

    setPositions(positions) {
        this.setAttribute('positions', positions);
    };

    setWidth(width) {
        this.setAttribute('width', width);
    };

    setGeodesic(geodesic) {
        this.setAttribute('geodesic', geodesic);
    };

    getPositions() {
        return this.getAttribute('positions');
    };

    getWidth() {
        return this.getAttribute('width');
    };

    getGeodesic() {
        return this.getAttribute('geodesic');
    };

    getGeodesic(geodesic) {
        return this.getAttribute('geodesic');
    };

    getGeometry() {

        if (!Cesium.defined(this.positions) || this.positions.length < 2) {
            return;
        }

        return new Cesium.PolylineGeometry({
            positions: this.positions,
            height: this.height,
            width: this.width < 1 ? 1 : this.width,
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            ellipsoid: this.ellipsoid
        });
    }
}
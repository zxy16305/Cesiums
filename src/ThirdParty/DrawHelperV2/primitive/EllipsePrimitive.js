import * as Cesium from "Cesium";
import {ChangeablePrimitive} from "./ChangeablePrimitive";
import {copyOptions} from "../util/util";
import {defaultEllipseOptions} from "../constant/DefaultValue";

export class EllipsePrimitive extends ChangeablePrimitive {
    constructor(options) {
        super();

        if (!(Cesium.defined(options.center) && Cesium.defined(options.semiMajorAxis) && Cesium.defined(options.semiMinorAxis))) {
            throw new Cesium.DeveloperError('Center and semi major and semi minor axis are required');
        }

        options = copyOptions(options, defaultEllipseOptions);

        this.initialiseOptions(options);
    }

    setCenter(center) {
        this.setAttribute('center', center);
    }

    setSemiMajorAxis(semiMajorAxis) {
        if (semiMajorAxis < this.getSemiMinorAxis()) return;
        this.setAttribute('semiMajorAxis', semiMajorAxis);
    };

    setSemiMinorAxis(semiMinorAxis) {
        if (semiMinorAxis > this.getSemiMajorAxis()) return;
        this.setAttribute('semiMinorAxis', semiMinorAxis);
    };

    setRotation(rotation) {
        return this.setAttribute('rotation', rotation);
    };

    getCenter() {
        return this.getAttribute('center');
    };

    getSemiMajorAxis() {
        return this.getAttribute('semiMajorAxis');
    };

    getSemiMinorAxis() {
        return this.getAttribute('semiMinorAxis');
    };

    getRotation() {
        return this.getAttribute('rotation');
    };

    getGeometry() {

        if (!(Cesium.defined(this.center) && Cesium.defined(this.semiMajorAxis) && Cesium.defined(this.semiMinorAxis))) {
            return;
        }

        return new Cesium.EllipseGeometry({
            ellipsoid: this.ellipsoid,
            center: this.center,
            semiMajorAxis: this.semiMajorAxis,
            semiMinorAxis: this.semiMinorAxis,
            rotation: this.rotation,
            height: this.height,
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            stRotation: this.textureRotationAngle,
            granularity: this.granularity
        });
    };

    getOutlineGeometry () {
        return new Cesium.EllipseOutlineGeometry({
            center: this.getCenter(),
            semiMajorAxis: this.getSemiMajorAxis(),
            semiMinorAxis: this.getSemiMinorAxis(),
            rotation: this.getRotation()
        });
    }

}
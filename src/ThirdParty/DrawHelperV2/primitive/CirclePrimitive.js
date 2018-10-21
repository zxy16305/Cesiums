import * as Cesium from "Cesium";
import {ChangeablePrimitive} from "./ChangeablePrimitive";
import {copyOptions} from "../util/util";
import {defaultSurfaceOptions} from "../constant/DefaultValue";

export class CirclePrimitive extends ChangeablePrimitive {
    constructor(options) {
        super();

        if (!(Cesium.defined(options.center) && Cesium.defined(options.radius))) {
            throw new Cesium.DeveloperError('Center and radius are required');
        }

        options = copyOptions(options, defaultSurfaceOptions);

        this.initialiseOptions(options);

        this.setRadius(options.radius);
    }

    setCenter(center) {
        this.setAttribute('center', center);
    }

    setRadius(radius) {
        this.setAttribute('radius', Math.max(0.1, radius));
    }

    getCenter() {
        return this.getAttribute('center');
    }

    getRadius() {
        return this.getAttribute('radius');
    }

    getGeometry() {

        if (!(Cesium.defined(this.center) && Cesium.defined(this.radius))) {
            return;
        }

        return new Cesium.CircleGeometry({
            center: this.center,
            radius: this.radius,
            height: this.height,
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            stRotation: this.textureRotationAngle,
            ellipsoid: this.ellipsoid,
            granularity: this.granularity
        });
    };

    getOutlineGeometry() {
        return new Cesium.CircleOutlineGeometry({
            center: this.getCenter(),
            radius: this.getRadius()
        });
    }

}
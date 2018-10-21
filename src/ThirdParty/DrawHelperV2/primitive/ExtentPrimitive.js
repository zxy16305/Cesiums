import {ChangeablePrimitive} from "./ChangeablePrimitive";
import * as Cesium from "Cesium";
import {copyOptions} from "../util/util";
import {defaultSurfaceOptions} from "../constant/DefaultValue";

export class ExtentPrimitive extends ChangeablePrimitive {
    constructor(options) {
        super();
        if (!Cesium.defined(options.extent)) {
            throw new Cesium.DeveloperError('Extent is required');
        }

        options = copyOptions(options, defaultSurfaceOptions);

        this.initialiseOptions(options);

        this.setExtent(options.extent);
    }

    setExtent(extent) {
        this.setAttribute('extent', extent);
    }

    getExtent() {
        return this.getAttribute('extent');
    }

    getGeometry() {

        if (!Cesium.defined(this.extent)) {
            return;
        }

        return new Cesium.RectangleGeometry({
            rectangle: this.extent,
            height: this.height,
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            stRotation: this.textureRotationAngle,
            ellipsoid: this.ellipsoid,
            granularity: this.granularity
        });
    };

    getOutlineGeometry() {
        return new Cesium.RectangleOutlineGeometry({
            rectangle: this.extent
        });
    }


}
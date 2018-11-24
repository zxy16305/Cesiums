// import * as Cesium from "Cesium";
import {ChangeablePrimitive} from "./ChangeablePrimitive";
import {copyOptions} from "../util/util";
import {defaultPolylineOptions,ellipsoid} from "../constant/DefaultValue";
import {enhanceWithListeners} from "../util/EventHelper";
import {PolySharpPrimitive} from "./PolySharpPrimitive";

export class PolylinePrimitive extends PolySharpPrimitive {
    constructor(options,drawHelper) {
        super();

        this._drawHelper = drawHelper;

        options = copyOptions(options, defaultPolylineOptions);
        this.initialiseOptions(options);
        drawHelper.registerEditableShape(this);
        enhanceWithListeners(this);
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

    setHighlighted (highlighted) {
        // disable if already in edit mode
        if (this._editMode === true) {
            return;
        }
        if (highlighted) {
            this._drawHelper.setHighlighted(this);
            this.setWidth(this.width * 2);
        } else {
            this.setWidth(this.width);
        }
    }

    getExtent(){
        return Cesium.Extent.fromCartographicArray(ellipsoid.cartesianArrayToCartographicArray(this.positions));
    }
}
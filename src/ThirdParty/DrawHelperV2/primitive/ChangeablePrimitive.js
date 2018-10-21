import * as Cesium from "Cesium";
import {fillOptions} from "../util/util"

export class ChangeablePrimitive {
    initialiseOptions(options) {
        fillOptions(this, options)
        this._ellipsoid = undefined;
        this._granularity = undefined;
        this._height = undefined;
        this._textureRotationAngle = undefined;
        this._id = undefined;

        // set the flags to initiate a first drawing
        this._createPrimitive = true;
        this._primitive = undefined;
        this._outlinePolygon = undefined;
    }

    setAttribute(name, value) {
        this[name] = value;
        this._createPrimitive = true;
    }

    getAttribute(name) {
        return this[name];
    }

    update(context, frameState, commandList){
        if (!Cesium.defined(this.ellipsoid)) {
            throw new Cesium.DeveloperError('this.ellipsoid must be defined.');
        }

        if (!Cesium.defined(this.appearance)) {
            throw new Cesium.DeveloperError('this.material must be defined.');
        }

        if (this.granularity < 0.0) {
            throw new Cesium.DeveloperError('this.granularity and scene2D/scene3D overrides must be greater than zero.');
        }

        if (!this.show) {
            return;
        }

        if (!this._createPrimitive && (!Cesium.defined(this._primitive))) {
            // No positions/hierarchy to draw
            return;
        }

        if (this._createPrimitive ||
            (this._ellipsoid !== this.ellipsoid) ||
            (this._granularity !== this.granularity) ||
            (this._height !== this.height) ||
            (this._textureRotationAngle !== this.textureRotationAngle) ||
            (this._id !== this.id)) {

            var geometry = this.getGeometry();
            if (!geometry) {
                return;
            }

            this._createPrimitive = false;
            this._ellipsoid = this.ellipsoid;
            this._granularity = this.granularity;
            this._height = this.height;
            this._textureRotationAngle = this.textureRotationAngle;
            this._id = this.id;

            this._primitive = this._primitive && this._primitive.destroy();
            var me = this;
            this._primitive = new Cesium.Primitive({
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: geometry,
                    id: this.id,
                    pickPrimitive: this
                }),
                appearance: this.appearance,
                asynchronous: this.asynchronous
            });
            // this._primitive = new Cesium.GroundPrimitive({
            //     geometryInstances: new Cesium.GeometryInstance({
            //         geometry: geometry,
            //         id: me.id,
            //         pickPrimitive: me
            //     }),
            //     attributes: {
            //         // color :  Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.BLUE.withAlpha(0.5))
            //         color: Cesium.ColorGeometryInstanceAttribute.fromColor(this.strokeColor)
            //     }
            // });

            this._outlinePolygon = this._outlinePolygon && this._outlinePolygon.destroy();
            if (this.strokeColor && this.getOutlineGeometry) {
                // create the highlighting frame
                this._outlinePolygon = new Cesium.Primitive({
                    geometryInstances: new Cesium.GeometryInstance({
                        geometry: this.getOutlineGeometry(),
                        attributes: {
                            color: Cesium.ColorGeometryInstanceAttribute.fromColor(this.strokeColor)
                        }
                    }),
                    appearance: new Cesium.PerInstanceColorAppearance({
                        flat: true,
                        renderState: {
                            depthTest: {
                                enabled: true
                            },
                            lineWidth: Math.min(this.strokeWidth || 4.0)
                        }
                    })
                });
            }
        }

        var primitive = this._primitive;
        // primitive.appearance.material = this.material;
        // primitive.appearance = this.appearance;
        primitive.appearance.material = this.material;
        // primitive.debugShowBoundingVolume = this.debugShowBoundingVolume;
        primitive.update(context, frameState, commandList);
        //debug
        // console.log(context)
        // console.log(frameState)
        // console.log(commandList)
        this._outlinePolygon && this._outlinePolygon.update(context, frameState, commandList);
    }

    isDestroyed(){
        return false;
    }

    destroy(){
        this._primitive = this._primitive && this._primitive.destroy();
        return Cesium.destroyObject(this);
    }

    setStrokeStyle(strokeColor, strokeWidth){
        if (!this.strokeColor || !this.strokeColor.equals(strokeColor) || this.strokeWidth != strokeWidth) {
            this._createPrimitive = true;
            this.strokeColor = strokeColor;
            this.strokeWidth = strokeWidth;
        }
    }

    /**
     * 子类重写 返回边框
     */
    getOutlineGeometry(){
        return null;
    }

    /**
     * 子类重写 返回实体
     */
    getGeometry(){
        return null;
    }

    /**
     * 子类重写
     */
    setEditable(){

    }


}
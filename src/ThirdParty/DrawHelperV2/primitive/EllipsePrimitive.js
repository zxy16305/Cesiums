import * as Cesium from "Cesium";
import {ChangeablePrimitive} from "./ChangeablePrimitive";
import {copyOptions} from "../util/util";
import {defaultEllipseOptions,ellipsoid} from "../constant/DefaultValue";
import {enhanceWithListeners} from "../util/EventHelper";

export class EllipsePrimitive extends ChangeablePrimitive {
    constructor(options,drawHelper) {
        super();

        if (!(Cesium.defined(options.center) && Cesium.defined(options.semiMajorAxis) && Cesium.defined(options.semiMinorAxis))) {
            throw new Cesium.DeveloperError('Center and semi major and semi minor axis are required');
        }
        this._drawHelper = drawHelper;

        options = copyOptions(options, defaultEllipseOptions);

        this.initialiseOptions(options);
        drawHelper.registerEditableShape(this);
        enhanceWithListeners(this);

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

    setEditMode(editMode = true){
        // if no change
        if (this._editMode == editMode) {
            return;
        }
        var drawHelper = this._drawHelper;
        var scene = drawHelper.scene;
        var ellipse = this;
        const getMarkerPositions = ()=>{
            return Cesium.Shapes.computeEllipseBoundary(ellipsoid, this.getCenter(), this.getSemiMajorAxis(), this.getSemiMinorAxis(), this.getRotation() + Math.PI / 2, Math.PI / 2.0).splice(0, 4);
        }

        const onEdited = ()=>{
            this.executeListeners({
                name: 'onEdited',
                center: this.getCenter(),
                semiMajorAxis: this.getSemiMajorAxis(),
                semiMinorAxis: this.getSemiMinorAxis(),
                rotation: 0
            });
        }

        drawHelper.disableAllHighlights();
        // display markers
        if (editMode) {
            // make sure all other shapes are not in edit mode before starting the editing of this shape
            drawHelper.setEdited(this);
            var _self = this;
            // create the markers and handlers for the editing
            if (this._markers == null) {
                var thisDragBillboard = this.dragBillboard? this.dragBillboard: dragBillboard;

                var markers = new _.BillboardGroup(drawHelper,thisDragBillboard );

                var handleMarkerChanges = {
                    dragHandlers: {
                        onDrag: function (index, position) {
                            var distance = Cesium.Cartesian3.distance(ellipse.getCenter(), position);
                            if (index % 2 == 0) {
                                ellipse.setSemiMajorAxis(distance);
                            } else {
                                ellipse.setSemiMinorAxis(distance);
                            }
                            markers.updateBillboardsPositions(getMarkerPositions());
                        },
                        onDragEnd: function (index, position) {
                            onEdited();
                        }
                    },
                    tooltip: function () {
                        return "Drag to change the excentricity and radius";
                    }
                };
                markers.addBillboards(getMarkerPositions(), handleMarkerChanges);
                this._markers = markers;
                // add a handler for clicking in the globe
                this._globeClickhandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
                this._globeClickhandler.setInputAction(
                    function (movement) {
                        var pickedObject = scene.pick(movement.position);
                        if (!(pickedObject && pickedObject.primitive)) {
                            _self.setEditMode(false);
                        }
                    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                // set on top of the polygon
                markers.setOnTop();
            }
            this._editMode = true;
        } else {
            if (this._markers != null) {
                this._markers.remove();
                this._markers = null;
                this._globeClickhandler.destroy();
            }
            this._editMode = false;
        }
    }
}
import * as Cesium from "Cesium";
import {ChangeablePrimitive} from "./ChangeablePrimitive";
import {copyOptions} from "../util/util";
import {defaultSurfaceOptions, dragBillboard,ellipsoid} from "../constant/DefaultValue";
import {enhanceWithListeners} from "../util/EventHelper";
import {EventSystemInstance} from "../../..";
import {BillboardGroup} from "./BillboardGroup";


export class CirclePrimitive extends ChangeablePrimitive {
    constructor(options, drawHelper) {
        super();
        this._drawHelper = drawHelper;

        if (!(Cesium.defined(options.center) && Cesium.defined(options.radius))) {
            throw new Cesium.DeveloperError('Center and radius are required');
        }

        options = copyOptions(options, defaultSurfaceOptions);

        this.initialiseOptions(options);

        this.setRadius(options.radius);
        drawHelper.registerEditableShape(this);
        enhanceWithListeners(this);
        let eventsystem = EventSystemInstance.getInstance();
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

    setEditMode(editMode = true) {
        var drawHelper = this._drawHelper;
        var circle = this;
        var scene = drawHelper._scene;

        const getMarkerPositions = () => {
            return this.getCircleCartesianCoordinates(Cesium.Math.PI_OVER_TWO);
        }

        const onEdited = () => {
            this.executeListeners({
                name: 'onEdited',
                center: this.getCenter(),
                radius: this.getRadius()
            });
        }

        if (this._editMode == editMode) {
            return;
        }

        drawHelper.disableAllHighlights();
        // display markers
        if (editMode) {
            // make sure all other shapes are not in edit mode before starting the editing of this shape
            drawHelper.setEdited(this);
            var _self = this;
            // create the markers and handlers for the editing
            if (this._markers == null) {
                var thisDragBillboard = this.dragBillboard ? this.dragBillboard : dragBillboard;

                var markers = new BillboardGroup(drawHelper, thisDragBillboard);

                var handleMarkerChanges = {
                    dragHandlers: {
                        onDrag: function (index, position) {
                            circle.setRadius(Cesium.Cartesian3.distance(circle.getCenter(), position));
                            markers.updateBillboardsPositions(getMarkerPositions());
                        },
                        onDragEnd: function (index, position) {
                            onEdited();
                        }
                    },
                    tooltip: function () {
                        return "Drag to change the radius";
                    }
                };
                markers.addBillboards(getMarkerPositions(), handleMarkerChanges);
                this._markers = markers;
                // add a handler for clicking in the globe
                this._globeClickhandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
                this._globeClickhandler.setInputAction((movement) =>{
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

    getCircleCartesianCoordinates(granularity) {
        var geometry = Cesium.CircleOutlineGeometry.createGeometry(new Cesium.CircleOutlineGeometry({
            ellipsoid: ellipsoid,
            center: this.getCenter(),
            radius: this.getRadius(),
            granularity: granularity
        }));
        var count = 0, value, values = [];
        for (; count < geometry.attributes.position.values.length; count += 3) {
            value = geometry.attributes.position.values;
            values.push(new Cesium.Cartesian3(value[count], value[count + 1], value[count + 2]));
        }
        return values;
    }

}
import {ChangeablePrimitive} from "./ChangeablePrimitive";
import * as Cesium from "Cesium";
import {copyOptions} from "../util/util";
import {defaultSurfaceOptions, dragBillboard,ellipsoid} from "../constant/DefaultValue";
import {getExtent, getExtentCorners} from "../util/constructHelper";
import {enhanceWithListeners} from "../util/EventHelper";
import {BillboardGroup} from "./BillboardGroup";

export class ExtentPrimitive extends ChangeablePrimitive {
    constructor(options,drawHelper) {
        super();
        if (!Cesium.defined(options.extent)) {
            throw new Cesium.DeveloperError('Extent is required');
        }

        this._drawHelper = drawHelper;

        options = copyOptions(options, defaultSurfaceOptions);

        this.initialiseOptions(options);

        this.setExtent(options.extent);
        drawHelper.registerEditableShape(this);
        enhanceWithListeners(this);
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

    setEditMode(editMode = true){
        // if no change
        if (this._editMode == editMode) {
            return;
        }

        const onEdited = ()=>{ this.executeListeners({name: 'onEdited', extent: this.extent});}
        const extent = this;
        var drawHelper = this._drawHelper;
        drawHelper.disableAllHighlights();
        // display markers
        if (editMode) {
            // make sure all other shapes are not in edit mode before starting the editing of this shape
            drawHelper.setEdited(this);
            // create the markers and handlers for the editing
            if (this._markers == null) {
                var thisDragBillboard = this.dragBillboard? this.dragBillboard: dragBillboard;
                var thisDragHalfBillboard = this.dragHalfBillboard? this.dragHalfBillboard: dragBillboard;

                var markers = new BillboardGroup(drawHelper,thisDragHalfBillboard);

                var handleMarkerChanges = {
                    dragHandlers: {
                        onDrag: function (index, position) {
                            var corner = markers.getBillboard((index + 2) % 4).position;
                            extent.setExtent(getExtent(ellipsoid.cartesianToCartographic(corner), ellipsoid.cartesianToCartographic(position)));
                            markers.updateBillboardsPositions(getExtentCorners(extent.extent));
                        },
                        onDragEnd: function (index, position) {
                            onEdited();
                        }
                    },
                    tooltip: function () {
                        return "Drag to change the corners of this extent";
                    }
                };
                markers.addBillboards(getExtentCorners(extent.extent), handleMarkerChanges);
                this._markers = markers;
                // add a handler for clicking in the globe
                this._globeClickhandler = new Cesium.ScreenSpaceEventHandler(drawHelper._scene.canvas);

                this._globeClickhandler.setInputAction((movement) =>{
                        var pickedObject = drawHelper._scene.pick(movement.position);
                        // disable edit if pickedobject is different or not an object
                        try {
                            if (!(pickedObject && !pickedObject.isDestroyed() && pickedObject.primitive)) {
                                this.setEditMode(false);
                            }
                        } catch (e) {
                            this.setEditMode(false);
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
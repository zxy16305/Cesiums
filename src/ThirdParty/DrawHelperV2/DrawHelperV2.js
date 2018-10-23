/**
 * 使用es6的方式 ，重新组织drawHelper
 */
import * as Cesium from "Cesium";
import {BillboardGroup} from "./primitive/BillboardGroup";
import {Tooltip} from "./widget/Tooltip";
import {enhanceWithListeners, setListener} from "./util/EventHelper";
import {CirclePrimitive} from "./primitive/CirclePrimitive";
import {EditableBillboard} from "./primitive/EditableBillboard";
import {EllipsePrimitive} from "./primitive/EllipsePrimitive";
import {ExtentPrimitive} from "./primitive/ExtentPrimitive";
import {PolygonPrimitive} from "./primitive/PolygonPrimitive";
import {PolylinePrimitive} from "./primitive/PolylinePrimitive";

//todo 用EventSystem接管drawHelper的事件
export class DrawHelper {
    constructor(viewer) {
        this._viewer = viewer;
        this._scene = viewer.scene;
        this._tooltip = new Tooltip(viewer.container);
        this._surfaces = [];
        //适配
        (Cesium.defined(Cesium.ContextLimits)) && (
            Cesium.ContextLimits._maximumAliasedLineWidth = 10);

        // this.initialiseHandlers();
        //
        // this.enhancePrimitives();
        enhanceWithListeners(this);
    }


    startDrawing(cleanUp) {
        // undo any current edit of shapes
        this.disableAllEditMode();
        // check for cleanUp first
        if (this.editCleanUp) {
            this.editCleanUp();
        }
        this.editCleanUp = cleanUp;
        this.muteHandlers(true);
    }

    stopDrawing() {
        // check for cleanUp first
        if (this.editCleanUp) {
            this.editCleanUp();
            this.editCleanUp = null;
        }
        this.muteHandlers(false);
    }

    muteHandlers(muted) {
        this._handlersMuted = muted;
    }

    // make sure only one shape is highlighted at a time
    disableAllHighlights() {
        this.setHighlighted(undefined);
    }

    setHighlighted(surface) {
        if (this._highlightedSurface && !this._highlightedSurface.isDestroyed() && this._highlightedSurface != surface) {
            this._highlightedSurface.setHighlighted(false);
        }
        this._highlightedSurface = surface;
    }

    disableAllEditMode() {
        this.setEdited(undefined);
    }

    setEdited(surface) {
        if (this._editedSurface && !this._editedSurface.isDestroyed()) {
            this._editedSurface.setEditMode(false);
        }
        this._editedSurface = surface;
    }


    createBillboardGroup(points, options, callbacks) {
        var markers = new BillboardGroup(this, options);
        markers.addBillboards(points, callbacks);
        return markers;
    }

    startDrawingMarker(options) {

    }

    startDrawingPolygon(options) {

    }

    startDrawingPolyline(options) {

    }

    startDrawingPolyshape(options) {

    }

    startDrawingExtent(options) {

    }

    startDrawingCircle(options) {

    }

    enhancePrimitives() {

    }


    createEditableCirclePrimitive(options) {
        return new CirclePrimitive(options, this);
    }

    createEditableBillboard(options) {
        return new EditableBillboard(options, this.viewer);
    }

    createEditableEllipsePrimitive(options) {
        return new EllipsePrimitive(options, this);
    }

    createEditableExtentPrimitive(options) {
        return new ExtentPrimitive(options, this);
    }

    createEditablePolygonPrimitive(options) {
        return new PolygonPrimitive(options, this);
    }

    createEditablePolylinePrimitive(options) {
        return new PolylinePrimitive(options, this);
    }

    /**
     * 绑定触发编辑的点击事件
     * @param surface
     */
    registerEditableShape(surface){
        setListener(surface, 'mouseMove', function (position) {
            surface.setHighlighted(true);
            if (!surface._editMode) {
                this._tooltip.showAt(position, "Click to edit this shape");
            }
        });
        // hide the highlighting when mouse is leaving the polygon
        setListener(surface, 'mouseOut', function (position) {
            surface.setHighlighted(false);
            this._tooltip.setVisible(false);
        });
        setListener(surface, 'leftClick', function (position) {
            surface.setEditMode(true);
        });
    }


    get viewer() {
        return this._viewer;
    }

    set viewer(value) {
        this._viewer = value;
    }

    get scene() {
        return this._scene;
    }

    set scene(value) {
        this._scene = value;
    }

    get tooltip() {
        return this._tooltip;
    }

    set tooltip(value) {
        this._tooltip = value;
    }

    get surfaces() {
        return this._surfaces;
    }

    set surfaces(value) {
        this._surfaces = value;
    }
}
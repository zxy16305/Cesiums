/**
 * 使用es6的方式 ，重新组织drawHelper
 */
import * as Cesium from "Cesium";
import {BillboardGroup} from "./primitive/BillboardGroup";
import {Tooltip} from "./widget/Tooltip";
import {enhanceWithListeners} from "./util/EventHelper";

//todo 用EventSystem接管drawHelper的事件
export class DrawHelper {
    constructor(viewer){
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

    startDrawingMarker(options){

    }

    startDrawingPolygon(options){

    }

    startDrawingPolyline(options){

    }

    startDrawingPolyshape(options){

    }

    startDrawingExtent(options){

    }

    startDrawingCircle(options){

    }

    enhancePrimitives(){

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
// import * as Cesium from "Cesium";

import {BaseHandler} from "./BaseHandler";
import {copyOptions} from "../util/util";
import {defaultBillboard, defaultSurfaceOptions,ellipsoid} from "../constant/DefaultValue";
import {BillboardGroup} from "../primitive/BillboardGroup";
import {getExtent, getExtentCorners} from "../util/constructHelper";

export class ExtentHandler extends BaseHandler {
    start(options, drawHelper) {
        this.drawHelper = drawHelper;
        this.options = copyOptions(options, defaultSurfaceOptions);

        let scene = drawHelper.scene;
        let viewer = drawHelper.viewer;
        this.primitives = drawHelper.scene.primitives;
        let tooltip = drawHelper.tooltip;

        let firstPoint = null;
        this.extent = null;
        this.markers = null;

        let mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        drawHelper.startDrawing(() => {
                if (this.extent != null) {
                    this.primitives && this.primitives.remove(this.extent);
                }
                this.markers && this.markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        // Now wait for start
        mouseHandler.setInputAction( (movement) =>{
            if (movement.position != null) {
                // var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
                let cartesian = options.strategy.pickStrategy(movement.position, viewer);

                if (cartesian) {
                    if (this.extent == null) {
                        // create the rectangle
                        firstPoint = ellipsoid.cartesianToCartographic(cartesian);
                        let value = getExtent(firstPoint, firstPoint);
                        this.updateExtent(value);
                    } else {
                        drawHelper.stopDrawing();
                        if (typeof options.callback == 'function') {
                            options.callback(getExtent(firstPoint, ellipsoid.cartesianToCartographic(cartesian), drawHelper));
                        }
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        mouseHandler.setInputAction( (movement)=> {
            let position = movement.endPosition;
            if (position != null) {
                if (this.extent == null) {
                    tooltip.showAt(position, "<p>Click to start drawing rectangle</p>");
                } else {
                    // var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                    let cartesian = options.strategy.pickStrategy(position, viewer);

                    if (cartesian) {
                        let extent = getExtent(firstPoint, ellipsoid.cartesianToCartographic(cartesian));
                        this.updateExtent(extent);
                        tooltip.showAt(position, "<p>Drag to change rectangle extent</p><p>Click again to finish drawing</p>");
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    }

    updateExtent(value) {
        if (this.extent == null) {
            this.extent = this.drawHelper.createEditableExtentPrimitive({
                extent: value,
                material: this.options.material,
            })
            this.extent.asynchronous = false;
            this.primitives.add(this.extent);
        }
        this.extent.setExtent(value);
        this.extent.rectangle = value;
        // update the markers
        let corners = getExtentCorners(value);
        // create if they do not yet exist
        if (this.markers == null) {
            this.markers = new BillboardGroup(this.drawHelper, defaultBillboard);
            this.markers.addBillboards(corners);
        } else {
            this.markers.updateBillboardsPositions(corners);
        }
    }
}
// import * as Cesium from "Cesium";

import {BaseHandler} from "./BaseHandler";
import {defaultBillboard, defaultPolylineOptions, defaultSurfaceOptions} from "../constant/DefaultValue";
import {copyOptions} from "../util/util";
import {PolygonPrimitive} from "../primitive/PolygonPrimitive";
import {PolylinePrimitive} from "../primitive/PolylinePrimitive";
import {BillboardGroup} from "../primitive/BillboardGroup";
import {getCesiumHightZero} from "../util/constructHelper";

export class PolyshapeHandler extends BaseHandler {
    start(options, drawHelper, isPolygon) {
        options = isPolygon ? copyOptions(options, defaultSurfaceOptions) : copyOptions(options, defaultPolylineOptions);
        let scene = drawHelper.scene;
        let viewer = drawHelper.viewer;
        let primitives = scene.primitives;
        let tooltip = drawHelper.tooltip;
        let mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        drawHelper.startDrawing(() => {
                primitives && primitives.remove(poly);
                markers && markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        let minPoints = isPolygon ? 3 : 2;
        let poly;
        if (isPolygon) {
            // poly = new PolygonPrimitive(options);
            poly = drawHelper.createEditablePolygonPrimitive(options)
        } else {
            // poly = new PolylinePrimitive(options);
            poly = drawHelper.createEditablePolylinePrimitive(options)
        }

        poly.asynchronous = false;
        primitives.add(poly);

        let positions = [];
        let markers = new BillboardGroup(drawHelper, defaultBillboard);


        mouseHandler.setInputAction((movement) => {

            let position = movement.position;
            if (position != null) {
                if (positions.length < minPoints /*+ 2*/) {
                    return;
                } else {
                    // var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                    let cartesian = options.strategy.pickStrategy(movement.position, viewer);

                    if (cartesian) {
                        drawHelper.stopDrawing();
                        if (typeof options.callback == 'function') {
                            // remove overlapping ones
                            let index = positions.length - 1;
                            options.callback(positions, drawHelper);
                        }
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        // Now wait for start
        mouseHandler.setInputAction((movement) => {

            let cartesian = options.strategy.pickStrategy(movement.position, viewer);
            cartesian = getCesiumHightZero(cartesian);

            if (movement.position != null) {
                // var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);

                if (cartesian) {
                    // first click
                    if (positions.length == 0) {
                        positions.push(cartesian.clone());
                        markers.addBillboard(positions[0]);
                    }
                    if (positions.length >= minPoints) {
                        poly.positions = positions;
                        poly._createPrimitive = true;
                    }
                    // add new point to polygon
                    // this one will move with the mouse
                    positions.push(cartesian);
                    // add marker at the new position
                    markers.addBillboard(cartesian);
                }
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        mouseHandler.setInputAction((movement) => {
            let position = movement.endPosition;
            if (position != null) {
                if (positions.length == 0) {
                    tooltip.showAt(position, "<p>Click to add first point</p>");
                } else {
                    // var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                    // var cartesian = scene.pickPosition(position);
                    // cartesian = getCesiumHightZero(cartesian);
                    let cartesian = options.strategy.pickStrategy(position, viewer);

                    if (cartesian) {
                        positions.pop();
                        // make sure it is slightly different
                        // cartesian.y += (1 + Math.random());
                        cartesian.y += Cesium.Math.EPSILON7;
                        positions.push(cartesian);
                        if (positions.length >= minPoints) {
                            poly.positions = positions;
                            poly._createPrimitive = true;
                        }
                        // update marker
                        markers.getBillboard(positions.length - 1).position = cartesian;
                        // show tooltip
                        tooltip.showAt(position, "<p>Click to add new point (" + positions.length + ")</p>" + (positions.length > minPoints ? "<p>Double click to finish drawing</p>" : ""));
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }


}

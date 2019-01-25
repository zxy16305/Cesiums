// import * as Cesium from "Cesium";
import {BaseHandler} from "./BaseHandler";
import {copyOptions} from "../util/util";
import {defaultBillboard, defaultSurfaceOptions} from "../constant/DefaultValue";
import {CirclePrimitive} from "../primitive/CirclePrimitive";
import {BillboardGroup} from "../primitive/BillboardGroup";
import {getCesiumHightZero} from "../util/constructHelper";

export class CircleHandler extends BaseHandler {
    start(options, drawHelper) {
        options = copyOptions(options, defaultSurfaceOptions);
        let mouseHandler = new Cesium.ScreenSpaceEventHandler(drawHelper.scene.canvas);

        let circle = null;
        let markers = null;
        let scene = drawHelper.scene;
        let viewer = drawHelper.viewer;
        let primitives = drawHelper.scene.primitives;
        let tooltip = drawHelper.tooltip;

        drawHelper.startDrawing(() => {
            if (circle != null) {
                primitives && primitives.remove(circle);
            }
            markers && markers.remove();
            mouseHandler && mouseHandler.destroy();
            tooltip && tooltip.setVisible(false);
        })


        mouseHandler.setInputAction((movement) => {
            if (movement.position != null) {
                // var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
                // var cartesian = scene.pickPosition(movement.position);
                // cartesian = getCesiumHightZero(cartesian);
                // var cartesian = pickPosition(movement.position);
                var cartesian = options.strategy.pickStrategy(movement.position, viewer);
                if (cartesian) {
                    if (circle == null) {
                        // create the circle
                        // circle = new CirclePrimitive({
                        //     center: cartesian,
                        //     radius: 0,
                        //     asynchronous: false,
                        //     material: options.material
                        // });
                        circle = drawHelper.createEditableCirclePrimitive({
                            center: cartesian,
                            radius: 0,
                            asynchronous: false,
                            material: options.material
                        })
                        primitives.add(circle);
                        markers = new BillboardGroup(drawHelper, defaultBillboard);
                        markers.addBillboards([cartesian]);
                    } else {
                        if (typeof options.callback == 'function') {
                            options.callback(circle.getCenter(), circle.getRadius(), drawHelper);
                        }
                        drawHelper.stopDrawing();
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        mouseHandler.setInputAction((movement) => {
            var position = movement.endPosition;
            if (position != null) {
                if (circle == null) {
                    tooltip.showAt(position, "<p>Click to start drawing the circle</p>");
                } else {
                    // var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                    // var cartesian = scene.pickPosition(position);
                    var cartesian = options.strategy.pickStrategy(position, viewer);

                    if (cartesian) {
                        // Cesium.Cartographic.fromCartesian(circle.getCenter())
                        circle.setRadius(Cesium.Cartesian3.distance(getCesiumHightZero(circle.getCenter()), getCesiumHightZero(cartesian)));
                        // circle.setRadius(Cesium.Cartesian3.distance(circle.getCenter(), cartesian));
                        markers.updateBillboardsPositions(cartesian);
                        tooltip.showAt(position, "<p>Move mouse to change circle radius</p><p>Click again to finish drawing</p>");
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    }
}

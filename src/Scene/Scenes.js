// import * as Cesium from "Cesium";

import {Cameras} from "./Cameras";
import {customPickStrategy} from "../Util/InnerUtils";
import {defined} from "../Util/NormalUtils";
import {EventSystemFactory} from "../Core/EventSystemV2";

let lastPickObject = null;

export class Scenes {
    static pick(scene, position, fix, fix2) {
        if (lastPickObject)
            return lastPickObject;

        lastPickObject = scene.pick(position, fix, fix2);
        setTimeout(() => {
            lastPickObject = null;
        }, 100)
        return lastPickObject;
    }

    static commonPick(position, scene, back = 0) {
        return customPickStrategy(position, scene, back);
    }

    static commonPickV2(position, viewer, back = 0) {
        let eventSystem = EventSystemFactory.createEventSystem(viewer);
        let scene = viewer.scene;
        let positionReturn = {};
        if (Cesium.defined(eventSystem._pickthrottle.pick(position)) && scene.pickPositionSupported) {
            positionReturn = scene.pickPosition(position);
        } else {
            let pickEllipsoid = scene.camera.pickEllipsoid(position);
            if (!defined(pickEllipsoid)) return;
            var fromCartesian = Cesium.Cartographic.fromCartesian(pickEllipsoid);
            positionReturn = Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
        }

        if (back !== 0) positionReturn = Cameras.getPositionAwayByCamara(scene.camera, positionReturn, back);
        return positionReturn;
    }

    static commonPickFilter(position, viewer, filter = (pickObject) => true, back = 0) {
        let eventSystem = EventSystemFactory.createEventSystem(viewer);
        let scene = viewer.scene;
        let positionReturn = {};
        if ((scene.pickPositionSupported) && eventSystem._drillPickThrottle.pick(position).filter(filter).length > 0) {
            //drillpick 与 pickPosition遇到的问题
            scene.render();
            positionReturn = scene.pickPosition(position);
        } else {
            let pickEllipsoid = scene.camera.pickEllipsoid(position);
            if (!defined(pickEllipsoid)) return;
            var fromCartesian = Cesium.Cartographic.fromCartesian(pickEllipsoid);
            positionReturn = Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
        }
        if (back !== 0) positionReturn = Cameras.getPositionAwayByCamara(scene.camera, positionReturn, back);
        return positionReturn;
    }

}

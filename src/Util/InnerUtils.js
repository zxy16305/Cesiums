import {Cameras} from "../Scene/Cameras";
import * as lodash from "../ThirdParty/lodash.min"
import {defined} from "./NormalUtils";

export const customPickStrategy = (position, scene, back = 0) => {
    let positionReturn = {};
    if (/*Cesium.defined(scene.pick(position)) && */scene.pickPositionSupported) {
        positionReturn = scene.pickPosition(position);
        // var fromCartesian = Cesium.Cartographic.fromCartesian(viewer.scene.pickPosition(position));
        // return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
    } else {
        let pickEllipsoid = scene.camera.pickEllipsoid(position);
        if (!defined(pickEllipsoid)) return;
        var fromCartesian = Cesium.Cartographic.fromCartesian(pickEllipsoid);
        positionReturn = Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
    }

    if (back !== 0) positionReturn = Cameras.getPositionAwayByCamara(scene.camera, positionReturn, back);
    return positionReturn;
}


export const Pickthrottle = class {
    constructor(scene, pickTimeout = 100) {
        this.lastPick = null;
        this.lastTime = new Date();
        this.scene = scene;
        this.pickTimeout = pickTimeout;
    }

    pick(position, accuracy) {
        let time = new Date();
        if (this.lastPick === null || time.getTime() - this.lastTime.getTime() > this.pickTimeout) {
            this.lastTime = time;
            this.lastPick = this.scene.pick(position, accuracy, accuracy);
        }
        if (defined(this.lastPick))
            return lodash.merge({}, this.lastPick);
    }
}


export const  DrillPickThrottle = class  {
    constructor(scene, pickTimeout = 100) {
        this.lastPicks = null;
        this.lastTime = new Date();
        this.scene = scene;
        this.pickTimeout = pickTimeout;
    }

    pick(position, accuracy) {
        let time = new Date();
        if (this.lastPicks === null || time.getTime() - this.lastTime.getTime() > this.pickTimeout) {
            this.lastTime = time;
            this.lastPicks = Object.values(this.scene.drillPick(position, accuracy, accuracy));
        }
        if (defined(this.lastPicks))
            return lodash.merge([], this.lastPicks);
    }
}

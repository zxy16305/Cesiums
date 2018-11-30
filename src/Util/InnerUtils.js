import {Cameras} from "..";

export const customPickStrategy =  (position, scene,back=0)=> {
    let positionReturn = {};
    if (Cesium.defined(scene.pick(position)) && scene.pickPositionSupported) {
        positionReturn = scene.pickPosition(position);
        // var fromCartesian = Cesium.Cartographic.fromCartesian(viewer.scene.pickPosition(position));
        // return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
    } else {
        var fromCartesian = Cesium.Cartographic.fromCartesian(scene.camera.pickEllipsoid(position));
        positionReturn = Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
    }

    if (back !== 0) positionReturn = Cameras.getPositionAwayByCamara(scene.camera, positionReturn, back);
    return positionReturn;
}

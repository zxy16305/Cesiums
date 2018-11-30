export class Debugs {

    static positionPick(viewer) {
        let eventHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
        let scene = viewer.scene;

        eventHandler.setInputAction(function (event) {
            let position = event.position;
            if (Cesium.defined(scene.pick(position)) && scene.pickPositionSupported) {
                var positionReturn = scene.pickPosition(position);

                console.log(["pick at model",Cesium.Cartographic.fromCartesian(positionReturn)])
            }

            var fromCartesian = Cesium.Cartographic.fromCartesian(scene.camera.pickEllipsoid(position));
            positionReturn = Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
            console.log(['pick at ellipsoid',positionReturn]);


        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


        return {
            destroy() {
                eventHandler.destroy();
            }
        }
    }

}

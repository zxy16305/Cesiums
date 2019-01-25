// import * as Cesium from "Cesium";

/**
 * 记录一些常用的设置
 */
export class Settings {
    /**
     * 清除默认的双击事件
     * @param viewer
     */
    static cancelDefaultDbLeftClick(viewer) {
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    }

    static enableRotation(viewer, enable = true) {
        viewer.scene.screenSpaceCameraController.enableRotate = enable;
    }

    static setBaseMap(viewer, url = "http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}", replace = true) {
        let mapProvider = new Cesium.UrlTemplateImageryProvider({
            url: url,
            //credit: credit,
            subdomains: ["mt0", "mt1", "mt2", "mt3"]
        });
        let mapLayer = new Cesium.ImageryLayer(mapProvider, Cesium.defaultValue(true, {}));
        if (replace) viewer.scene.imageryLayers.removeAll(false);
        viewer.scene.imageryLayers.add(mapLayer);
    }

    static cancelErrorPanel(callback = (title,content,error,originalFunction) => {
    }) {
        let originalFunction =  Cesium.CesiumWidget.prototype.showErrorPanel;
        Cesium.CesiumWidget.prototype.showErrorPanel = function(title,content,error){
            // console.log(title,content,error)
            callback(title,content,error,originalFunction)
        }
    }
}

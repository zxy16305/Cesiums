import * as Cesium from "Cesium";

/**
 * 记录一些常用的设置
 */
export class Settings {
    /**
     * 清除默认的双击事件
     * @param viewer
     */
    static cancelDefaultDbLeftClick(viewer){
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    }

    static cancelTilt(viewer){
        viewer.scene.screenSpaceCameraController.enableTilt = false;
    }

    static cancelRotate(viewer){
        viewer.scene.screenSpaceCameraController.enableRotate = false;
    }
}
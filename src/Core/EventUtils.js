export class EventUtils {
    /**
     * 只运行一次的点击事件
     * @param viewer
     * @param onClick
     * @param onFinished
     * @returns {Function} 用于取消事件
     */
    static addOnceClick(viewer, onClick = () => {},onFinished = ()=>{}) {
        let eventHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

        eventHandler.setInputAction((event) => {
            eventHandler && !eventHandler.isDestroyed() && eventHandler.destroy();
            onClick(event);
            onFinished()
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

        return ()=>{
            eventHandler && !eventHandler.isDestroyed() && eventHandler.destroy();
            onFinished();
        }
    }



}

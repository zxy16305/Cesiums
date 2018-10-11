import * as Cesium from "Cesium";

export class Cartesian3s {

    /**
     * 修正当前点位的高度
     * @param {Cesium.Cartesian3} cartesian3
     * @param {number} heightPlus - 修正高度，默认为5
     */
    static formatHeightPlus(cartesian3, heightPlus = 5) {
        let fromCartesian = Cesium.Cartographic.fromCartesian(cartesian3);
        return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, fromCartesian.height + heightPlus);
    }
}
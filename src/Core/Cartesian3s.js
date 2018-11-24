// import * as Cesium from "Cesium";

export class Cartesian3s {

    /**
     * 将地球坐标系基于WSG84椭球体转换成经纬度（弧度制）
     * @param {Cesium.Cartesian3} cartesian3
     * @returns {{height: *, latitude: *, longitude: *}}
     */
    static toRadians(cartesian3) {
        return Cesium.Cartographic.fromCartesian(cartesian3);
    }

    /**
     * 输出角度单位的经纬度
     * @param {Cesium.Cartesian3}  cartesian3
     * @returns {{height: *, latitude: *, longitude: *}}
     */
    static toDegrees(cartesian3) {
        let cartographic = Cartesian3s.toRadians(cartesian3);
        return {
            height: cartographic.height,
            latitude: Cesium.Math.toDegrees(cartographic.latitude),
            longitude: Cesium.Math.toDegrees(cartographic.longitude)
        };
    }

    /**
     * 修正当前点位的高度
     * @param {Cesium.Cartesian3} cartesian3
     * @param {number} heightPlus - 修正高度，默认为5
     */
    static formatHeightPlus(cartesian3, heightPlus = 5) {
        let fromCartesian = Cartesian3s.toRadians(cartesian3);
        return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, fromCartesian.height + heightPlus);
    }

    /**
     * 修正当前点位的高度到0
     * @param {Cesium.Cartesian3} cartesian3
     */
    static formatHeightZero(cartesian3) {
        let fromCartesian = Cartesian3s.toRadians(cartesian3);
        return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
    }

    static formatHeight(cartesian3, height) {
        let fromCartesian = Cartesian3s.toRadians(cartesian3);
        return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, height);
    }

    static getCenter(positions){
        let sum = new Cesium.Cartesian3();
        positions.forEach((position)=>{
            Cesium.Cartesian3.add(sum, position, sum)
        })
        return Cesium.Cartesian3.divideByScalar(sum,positions.length,sum);
    }
}
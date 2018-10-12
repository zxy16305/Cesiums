import * as Cesium from "Cesium";
import {computeCirclularAugle} from "../Util/OfficialUtils"
import {Cartesian3s} from "..";

export class Cameras {
    /**
     * 获取一个目标点位向摄像头方向移动distance米的点位
     * @param camera
     * @param position
     * @param distance
     * @returns {*}
     */
    static getPositionAwayByCamara(camera, position, distance) {
        let totalDistance = Cesium.Cartesian3.distance(camera.position, position, new Cesium.Cartesian3());
        let subtract = Cesium.Cartesian3.subtract(camera.position, position, new Cesium.Cartesian3());
        let add = Cesium.Cartesian3.multiplyByScalar(subtract, distance / totalDistance, new Cesium.Cartesian3());
        return Cesium.Cartesian3.add(position, add, new Cesium.Cartesian3())
    }

    /**
     *
     * @param camera
     * @param position 围绕的点位
     * @param radius 围绕的半径
     * @param second 转一圈的秒数
     * @param increment 绕圈精度
     * @param pitch 俯角
     */
    static flyAroundPosition(camera, position, radius, second = 20, increment = 0.1, pitch = -45) {
        let degrees = Cartesian3s.toDegrees(position);

        let angles = computeCirclularAugle(increment);
        let index = 0;
        let timeInterval = second * 1000 / angles.length;

        let interval = setInterval(() => {
            camera.lookAt(position,new Cesium.HeadingPitchRange( Cesium.Math.toRadians(angles[index]),  Cesium.Math.toRadians(pitch), radius) )
            camera.lookAtTransform(Cesium.Matrix4.IDENTITY);//勉强确保摄像头坐标系正确
            index = (++index) % angles.length;
        }, timeInterval);

        return ()=>{
            clearInterval(interval);
            camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        }
    }

}

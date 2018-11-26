// import * as Cesium from "Cesium";
import {computeCirclularAugle} from "../Util/OfficialUtils"
import {Cartesian3s} from "..";
import {defined} from "../Util/NormalUtils"

/**
 * @namespace Cameras
 */
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
        let angles = computeCirclularAugle(increment);
        let index = 0;
        let timeInterval = second * 1000 / angles.length;

        let interval = setInterval(() => {
            camera.lookAt(position, new Cesium.HeadingPitchRange(Cesium.Math.toRadians(angles[index]), Cesium.Math.toRadians(pitch), radius))
            camera.lookAtTransform(Cesium.Matrix4.IDENTITY);//勉强确保摄像头坐标系正确
            index = (++index) % angles.length;
        }, timeInterval);

        return () => {
            clearInterval(interval);
            camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        }
    }

    /**
     * 类似于Camera.lookAt
     * 第三个参数是 Cesium.HeadingPitchRange
     * @param camera
     * @param position 面向的点位
     * @param config 俯仰角配置
     * @param config.heading
     * @param config.pitch 俯仰角
     * @param config.range 距离
     * @param complete 飞行完成回调
     * @param cancel 飞行取消回调
     */
    static flyAt(camera, position, {
                     heading = 0,
                     pitch = 0,
                     range = 50,
                 } = {},
                 complete = () => {
                 },
                 cancel = () => {
                 }) {
        pitch = Cesium.Math.toRadians(pitch);
        heading = Cesium.Math.toRadians(heading);

        // let x = Math.sqrt(1 / (Math.pow(Math.tan(-pitch), 2) + 1) / (1 + Math.pow(Math.tan(-heading), 2)));
        // // let y = Math.sqrt(1 / (Math.pow(Math.tan(-pitch), 2) + 1) / (1 / (Math.pow(Math.tan(-heading), 2) + 1)));
        // let z = Math.sqrt(Math.pow(Math.tan(-pitch), 2) / (Math.pow(Math.tan(-pitch), 2) + 1));
        // let y = Math.sqrt(1 - Math.pow(x, 2) - (Math.pow(z, 2)));
        // let relativePosition = Cesium.Cartesian3.multiplyByScalar(new Cesium.Cartesian3(x, y, z), range, new Cesium.Cartesian3());

        let rotationTranslation = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromHeadingPitchRoll(new Cesium.HeadingPitchRoll(heading + Math.PI / 2, -pitch, 0)));
        let relativePosition = Cesium.Matrix4.multiplyByPoint(rotationTranslation, new Cesium.Cartesian3(range, 0, 0), new Cesium.Cartesian3());

        let earthTransform = Cesium.Transforms.eastNorthUpToFixedFrame(position, Cesium.Ellipsoid.WGS84, new Cesium.Matrix4());
        let cameraPosition = Cesium.Matrix4.multiplyByPoint(earthTransform, relativePosition, new Cesium.Cartesian3());

        camera.flyTo({
            destination: cameraPosition,
            orientation: {
                heading: heading,
                pitch: pitch,
                roll: 0.0
            },
            complete: complete,
            cancel: cancel
        });
    }

    /**
     *  保存当前摄像头的位置
     * @param camera
     * @returns {string} uri编码后的数据
     */
    static saveCameraStatus(camera) {
        let data = {
            position: camera.position,
            heading: camera.heading,
            pitch: camera.pitch,
            roll: camera.roll,
        };
        var dataCompress = [
            data.position.x.toFixed(2),
            data.position.y.toFixed(2),
            data.position.z.toFixed(2),
            data.heading.toFixed(2),
            data.pitch.toFixed(2),
            data.roll.toFixed(2)
        ]

        return encodeURIComponent(dataCompress.join(","));
    }

    /**
     * 加载
     * @param camera
     * @param data
     * @param isFly
     * @param errorCallback
     */
    static loadCameraStatus(camera, data, isFly = false, errorCallback = ()=>{ }) {
        try {
            let dataCompress = decodeURIComponent(data).split(",");

            if (defined(dataCompress) && dataCompress.length >= 6) {
                let target = {
                    destination: {
                        x: parseFloat(dataCompress[0]),
                        y: parseFloat(dataCompress[1]),
                        z: parseFloat(dataCompress[2])
                    },
                    orientation: {
                        heading: parseFloat(dataCompress[3]),
                        pitch: parseFloat(dataCompress[4]),
                        roll: parseFloat(dataCompress[5])
                    }
                };
                if (isFly) {
                    camera.flyTo(target);
                } else {
                    camera.setView(target);
                }
            } else throw "not define position| heading | pitch | roll";
        } catch (e) {
            console.error(e);
            if (typeof errorCallback === 'function') errorCallback(e);
        }
    }

}

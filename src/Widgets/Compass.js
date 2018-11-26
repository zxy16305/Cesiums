import {debugManager} from "../index";
import {defined} from "../Util/NormalUtils";

/**
 * 生成一个随着摄像头旋转的dom元素，默认使用有background的div实现，也可以自定义class样式
 *
 * @example
 *      let compassCallback = new Cesiums.CompassElementBuilder()
 *          .setCamera(viewer.camera)
 *          .setImageUrl("./images/compress.jpg")//相对于当前html的路径
 *          .setClassName("test")//自定义指南针样式
 *          .is3DMode(false)//3dmode下，pitch和roll也会旋转
 *          .build();
 *      document.body.appendChild(compassCallback.compass.element)
 *
 */
export class CompassElementBuilder {
    constructor() {
        this.time = 100;
        this.position = {
            x: 0, y: 0
        }
        this.mode3d = true;
    }

    /**
     *
     * @param {string} url - 图片相对于html的相对路径，也可以不设置这个，在  {@link CompassElementBuilder#setClassName} 里直接设置class
     * @returns {CompassElementBuilder}
     */
    setImageUrl(url) {
        this.imageUrl = url;
        return this;
    }

    /**
     *
     * @param {Cesium.Camera} camera
     * @returns {CompassElementBuilder}
     */
    setCamera(camera) {
        this.camera = camera;
        return this;
    }

    /**
     *
     * @param {string} className
     * @returns {CompassElementBuilder}
     */
    setClassName(className) {
        this.className = className;
        return this;
    }

    /**
     *
     * @param {{x: number,y:number}} param - 左上角坐标
     * @returns {CompassElementBuilder}
     */
    setPosition({x = 0, y = 0}) {
        this.position = {
            x, y
        }
        return this;
    }

    /**
     * 设定指南针刷新时间
     * @param {number} time
     * @returns {CompassElementBuilder}
     */
    setUpdateTime(time = 100) {
        this.time = time;
        return this;
    }

    /**
     * 设定指南针模式，2d模式下只会平面旋转
     * @param {boolean} mode3d
     * @returns {CompassElementBuilder}
     */
    is3DMode(mode3d = true) {
        this.mode3d = mode3d;
        return this;
    }

    /**
     *
     * @returns {{destory: function, compass: Compass}} - 返回对象
     */
    build() {
        let compass = new Compass(this.imageUrl);
        compass.element.style.left = this.position.x + "px";
        compass.element.style.top = this.position.y + "px";
        compass.element.className = this.className;
        let interval;

        if (this.mode3d) {
            interval = setInterval(() => {
                let beta = Cesium.Math.toDegrees(this.camera.pitch + Math.PI / 2);
                let gamma = Cesium.Math.toDegrees(this.camera.roll);
                let alpha = Cesium.Math.toDegrees(-this.camera.heading);
                // console.log(beta);
                if (beta > 45) beta = 45;
                if (gamma > 45) gamma = 45;
                debugManager.log({
                    gamma,
                    beta,
                    alpha
                });
                compass.element.style.webkitTransform = `rotateX(${beta}deg) rotateY(${gamma}deg) rotateZ(${alpha}deg)`;
                compass.element.style.transform = `rotateX(${beta}deg) rotateY(${gamma}deg) rotateZ(${alpha}deg)`;
                compass.element.style.mozTransform = `rotateX(${beta}deg) rotateY(${gamma}deg) rotateZ(${alpha}deg)`;
            }, this.time);
        } else {
            interval = setInterval(() => {
                let alpha = Cesium.Math.toDegrees(-this.camera.heading);

                compass.element.style.webkitTransform = `rotateZ(${alpha}deg)`;
                compass.element.style.transform = `rotateZ(${alpha}deg)`;
                compass.element.style.mozTransform = `rotateZ(${alpha}deg)`;

            }, this.time);
        }

        return {
            destory: () => {
                clearInterval(interval);
                try {
                    compass.element.parentNode.removeChild(compass.element);
                } catch (e) {
                    console.error(e)
                }
            },
            compass: compass
        }
    }
}

/**
 * 直接创建意义不大，使用 {@link CompassElementBuilder} 构造
 */
export class Compass {
    constructor(imageUrl) {
        let element = document.createElement("div");
        if(defined(imageUrl)){
            element.style.background = `url("${imageUrl}") no-repeat center`
            element.style.backgroundSize = `100px 100px `
        }
        element.style.position = "absolute";
        element.style.width = "100px";
        element.style.height = "100px";

        this.element = element;
    }
}

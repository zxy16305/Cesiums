import {debugManager} from "../index";

export class CompassElementBuilder {
    constructor() {
        this.time = 100;
        this.position = {
            x: 0, y: 0
        }
        this.mode3d = true;
    }

    setImageUrl(url) {
        this.imageUrl = url;
        return this;
    }

    setCamera(camera) {
        this.camera = camera;
        return this;
    }

    setClassName(className) {
        this.className = className;
        return this;
    }

    setPosition({x = 0, y = 0}) {
        this.position = {
            x, y
        }
        return this;
    }

    setUpdateTime(time = 100) {
        this.time = time;
        return this;
    }

    is3DMode(mode3d = true) {
        this.mode3d = mode3d;
        return this;
    }

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


export class Compass {
    constructor(imageUrl) {
        let element = document.createElement("div");
        element.style.background = `url("${imageUrl}") no-repeat center`
        element.style.backgroundSize = `100px 100px `
        element.style.position = "absolute";
        element.style.width = "100px";
        element.style.height = "100px";

        this.element = element;
    }
}

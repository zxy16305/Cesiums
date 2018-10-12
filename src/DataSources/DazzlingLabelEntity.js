import * as Cesium from "Cesium";
import {Cartesian3s} from "../Core/Cartesian3s";
import {eventSystem} from "../Core/EventSystem"
import {SimpleCosBuilder, SimpleSinBuilder} from "../Util/Math"
import {BaseEntity} from "./BaseEntity";
import {__dirpath} from "../index";

/**
 * 无法解决单个entity引用模型的问题
 */
export class DazzlingLabelEntity extends BaseEntity {
    /**
     *
     * @param {Cesium.Entity} entity
     * @param {Object} config
     */
    constructor(config) {
        // config.model = {
        //     name:"test12",
        //     uri:"./images/圆环.glb",
        //     scale: 200,
        //     color: Cesium.Color.GREEN,
        //     nodeTransformations: {
        //         test12:{
        //             translation: Cartesian3s.formatHeightPlus(config.position,5000)
        //         }
        //     }
        // }

        super(config)
        // let simpleSin = new SimpleSinBuilder().setPeriod(20).setAmplitude(1).setPhase(0).build();
        let simpleCos = new SimpleCosBuilder().setPeriod(5).setAmplitude(-0.5).setPhase(0).build();
        let startTime = Cesium.JulianDate.now();
        // this.ellipse = {
        //     semiMajorAxis: 1000,
        //     semiMinorAxis: 1000,
        //     height: new Cesium.CallbackProperty((time, result) => {
        //         if (this.onSelected) {
        //             return (0.5 + simpleCos.calc(Cesium.JulianDate.secondsDifference(Cesium.JulianDate.now(), startTime) % 5)) * Cartesian3s.toRadians(config.position).height;
        //         } else {
        //             return Cartesian3s.toRadians(config.position).height / 2;
        //         }
        //     }, false),
        //     // material:Cesium.Color.ALICEBLUE.withAlpha(0) ,
        //     // numberOfVerticalLines:100,
        //     fill: false,
        //     outline: true,
        //     outlineWidth: 100,
        //     outlineColor: Cesium.Color.RED,
        //     show: new Cesium.CallbackProperty((time, result) => {
        //         return this.onSelected;
        //     }, false),
        // }

        // this.polyline = {
        //     positions: [Cartesian3s.formatHeightZero(config.position), config.position],
        //     width: 5
        // }


        this.ringEntity = new Cesium.Entity({
            position: new Cesium.CallbackProperty((time, result) => {
                return Cartesian3s.formatHeight(config.position,
                 (0.5 + simpleCos.calc(Cesium.JulianDate.secondsDifference(Cesium.JulianDate.now(), startTime) % 5)) * Cartesian3s.toRadians(config.position).height
                );
            }, false),
            model: {
                uri: __dirpath + "/resources/圆环.glb",
                scale:  new Cesium.CallbackProperty((time, result) => {
                    // this.viewer.scene.camera.position
                  return  Cesium.Cartesian3.distance(config.position,this.viewer.scene.camera.position) * 0.1 /34;
                   // return 0.1;
                }, false),
                maximumScale: 1,
                color: Cesium.Color.DARKVIOLET ,
                show: new Cesium.CallbackProperty((time, result) => {
                    return this.onSelected;
                }, false)
            },
            polyline : {
                    positions: [Cartesian3s.formatHeightZero(config.position), config.position],
                    width: 5,
                    material:Cesium.Color.DARKVIOLET
            }
            // ellipse:{
            //     semiMajorAxis: 10,
            //     semiMinorAxis: 10,
            //     extrudedHeight: Cartesian3s.toRadians(config.position).height,
            //     material: Cesium.Color.DARKVIOLET
            // }
        });
        this.ringEntity.parent = this;

        // this.parent = entity;
        // this.entity = entity;
        this.initEvent();
        this.onSelected = false;
    }

    setViewer(viewer) {
        this.viewer = viewer;
        viewer.entities.add(this);
        viewer.entities.add(this.ringEntity);
    }

    removeViewer(viewer) {
        viewer.entities.add(this);
        viewer.entities.add(this.ringEntity);
    }


    initEvent() {
        eventSystem.onLeftClick(this, (position) => {
            // this.onSelected ^= true;//反向
            if (typeof this.onClickCallback === "function") {
                this.onClickCallback(position);
            }
        })
    }

    onClick(callback) {
        this.onClickCallback = callback;
    }

}


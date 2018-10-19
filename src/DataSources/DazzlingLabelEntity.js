import * as Cesium from "Cesium";
import {Cartesian3s} from "../Core/Cartesian3s";
import {SimpleCosBuilder} from "../Util/Math"
import {BaseEntity} from "./BaseEntity";
import {__dirpath} from "../index";

/**
 * 无法解决单个entity引用模型的问题
 */
export class DazzlingLabelEntity extends BaseEntity {
    /**
     *
     * @param config
     * @param modelColor
     * @param width
     * @param timePeriod
     * @param relativeSize
     */
    constructor(config, {
        modelColor = Cesium.Color.DARKVIOLET,
        line: {
            width = 5
        } = {},
        ring: {
            timePeriod = 10,
            relativeSize = 1
        } = {}
    } = {}) {
        super(config)
        // let simpleSin = new SimpleSinBuilder().setPeriod(20).setAmplitude(1).setPhase(0).build();
        let simpleCos = new SimpleCosBuilder().setPeriod(timePeriod / 2).setAmplitude(-0.5).setPhase(0).build();
        let startTime = Cesium.JulianDate.now();

        this.ringEntity = new Cesium.Entity({
            position: new Cesium.CallbackProperty((time, result) => {
                return Cartesian3s.formatHeight(config.position,
                    (0.5 + simpleCos.calc(Cesium.JulianDate.secondsDifference(Cesium.JulianDate.now(), startTime) % (timePeriod / 2))) * Cartesian3s.toRadians(config.position).height
                );
            }, false),
            model: {
                uri: __dirpath + "/resources/圆环.glb",
                scale: new Cesium.CallbackProperty((time, result) => {
                    // this.viewer.scene.camera.position
                    return Cesium.Cartesian3.distance(config.position, this.viewer.scene.camera.position) * relativeSize / 340;
                    // return 0.1;
                }, false),
                maximumScale: 1,
                color: modelColor,
                show: new Cesium.CallbackProperty((time, result) => {
                    return this.selected;
                }, false)
            },
            polyline: {
                positions: [Cartesian3s.formatHeightZero(config.position), config.position],
                width: width,
                material: modelColor
            }
        });
        this.ringEntity.parent = this;

        this.initEvent();
        this.selected = false;
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
}


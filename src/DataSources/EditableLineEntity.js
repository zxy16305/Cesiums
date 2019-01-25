/**
 *  使用二版事件系统
 *
 */
export class EditableLineEntity {
    constructor(viewer, {positions, material = new Cesium.PolylineArrowMaterialProperty(Cesium.Color.PURPLE)} = {}, params = {}) {
        this.bindEntity = [];
        this.pointEntity = [];

    }



    exportEntities() {
        return this.bindEntity;
    }

}

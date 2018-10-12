import * as Cesium from "Cesium";

/**
 * 基础entity
 * 改变了，继承改变 display/hide/add/remove方向
 * 选择选中接口对外开放
 */
export class BaseEntity extends Cesium.Entity{
    constructor(config) {
        super(config);
    }

    setViewer(viewer){
        viewer.entities.add(this);
    }

    removeViewer(viewer){
        viewer.entities.remove(this);
    }

    display(){
        this.show = true;
    }

    hide(){
        this.show = false;
    }


    setSelected(selected = true) {
        this.onSelected = selected;
    }

    cancelSelected() {
        this.onSelected = false;
    }
}
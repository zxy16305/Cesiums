// import * as Cesium from "Cesium";
import {EventSystemInstance} from "../Core/EventSystem";

/**
 * 基础entity
 * 改变了，继承改变 display/hide/add/remove方向
 * 选择选中接口对外开放
 * 点击事件
 */
export class BaseEntity extends Cesium.Entity {
    constructor(config) {
        super(config);
    }

    setViewer(viewer) {
        viewer.entities.add(this);
        this._viewer = viewer;
    }

    removeViewer(viewer) {
        viewer.entities.remove(this);
        delete this._viewer;
    }

    display() {
        this.show = true;
    }

    hide() {
        this.show = false;
    }

    set selected(selected){
        this._selected = selected;
        if(this.selected){
            typeof this._selectedCallback() === "function" && this._selectedCallback();
        }else{
            typeof this._releaseCallback === "function" && this._releaseCallback();
        }
    }

    get selected(){
        return this._selected;
    }

    setSelected(selected = true) {
        this.selected = selected;
    }

    cancelSelected() {
        this.selected = false;
    }

    onSelect(callback = () => {
    }) {
        this._selectedCallback = callback;
    }

    onRelease(callback = () => {
    }) {
        this._releaseCallback = callback;
    }

    initEvent() {
        EventSystemInstance.getInstance().onLeftClick(this, (position) => {
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

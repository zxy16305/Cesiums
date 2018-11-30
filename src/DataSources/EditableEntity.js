// import * as Cesium from "Cesium";
import {Cartesian3s, EventSystemInstance, EventType} from "..";
import {BaseEntity} from "./BaseEntity";
import {customPickStrategy} from "../Util/InnerUtils";

export class EditableEntity extends BaseEntity{

    constructor(config){
        super(config);
        this._relativeHeight = 5;
    }
    set relativeHeight(height){
        this._relativeHeight = height;
    }

    get relativeHeight(){
        return this._relativeHeight;
    }


    setEditable(editable = true){
        let eventSystem = EventSystemInstance.getInstance(this._viewer);
        if(editable === false){
            eventSystem.removeListener(this,EventType.DRAW);
            eventSystem.removeListener(this,EventType.DRAW_START);
            eventSystem.removeListener(this,EventType.DRAW_END);
            this._editable = false;
            return;
        }

        if(this._editable) return;

        this._editable = true;

        eventSystem.onDragStart(this, (position) => {
            eventSystem.enableDrawRotation(false);
            // this._inlineHeight = Cartesian3s.toDegrees(this.position.getValue(0)).height;
            // this.position = Cartesian3s.formatHeight(this._viewer.scene.camera.pickEllipsoid(position),this._inlineHeight) ;
            // this.position = this._viewer.scene.camera.pickEllipsoid(position) ;
            this.show = false;
            this.position = customPickStrategy(position,this._viewer.scene,this._relativeHeight);

        })

        eventSystem.onDrag(this, (position) => {
            // this.position = Cartesian3s.formatHeight(this._viewer.scene.camera.pickEllipsoid(position),this._inlineHeight) ;
            this.position = customPickStrategy(position,this._viewer.scene,this._relativeHeight);
        })

        eventSystem.onDragEnd(this, (position) => {
            eventSystem.enableDrawRotation(true);
            this.show = true;
        })

    }
}

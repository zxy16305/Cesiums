// import * as Cesium from "Cesium";
import {EventSystemInstance} from "../../..";

export class EditableBillboard extends Cesium.Billboard {

    constructor(config, billboardCollection,viewer) {
        super(config,billboardCollection);
        this.viewer = viewer;
    }

    setEditable() {
        if (this._editable) {
            return;
        }

        this._editable = true;

        let eventSystem = EventSystemInstance.getInstance();
        eventSystem.onDragStart(this, (position) => {
            eventSystem.enableDrawRotation(false);

            this.position = this.viewer.scene.camera.pickEllipsoid(position);
        })

        eventSystem.onDrag(this, (position) => {
            this.position = this.viewer.scene.camera.pickEllipsoid(position);
        })

        eventSystem.onDragEnd(this, (position) => {
            eventSystem.enableDrawRotation(true);
        })
    }
}
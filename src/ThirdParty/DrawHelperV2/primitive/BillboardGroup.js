import * as Cesium from "Cesium";
import {copyOptions} from "../util/util";
import {defaultBillboard} from "../constant/DefaultValue";
import {setListener} from "../util/EventHelper";
import {EditableBillboard} from "./EditableBillboard";


export class BillboardGroup {
    constructor(drawHelper, options) {
        this._drawHelper = drawHelper;
        this._scene = drawHelper._scene;

        this._options = copyOptions(options, defaultBillboard);

        // create one common billboard collection for all billboards
        var b = new Cesium.BillboardCollection();
        this._scene.primitives.add(b);
        this._billboards = b;
        // keep an ordered list of billboards
        this._orderedBillboards = [];
    }

    createBillboard(position, callbacks) {
        let editableBillboard = new EditableBillboard({
            show: true,
            position: position,
            pixelOffset: new Cesium.Cartesian2(this._options.shiftX, this._options.shiftY),
            eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            scale: 1.0,
            image: this._options.iconUrl,
            color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
        },this._drawHelper._viewer);

        let billboard = this._billboards.add(editableBillboard);

        // if editable
        if (callbacks) {
            var screenSpaceCameraController = this._scene.screenSpaceCameraController;

            const enableRotation = (enable) => {
                screenSpaceCameraController.enableRotate = enable;
            }

            const getIndex = () => {
                // find index
                for (let i = 0, I = this._orderedBillboards.length; i < I && this._orderedBillboards[i] != billboard; ++i) ;
                return i;
            }

            if (callbacks.dragHandlers) {
                setListener(billboard, 'leftDown', (position) => {
                    // TODO - start the drag handlers here
                    // create handlers for mouseOut and leftUp for the billboard and a mouseMove
                    const onDrag = (position) => {
                        billboard.position = position;
                        // find index
                        for (var i = 0, I = this._orderedBillboards.length; i < I && this._orderedBillboards[i] != billboard; ++i) ;
                        callbacks.dragHandlers.onDrag && callbacks.dragHandlers.onDrag(getIndex(), position);
                    }

                    const onDragEnd = (position) => {
                        handler.destroy();
                        enableRotation(true);
                        callbacks.dragHandlers.onDragEnd && callbacks.dragHandlers.onDragEnd(getIndex(), position);
                    }

                    var handler = new Cesium.ScreenSpaceEventHandler(this._scene.canvas);

                    handler.setInputAction((movement) => {
                        var cartesian = this._scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                        if (cartesian) {
                            onDrag(cartesian);
                        } else {
                            onDragEnd(cartesian);
                        }
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                    handler.setInputAction((movement) => {
                        onDragEnd(this._scene.camera.pickEllipsoid(movement.position, ellipsoid));
                    }, Cesium.ScreenSpaceEventType.LEFT_UP);

                    enableRotation(false);

                    callbacks.dragHandlers.onDragStart && callbacks.dragHandlers.onDragStart(getIndex(), this._scene.camera.pickEllipsoid(position, ellipsoid));
                });
            }
            if (callbacks.onDoubleClick) {
                setListener(billboard, 'leftDoubleClick', (position) => {
                    callbacks.onDoubleClick(getIndex());
                });
            }
            if (callbacks.onClick) {
                setListener(billboard, 'leftClick', (position) => {
                    callbacks.onClick(getIndex());
                });
            }
            if (callbacks.tooltip) {
                setListener(billboard, 'mouseMove', (position) => {
                    this._drawHelper._tooltip.showAt(position, callbacks.tooltip());
                });
                setListener(billboard, 'mouseOut', (position) => {
                    this._drawHelper._tooltip.setVisible(false);
                });
            }
        }

        return billboard;
    }

    insertBillboard(index, position, callbacks) {
        this._orderedBillboards.splice(index, 0, this.createBillboard(position, callbacks));
    }

    addBillboard(position, callbacks) {
        this._orderedBillboards.push(this.createBillboard(position, callbacks));
    }

    addBillboards(positions, callbacks) {
        let index = 0;
        for (; index < positions.length; index++) {
            this.addBillboard(positions[index], callbacks);
        }
    }

    updateBillboardsPositions(positions) {
        let index = 0;
        for (; index < positions.length; index++) {
            this.getBillboard(index).position = positions[index];
        }
    }

    countBillboards() {
        return this._orderedBillboards.length;
    }

    getBillboard(index) {
        return this._orderedBillboards[index];
    }

    removeBillboard(index) {
        this._billboards.remove(this.getBillboard(index));
        this._orderedBillboards.splice(index, 1);
    }

    remove() {
        this._billboards = this._billboards && this._billboards.removeAll() && this._billboards.destroy();
    }

    setOnTop() {
        this._scene.primitives.raiseToTop(this._billboards);
    }

}
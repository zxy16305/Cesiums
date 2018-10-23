import {ChangeablePrimitive} from "./ChangeablePrimitive";
import {dragBillboard,ellipsoid} from "../constant/DefaultValue";

export class PolySharpPrimitive extends ChangeablePrimitive{
    setEditMode(editMode = true){
        var drawHelper = this._drawHelper;
        // if no change
        if (this._editMode == editMode) {
            return;
        }
        // make sure all other shapes are not in edit mode before starting the editing of this shape
        drawHelper.disableAllHighlights();
        // display markers
        if (editMode) {
            drawHelper.setEdited(this);
            var scene = drawHelper._scene;
            var _self = this;
            // create the markers and handlers for the editing
            if (this._markers == null) {
                var thisDragBillboard = this.dragBillboard? this.dragBillboard: dragBillboard;
                var thisDragHalfBillboard = this.dragHalfBillboard? this.dragHalfBillboard: dragBillboard;
                var markers = new _.BillboardGroup(drawHelper, thisDragBillboard);
                var editMarkers = new _.BillboardGroup(drawHelper, thisDragHalfBillboard);


                var handleMarkerChanges = {
                    dragHandlers: {
                        onDrag: function (index, position) {
                            _self.positions[index] = position;
                            _self.updateHalfMarkers(index, _self.positions,editMarkers);
                            _self._createPrimitive = true;
                        },
                        onDragEnd: function (index, position) {
                            _self._createPrimitive = true;
                            _self.execOnEdited();
                        }
                    },
                    onDoubleClick: function (index) {
                        if (_self.positions.length < 4) {
                            return;
                        }
                        // remove the point and the corresponding markers
                        _self.positions.splice(index, 1);
                        _self._createPrimitive = true;
                        markers.removeBillboard(index);
                        editMarkers.removeBillboard(index);
                        _self.updateHalfMarkers(index, _self.positions,editMarkers);
                        _self.execOnEdited();
                    },
                    tooltip: function () {
                        if (_self.positions.length > 3) {
                            return "Double click to remove this point";
                        }
                    }
                };
                // add billboards and keep an ordered list of them for the polygon edges
                markers.addBillboards(_self.positions, handleMarkerChanges);
                this._markers = markers;

                var halfPositions = [];
                var index = 0;
                var length = _self.positions.length + (this.isPolygon ? 0 : -1);
                for (; index < length; index++) {
                    halfPositions.push(_self.calculateHalfMarkerPosition(index));
                }
                var handleEditMarkerChanges = {
                    dragHandlers: {
                        onDragStart: function (index, position) {
                            // add a new position to the polygon but not a new marker yet
                            this.index = index + 1;
                            _self.positions.splice(this.index, 0, position);
                            _self._createPrimitive = true;
                        },
                        onDrag: function (index, position) {
                            _self.positions[this.index] = position;
                            _self._createPrimitive = true;
                        },
                        onDragEnd: function (index, position) {
                            // create new sets of makers for editing
                            markers.insertBillboard(this.index, position, handleMarkerChanges);
                            editMarkers.getBillboard(this.index - 1).position = _self.calculateHalfMarkerPosition(this.index - 1);
                            editMarkers.insertBillboard(this.index, _self.calculateHalfMarkerPosition(this.index), handleEditMarkerChanges);
                            _self._createPrimitive = true;
                            _self.execOnEdited();
                        }
                    },
                    tooltip: function () {
                        return "Drag to create a new point";
                    }
                };
                editMarkers.addBillboards(halfPositions, handleEditMarkerChanges);
                this._editMarkers = editMarkers;
                // add a handler for clicking in the globe
                this._globeClickhandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
                this._globeClickhandler.setInputAction(
                    function (movement) {
                        var pickedObject = scene.pick(movement.position);
                        if (!(pickedObject && pickedObject.primitive)) {
                            _self.setEditMode(false);
                        }
                    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                // set on top of the polygon
                markers.setOnTop();
                editMarkers.setOnTop();
            }
            this._editMode = true;
        } else {
            if (this._markers != null) {
                this._markers.remove();
                this._editMarkers.remove();
                this._markers = null;
                this._editMarkers = null;
                this._globeClickhandler.destroy();
            }
            this._editMode = false;
        }
    }

    calculateHalfMarkerPosition(index) {
        var positions = this.positions;
        return ellipsoid.cartographicToCartesian(
            new Cesium.EllipsoidGeodesic(ellipsoid.cartesianToCartographic(positions[index]),
                ellipsoid.cartesianToCartographic(positions[index < positions.length - 1 ? index + 1 : 0])).interpolateUsingFraction(0.5)
        );
    }

    // function for updating the edit markers around a certain point
    updateHalfMarkers(index, positions,editMarkers) {
        // update the half markers before and after the index
        var editIndex = index - 1 < 0 ? positions.length - 1 : index - 1;
        if (editIndex < editMarkers.countBillboards()) {
            editMarkers.getBillboard(editIndex).position = this.calculateHalfMarkerPosition(editIndex);
        }
        editIndex = index;
        if (editIndex < editMarkers.countBillboards()) {
            editMarkers.getBillboard(editIndex).position = this.calculateHalfMarkerPosition(editIndex);
        }
    }


    execOnEdited() {
        this.executeListeners({name: 'onEdited', positions: this.positions});
    }


}
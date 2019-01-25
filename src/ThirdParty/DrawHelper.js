import * as lodash from "./lodash.min";

/**
 * Created by thomas on 9/01/14.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * (c) www.geocento.com
 * www.metaaps.com
 * <pre>
 *      update:
 *          2018-9-17:
 *              - pickStrategy属性兼容性
 *              - 适配stopDrawing在未开始标绘的情况
 *          2019-9-24:
 *              - 对属性带有modeType:billboard的entity加入setEditable(boolean)的方法,用于改变位置
 * </pre>
 *
 */
// (function webpackUniversalModuleDefinition(root, factory) {
//     // if (typeof exports === 'object' && typeof module === 'object')
//     //     module.exports = factory(require('Cesium'));
//     // else if (typeof define === 'function' && define.amd)
//     //     define('DrawHelper', ['Cesium'], factory);
//     // else {
//         root.DrawHelper = factory(root.Cesium);
//     // }
// }(window, function (Cesium) {
    // static variables
    var ellipsoid = Cesium.Ellipsoid.WGS84;
    let pickTimeout = 100;

    var pickthrottle = {
        lastPick: null,
        lastTime: new Date(),
        pick: function (scene, position, accuracy) {
            let time = new Date();
            if (this.lastPick === null || time.getTime() - this.lastTime.getTime() > pickTimeout) {
                this.lastTime = time;
                this.lastPick = scene.pick(position, accuracy, accuracy);
                // debugManager.log("new")
            }else{
                // debugManager.log("old")
            }
            // if(defined(this.lastPick))
            return lodash.merge({}, this.lastPick);;
        }
    }
    /**
     *
     * @param { Cesium.Cartesian2} position
     * @param {Cesium.Viewer} viewer
     * @return {Cesium.Cartesian3}
     */
    var defaultPickStrategy = function (position, viewer) {
        return viewer.scene.camera.pickEllipsoid(position);
    };

    var getPositionAwayByCamara = function(camera, position, distance) {
        let totalDistance = Cesium.Cartesian3.distance(camera.position, position, new Cesium.Cartesian3());
        let subtract = Cesium.Cartesian3.subtract(camera.position, position, new Cesium.Cartesian3());
        let add = Cesium.Cartesian3.multiplyByScalar(subtract, distance / totalDistance, new Cesium.Cartesian3());
        return Cesium.Cartesian3.add(position, add, new Cesium.Cartesian3())
    }

    var customPickStrategy = function (position, scene,back) {
        if(back == undefined) back = 0;
        let positionReturn = {};
        if (Cesium.defined(scene.pick(position)) && scene.pickPositionSupported) {
            positionReturn = scene.pickPosition(position);
            // var fromCartesian = Cesium.Cartographic.fromCartesian(viewer.scene.pickPosition(position));
            // return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
        } else {
            var fromCartesian = Cesium.Cartographic.fromCartesian(scene.camera.pickEllipsoid(position));
            positionReturn = Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
        }

        if (back !== 0) positionReturn = getPositionAwayByCamara(scene.camera, positionReturn, back);
        return positionReturn;
    }

    /**
     * @constructor
     * @param cesiumWidget
     * @private
     */
    function _(cesiumWidget) {
        this._viewer = cesiumWidget;
        this._scene = cesiumWidget.scene;
        this._tooltip = createTooltip(cesiumWidget.container);
        this._surfaces = [];
        //适配
        (Cesium.defined(Cesium.ContextLimits)) && (
            Cesium.ContextLimits._maximumAliasedLineWidth = 10);

        this.initialiseHandlers();

        this.enhancePrimitives();
        enhanceWithListeners(this);
    }

    _.prototype.initialiseHandlers = function () {
        var scene = this._scene;
        var _self = this;
        // scene events
        var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        function callPrimitiveCallback(name, position) {
            if (_self._handlersMuted == true) return;
            var pickedObject = scene.pick(position);
            if (pickedObject && pickedObject.primitive && pickedObject.primitive[name]) {
                pickedObject.primitive[name](position);
            }
            if (pickedObject && pickedObject.id && pickedObject.id.constructor.toString().match(/^function\s*([^\s(]+)/)[1] === "Entity" && pickedObject.id[name]){
                pickedObject.id[name](position);
            }
         }

        handler.setInputAction(
            function (movement) {
                callPrimitiveCallback('leftClick', movement.position);
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.setInputAction(
            function (movement) {
                callPrimitiveCallback('leftDoubleClick', movement.position);
            }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        var mouseOutObject;
        handler.setInputAction(
            function (movement) {
                let markPosition = {
                    x: movement.endPosition.x,
                    y: movement.endPosition.y
                };

                if (_self._handlersMuted == true) return;
                // var pickedObject = scene.pick(markPosition);
                var pickedObject =  pickthrottle.pick(scene,markPosition)

                if (mouseOutObject && (!pickedObject || mouseOutObject != pickedObject.primitive)) {
                    !(mouseOutObject.isDestroyed && mouseOutObject.isDestroyed()) && mouseOutObject.mouseOut(markPosition);
                    mouseOutObject = null;
                }
                if (pickedObject && pickedObject.primitive) {
                    pickedObject = pickedObject.primitive;
                    if (pickedObject.mouseOut) {
                        mouseOutObject = pickedObject;
                    }
                    if (pickedObject.mouseMove) {
                        pickedObject.mouseMove(markPosition);
                    }
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        handler.setInputAction(
            function (movement) {
                callPrimitiveCallback('leftUp', movement.position);
            }, Cesium.ScreenSpaceEventType.LEFT_UP);
        handler.setInputAction(
            function (movement) {
                callPrimitiveCallback('leftDown', movement.position);
            }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    }

    _.prototype.setListener = function (primitive, type, callback) {
        primitive[type] = callback;
    }

    _.prototype.muteHandlers = function (muted) {
        this._handlersMuted = muted;
    }

    // register event handling for an editable shape
    // shape should implement setEditMode and setHighlighted
    _.prototype.registerEditableShape = function (surface) {
        var _self = this;

        // handlers for interactions
        // highlight polygon when mouse is entering
        setListener(surface, 'mouseMove', function (position) {
            surface.setHighlighted(true);
            if (!surface._editMode) {
                _self._tooltip.showAt(position, "Click to edit this shape");
            }
        });
        // hide the highlighting when mouse is leaving the polygon
        setListener(surface, 'mouseOut', function (position) {
            surface.setHighlighted(false);
            _self._tooltip.setVisible(false);
        });
        setListener(surface, 'leftClick', function (position) {
            surface.setEditMode(true);
        });
    }

    _.prototype.startDrawing = function (cleanUp) {
        // undo any current edit of shapes
        this.disableAllEditMode();
        // check for cleanUp first
        if (this.editCleanUp) {
            this.editCleanUp();
        }
        this.editCleanUp = cleanUp;
        this.muteHandlers(true);
    }

    _.prototype.stopDrawing = function () {
        // check for cleanUp first
        if (this.editCleanUp) {
            this.editCleanUp();
            this.editCleanUp = null;
        }
        this.muteHandlers(false);
    }

    // make sure only one shape is highlighted at a time
    _.prototype.disableAllHighlights = function () {
        this.setHighlighted(undefined);
    }

    _.prototype.setHighlighted = function (surface) {
        if (this._highlightedSurface && !this._highlightedSurface.isDestroyed() && this._highlightedSurface != surface) {
            this._highlightedSurface.setHighlighted(false);
        }
        this._highlightedSurface = surface;
    }

    _.prototype.disableAllEditMode = function () {
        this.setEdited(undefined);
    }

    _.prototype.setEdited = function (surface) {
        if (this._editedSurface && !this._editedSurface.isDestroyed()) {
            this._editedSurface.setEditMode(false);
        }
        this._editedSurface = surface;
    }

    var material = Cesium.Material.fromType(Cesium.Material.ColorType);
    material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 0.5);

    var defaultShapeOptions = {
        ellipsoid: Cesium.Ellipsoid.WGS84,
        textureRotationAngle: 0.0,
        height: 0.0,
        asynchronous: true,
        show: true,
        debugShowBoundingVolume: false,
        strategy: {
            pickStrategy: defaultPickStrategy
        }
    }

    var defaultSurfaceOptions = copyOptions(defaultShapeOptions, {
        appearance: new Cesium.EllipsoidSurfaceAppearance({
            aboveGround: false
        }),
        material: material,
        granularity: Math.PI / 180.0,
        strategy: {
            pickStrategy: defaultPickStrategy
        }
    });

    var defaultPolygonOptions = copyOptions(defaultShapeOptions, {});
    var defaultExtentOptions = copyOptions(defaultShapeOptions, {});
    var defaultCircleOptions = copyOptions(defaultShapeOptions, {});
    var defaultEllipseOptions = copyOptions(defaultSurfaceOptions, {rotation: 0});

    var defaultPolylineOptions = copyOptions(defaultShapeOptions, {
        width: 5,
        geodesic: true,
        granularity: 10000,
        appearance: new Cesium.PolylineMaterialAppearance({
            aboveGround: false
        }),
        material: material
    });


//    Cesium.Polygon.prototype.setStrokeStyle = setStrokeStyle;
//
//    Cesium.Polygon.prototype.drawOutline = drawOutline;
//

    var ChangeablePrimitive = (function () {
        function _() {
        }

        _.prototype.initialiseOptions = function (options) {

            fillOptions(this, options);

            this._ellipsoid = undefined;
            this._granularity = undefined;
            this._height = undefined;
            this._textureRotationAngle = undefined;
            this._id = undefined;

            // set the flags to initiate a first drawing
            this._createPrimitive = true;
            this._primitive = undefined;
            this._outlinePolygon = undefined;

        }

        _.prototype.setAttribute = function (name, value) {
            this[name] = value;
            this._createPrimitive = true;
        };

        _.prototype.getAttribute = function (name) {
            return this[name];
        };

        /**
         * @private
         */
        _.prototype.update = function (context, frameState, commandList) {
            let date = new Date();

            if (!Cesium.defined(this.ellipsoid)) {
                throw new Cesium.DeveloperError('this.ellipsoid must be defined.');
            }

            if (!Cesium.defined(this.appearance)) {
                throw new Cesium.DeveloperError('this.material must be defined.');
            }

            if (this.granularity < 0.0) {
                throw new Cesium.DeveloperError('this.granularity and scene2D/scene3D overrides must be greater than zero.');
            }

            if (!this.show) {
                return;
            }

            if (!this._createPrimitive && (!Cesium.defined(this._primitive))) {
                // No positions/hierarchy to draw
                return;
            }

            if (this._createPrimitive ||
                (this._ellipsoid !== this.ellipsoid) ||
                (this._granularity !== this.granularity) ||
                (this._height !== this.height) ||
                (this._textureRotationAngle !== this.textureRotationAngle) ||
                (this._id !== this.id)) {

                var geometry = this.getGeometry();
                if (!geometry) {
                    return;
                }

                this._createPrimitive = false;
                this._ellipsoid = this.ellipsoid;
                this._granularity = this.granularity;
                this._height = this.height;
                this._textureRotationAngle = this.textureRotationAngle;
                this._id = this.id;

                this._primitive = this._primitive && this._primitive.destroy();
                var me = this;
                this._primitive = new Cesium.Primitive({
                    geometryInstances: new Cesium.GeometryInstance({
                        geometry: geometry,
                        id: this.id,
                        pickPrimitive: this
                    }),
                    appearance: this.appearance,
                    asynchronous: this.asynchronous
                });
                // this._primitive = new Cesium.GroundPrimitive({
                //     geometryInstances: new Cesium.GeometryInstance({
                //         geometry: geometry,
                //         id: me.id,
                //         pickPrimitive: me
                //     }),
                //     attributes: {
                //         // color :  Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.BLUE.withAlpha(0.5))
                //         color: Cesium.ColorGeometryInstanceAttribute.fromColor(this.strokeColor)
                //     }
                // });

                this._outlinePolygon = this._outlinePolygon && this._outlinePolygon.destroy();
                if (this.strokeColor && this.getOutlineGeometry) {
                    // create the highlighting frame
                    this._outlinePolygon = new Cesium.Primitive({
                        geometryInstances: new Cesium.GeometryInstance({
                            geometry: this.getOutlineGeometry(),
                            attributes: {
                                color: Cesium.ColorGeometryInstanceAttribute.fromColor(this.strokeColor)
                            }
                        }),
                        appearance: new Cesium.PerInstanceColorAppearance({
                            flat: true,
                            renderState: {
                                depthTest: {
                                    enabled: true
                                },
                                // lineWidth: Math.min(this.strokeWidth || 4.0)
                            }
                        })
                    });
                }
            }

            var primitive = this._primitive;
            // primitive.appearance.material = this.material;
            // primitive.appearance = this.appearance;
            primitive.appearance.material = this.material;
            // primitive.debugShowBoundingVolume = this.debugShowBoundingVolume;
            primitive.update(context, frameState, commandList);
            //debug
            // console.log(context)
            // console.log(frameState)
            // console.log(commandList)
            this._outlinePolygon && this._outlinePolygon.update(context, frameState, commandList);
            // console.log(new Date().getTime() - date.getTime())

        };

        _.prototype.isDestroyed = function () {
            return false;
        };

        _.prototype.destroy = function () {
            this._primitive = this._primitive && this._primitive.destroy();
            return Cesium.destroyObject(this);
        };

        _.prototype.setStrokeStyle = function (strokeColor, strokeWidth) {
            if (!this.strokeColor || !this.strokeColor.equals(strokeColor) || this.strokeWidth != strokeWidth) {
                this._createPrimitive = true;
                this.strokeColor = strokeColor;
                this.strokeWidth = strokeWidth;
            }
        }

        return _;
    })();

    _.ExtentPrimitive = (function () {
        function _(options) {

            if (!Cesium.defined(options.extent)) {
                throw new Cesium.DeveloperError('Extent is required');
            }

            options = copyOptions(options, defaultSurfaceOptions);

            this.initialiseOptions(options);

            this.setExtent(options.extent);

        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setExtent = function (extent) {
            this.setAttribute('extent', extent);
        };

        _.prototype.getExtent = function () {
            return this.getAttribute('extent');
        };

        _.prototype.getGeometry = function () {

            if (!Cesium.defined(this.extent)) {
                return;
            }

            return new Cesium.RectangleGeometry({
                rectangle: this.extent,
                height: this.height,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                stRotation: this.textureRotationAngle,
                ellipsoid: this.ellipsoid,
                granularity: this.granularity
            });
        };

        _.prototype.getOutlineGeometry = function () {
            return new Cesium.RectangleOutlineGeometry({
                rectangle: this.extent
            });
        }

        return _;
    })();

    _.PolygonPrimitive = (function () {

        function _(options) {

            options = copyOptions(options, defaultSurfaceOptions);

            this.initialiseOptions(options);

            this.isPolygon = true;

        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setPositions = function (positions) {
            this.setAttribute('positions', positions);
        };

        _.prototype.getPositions = function () {
            return this.getAttribute('positions');
        };

        _.prototype.getGeometry = function () {

            if (!Cesium.defined(this.positions) || this.positions.length < 3) {
                return;
            }

            return Cesium.PolygonGeometry.fromPositions({
                positions: this.positions,
                height: this.height,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                stRotation: this.textureRotationAngle,
                ellipsoid: this.ellipsoid,
                granularity: this.granularity
            });
        };

        _.prototype.getOutlineGeometry = function () {
            return Cesium.PolygonOutlineGeometry.fromPositions({
                positions: this.getPositions()
            });
        }

        return _;
    })();

    _.CirclePrimitive = (function () {

        function _(options) {

            if (!(Cesium.defined(options.center) && Cesium.defined(options.radius))) {
                throw new Cesium.DeveloperError('Center and radius are required');
            }

            options = copyOptions(options, defaultSurfaceOptions);

            this.initialiseOptions(options);

            this.setRadius(options.radius);

        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setCenter = function (center) {
            this.setAttribute('center', center);
        };

        _.prototype.setRadius = function (radius) {
            this.setAttribute('radius', Math.max(0.1, radius));
        };

        _.prototype.getCenter = function () {
            return this.getAttribute('center');
        };

        _.prototype.getRadius = function () {
            return this.getAttribute('radius');
        };

        _.prototype.getGeometry = function () {

            if (!(Cesium.defined(this.center) && Cesium.defined(this.radius))) {
                return;
            }

            return new Cesium.CircleGeometry({
                center: this.center,
                radius: this.radius,
                height: this.height,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                stRotation: this.textureRotationAngle,
                ellipsoid: this.ellipsoid,
                granularity: this.granularity
            });
        };

        _.prototype.getOutlineGeometry = function () {
            return new Cesium.CircleOutlineGeometry({
                center: this.getCenter(),
                radius: this.getRadius()
            });
        }

        return _;
    })();

    _.EllipsePrimitive = (function () {
        function _(options) {

            if (!(Cesium.defined(options.center) && Cesium.defined(options.semiMajorAxis) && Cesium.defined(options.semiMinorAxis))) {
                throw new Cesium.DeveloperError('Center and semi major and semi minor axis are required');
            }

            options = copyOptions(options, defaultEllipseOptions);

            this.initialiseOptions(options);

        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setCenter = function (center) {
            this.setAttribute('center', center);
        };

        _.prototype.setSemiMajorAxis = function (semiMajorAxis) {
            if (semiMajorAxis < this.getSemiMinorAxis()) return;
            this.setAttribute('semiMajorAxis', semiMajorAxis);
        };

        _.prototype.setSemiMinorAxis = function (semiMinorAxis) {
            if (semiMinorAxis > this.getSemiMajorAxis()) return;
            this.setAttribute('semiMinorAxis', semiMinorAxis);
        };

        _.prototype.setRotation = function (rotation) {
            return this.setAttribute('rotation', rotation);
        };

        _.prototype.getCenter = function () {
            return this.getAttribute('center');
        };

        _.prototype.getSemiMajorAxis = function () {
            return this.getAttribute('semiMajorAxis');
        };

        _.prototype.getSemiMinorAxis = function () {
            return this.getAttribute('semiMinorAxis');
        };

        _.prototype.getRotation = function () {
            return this.getAttribute('rotation');
        };

        _.prototype.getGeometry = function () {

            if (!(Cesium.defined(this.center) && Cesium.defined(this.semiMajorAxis) && Cesium.defined(this.semiMinorAxis))) {
                return;
            }

            return new Cesium.EllipseGeometry({
                ellipsoid: this.ellipsoid,
                center: this.center,
                semiMajorAxis: this.semiMajorAxis,
                semiMinorAxis: this.semiMinorAxis,
                rotation: this.rotation,
                height: this.height,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                stRotation: this.textureRotationAngle,
                ellipsoid: this.ellipsoid,
                granularity: this.granularity
            });
        };

        _.prototype.getOutlineGeometry = function () {
            return new Cesium.EllipseOutlineGeometry({
                center: this.getCenter(),
                semiMajorAxis: this.getSemiMajorAxis(),
                semiMinorAxis: this.getSemiMinorAxis(),
                rotation: this.getRotation()
            });
        }

        return _;
    })();

    _.PolylinePrimitive = (function () {

        function _(options) {

            options = copyOptions(options, defaultPolylineOptions);

            this.initialiseOptions(options);

        }

        _.prototype = new ChangeablePrimitive();

        _.prototype.setPositions = function (positions) {
            this.setAttribute('positions', positions);
        };

        _.prototype.setWidth = function (width) {
            this.setAttribute('width', width);
        };

        _.prototype.setGeodesic = function (geodesic) {
            this.setAttribute('geodesic', geodesic);
        };

        _.prototype.getPositions = function () {
            return this.getAttribute('positions');
        };

        _.prototype.getWidth = function () {
            return this.getAttribute('width');
        };

        _.prototype.getGeodesic = function (geodesic) {
            return this.getAttribute('geodesic');
        };

        _.prototype.getGeometry = function () {

            if (!Cesium.defined(this.positions) || this.positions.length < 2) {
                return;
            }

            return new Cesium.PolylineGeometry({
                positions: this.positions,
                height: this.height,
                width: this.width < 1 ? 1 : this.width,
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                ellipsoid: this.ellipsoid
            });
        }

        return _;
    })();


    var defaultBillboard = {
        iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAABbElEQVQoU2NkIAEwwtR6enqyc3Jy6jEzMyv9//+fl5GR8fPfv3/vff/+/dL27dt/gtSBFYMUcnBwePj4+ARYW1u7cHFxiX/9+vXl0aNH92zdunXDjx8/doA0gBV7eXmZ+/r6Zjo4OMR+//6dCWYbOzv7v3379i3evn379G3btp0EK3Z3d49tampq//79u/T///8Zfv36xfD792+Gf//+MbCwsDydOHFi5c6dOxeDFTs5OeV0dHT0vXr1ivXLl28Mf//+gXubjY3t9/Tp04r27ds3BazYysoqsaqqtuX7919S6IHz7dvXZzNnTqk5duzYfLBiY2NjG2dnt2w7O9ewf//+wd38/z/Dv717t686evTA1LNnzx4BK3ZwcOB49epViKOju7+NjYsNHx+/yKdPH94cPrz3yIEDOzeKiYmtOXDgwA94OMvIyHB+//7d+v///7oMDAwCDAwMHxgZGS9zcnIeffLkyXd4OBMbiQDHU6AM+91hMQAAAABJRU5ErkJggg==",
        shiftX: 0,
        shiftY: 0,
        strategy: {
            pickStrategy: defaultPickStrategy
        }
    }

    var dragBillboard = {
        iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAABbElEQVQoU2NkIAEwwtR6enqyc3Jy6jEzMyv9//+fl5GR8fPfv3/vff/+/dL27dt/gtSBFYMUcnBwePj4+ARYW1u7cHFxiX/9+vXl0aNH92zdunXDjx8/doA0gBV7eXmZ+/r6Zjo4OMR+//6dCWYbOzv7v3379i3evn379G3btp0EK3Z3d49tampq//79u/T///8Zfv36xfD792+Gf//+MbCwsDydOHFi5c6dOxeDFTs5OeV0dHT0vXr1ivXLl28Mf//+gXubjY3t9/Tp04r27ds3BazYysoqsaqqtuX7919S6IHz7dvXZzNnTqk5duzYfLBiY2NjG2dnt2w7O9ewf//+wd38/z/Dv717t686evTA1LNnzx4BK3ZwcOB49epViKOju7+NjYsNHx+/yKdPH94cPrz3yIEDOzeKiYmtOXDgwA94OMvIyHB+//7d+v///7oMDAwCDAwMHxgZGS9zcnIeffLkyXd4OBMbiQDHU6AM+91hMQAAAABJRU5ErkJggg==",
        shiftX: 0,
        shiftY: 0
    }

    var dragHalfBillboard = {
        iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAABCklEQVQoU5XRMUiEcBTH8e8/iBQMAoXAULBRqTWwGxvaagi3GxqjpragMWhrKhobbpOG2hoaL6G18MYTlIRAIUjQCDKU7mhwqDd/Hvze7wn+MWJi67qeA1aBZWAeeAfGwJMQ4qNxLf6Bm8A2sAEsAq/APXAD3DULE7wG7AF9YOZXsi9gAFwKIR5bXJZlX5KkU2Cp44SXqqqOZFketDjLsgNVVc+A2Q78mef5oaZp5y2O43jXMIwTQO/AaZIkx6ZpXrU4DMOebdv7gNeR2R+NRheO4wxbHEWRlKbpjuu6W0AP0Jp0wDAIgltd168ty6qmPfu+LxdFsQ6sAAvAG/CsKMqD53nltOe/PvEbmPRTDApQ3d8AAAAASUVORK5CYII=",
        shiftX: 0,
        shiftY: 0
    }

    _.prototype.createBillboardGroup = function (points, options, callbacks) {
        var markers = new _.BillboardGroup(this, options);
        markers.addBillboards(points, callbacks);
        return markers;
    }

    _.BillboardGroup = function (drawHelper, options) {

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

    _.BillboardGroup.prototype.createBillboard = function (position, callbacks) {

        var billboard = this._billboards.add({
            show: true,
            position: position,
            pixelOffset: new Cesium.Cartesian2(this._options.shiftX, this._options.shiftY),
            eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            scale: 1.0,
            image: this._options.iconUrl,
            color: new Cesium.Color(1.0, 1.0, 1.0, 1.0)
        });

        // if editable
        if (callbacks) {
            var _self = this;
            var screenSpaceCameraController = this._scene.screenSpaceCameraController;

            function enableRotation(enable) {
                screenSpaceCameraController.enableRotate = enable;
            }

            function getIndex() {
                // find index
                for (var i = 0, I = _self._orderedBillboards.length; i < I && _self._orderedBillboards[i] != billboard; ++i) ;
                return i;
            }

            if (callbacks.dragHandlers) {
                var _self = this;
                setListener(billboard, 'leftDown', function (position) {
                    // TODO - start the drag handlers here
                    // create handlers for mouseOut and leftUp for the billboard and a mouseMove
                    function onDrag(position) {
                        billboard.position = position;
                        // find index
                        for (var i = 0, I = _self._orderedBillboards.length; i < I && _self._orderedBillboards[i] != billboard; ++i) ;
                        callbacks.dragHandlers.onDrag && callbacks.dragHandlers.onDrag(getIndex(), position);
                        // console.log("drag")
                    }

                    function onDragEnd(position) {
                        handler.destroy();
                        enableRotation(true);
                        callbacks.dragHandlers.onDragEnd && callbacks.dragHandlers.onDragEnd(getIndex(), position);
                    }

                    var handler = new Cesium.ScreenSpaceEventHandler(_self._scene.canvas);

                    handler.setInputAction(function (movement) {
                        var cartesian = _self._scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                        if (cartesian) {
                            onDrag(cartesian);
                        } else {
                            onDragEnd(cartesian);
                        }
                    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                    handler.setInputAction(function (movement) {
                        onDragEnd(_self._scene.camera.pickEllipsoid(movement.position, ellipsoid));
                    }, Cesium.ScreenSpaceEventType.LEFT_UP);

                    enableRotation(false);

                    callbacks.dragHandlers.onDragStart && callbacks.dragHandlers.onDragStart(getIndex(), _self._scene.camera.pickEllipsoid(position, ellipsoid));
                });
            }
            if (callbacks.onDoubleClick) {
                setListener(billboard, 'leftDoubleClick', function (position) {
                    callbacks.onDoubleClick(getIndex());
                });
            }
            if (callbacks.onClick) {
                setListener(billboard, 'leftClick', function (position) {
                    callbacks.onClick(getIndex());
                });
            }
            if (callbacks.tooltip) {
                setListener(billboard, 'mouseMove', function (position) {
                    _self._drawHelper._tooltip.showAt(position, callbacks.tooltip());
                });
                setListener(billboard, 'mouseOut', function (position) {
                    _self._drawHelper._tooltip.setVisible(false);
                });
            }
        }

        return billboard;
    }

    _.BillboardGroup.prototype.insertBillboard = function (index, position, callbacks) {
        this._orderedBillboards.splice(index, 0, this.createBillboard(position, callbacks));
    }

    _.BillboardGroup.prototype.addBillboard = function (position, callbacks) {
        this._orderedBillboards.push(this.createBillboard(position, callbacks));
    }

    _.BillboardGroup.prototype.addBillboards = function (positions, callbacks) {
        var index = 0;
        for (; index < positions.length; index++) {
            this.addBillboard(positions[index], callbacks);
        }
    }

    _.BillboardGroup.prototype.updateBillboardsPositions = function (positions) {
        var index = 0;
        for (; index < positions.length; index++) {
            this.getBillboard(index).position = positions[index];
        }
    }

    _.BillboardGroup.prototype.countBillboards = function () {
        return this._orderedBillboards.length;
    }

    _.BillboardGroup.prototype.getBillboard = function (index) {
        return this._orderedBillboards[index];
    }

    _.BillboardGroup.prototype.removeBillboard = function (index) {
        this._billboards.remove(this.getBillboard(index));
        this._orderedBillboards.splice(index, 1);
    }

    _.BillboardGroup.prototype.remove = function () {
        this._billboards = this._billboards && this._billboards.removeAll() && this._billboards.destroy();
    }

    _.BillboardGroup.prototype.setOnTop = function () {
        this._scene.primitives.raiseToTop(this._billboards);
    }

    _.prototype.startDrawingMarker = function (options) {

        var options = copyOptions(options, defaultBillboard);

        this.startDrawing(
            function () {
                markers && markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        var _self = this;
        var scene = this._scene;
        var viewer = this._viewer;

        var primitives = scene.primitives;
        var tooltip = this._tooltip;

        var markers = new _.BillboardGroup(this, options);

        var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        // Now wait for start
        mouseHandler.setInputAction(function (movement) {
            if (movement.position != null) {
                // var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
                var cartesian = options.strategy.pickStrategy(movement.position, viewer);
                if (cartesian) {
                    markers.addBillboard(cartesian);
                    _self.stopDrawing();
                    options.callback(cartesian, _self);
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        mouseHandler.setInputAction(function (movement) {
            var position = movement.endPosition;
            if (position != null) {
                // var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                var cartesian = options.strategy.pickStrategy(position, viewer);
                if (cartesian) {
                    tooltip.showAt(position, "<p>Click to add your marker. Position is: </p>" + getDisplayLatLngString(ellipsoid.cartesianToCartographic(cartesian)));
                } else {
                    tooltip.showAt(position, "<p>Click on the globe to add your marker.</p>");
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    }

    _.prototype.startDrawingPolygon = function (options) {
        // var options = copyOptions(options, defaultSurfaceOptions);
        this.startDrawingPolyshape(true, options);
    }

    _.prototype.startDrawingPolyline = function (options) {
        // var options = copyOptions(options, defaultPolylineOptions);
        this.startDrawingPolyshape(false, options);
    }

    _.prototype.startDrawingPolyshape = function (isPolygon, options) {
        options = isPolygon ? copyOptions(options, defaultSurfaceOptions) : copyOptions(options, defaultPolylineOptions);

        this.startDrawing(
            function () {
                primitives && primitives.remove(poly);
                markers && markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        var _self = this;
        var scene = this._scene;
        var viewer = this._viewer;
        var primitives = scene.primitives;
        var tooltip = this._tooltip;

        var minPoints = isPolygon ? 3 : 2;
        var poly;
        if (isPolygon) {
            poly = new _.PolygonPrimitive(options);
        } else {
            poly = new _.PolylinePrimitive(options);
        }
        poly.asynchronous = false;
        primitives.add(poly);

        var positions = [];
        var markers = new _.BillboardGroup(this, defaultBillboard);

        var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);


        mouseHandler.setInputAction(function (movement) {

            var position = movement.position;
            if (position != null) {
                if (positions.length < minPoints /*+ 2*/) {
                    return;
                } else {
                    // var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                    var cartesian = options.strategy.pickStrategy(movement.position, viewer);

                    if (cartesian) {
                        _self.stopDrawing();
                        if (typeof options.callback == 'function') {
                            // remove overlapping ones
                            var index = positions.length - 1;
                            options.callback(positions, _self);
                        }
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        // Now wait for start
        mouseHandler.setInputAction(function (movement) {

            var cartesian = options.strategy.pickStrategy(movement.position, viewer);
            cartesian = getCesiumHightZero(cartesian);

            if (movement.position != null) {
                // var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);

                if (cartesian) {
                    // first click
                    if (positions.length == 0) {
                        positions.push(cartesian.clone());
                        markers.addBillboard(positions[0]);
                    }
                    if (positions.length >= minPoints) {
                        poly.positions = positions;
                        poly._createPrimitive = true;
                    }
                    // add new point to polygon
                    // this one will move with the mouse
                    positions.push(cartesian);
                    // add marker at the new position
                    markers.addBillboard(cartesian);
                }
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        mouseHandler.setInputAction(function (movement) {
            var position = movement.endPosition;
            if (position != null) {
                if (positions.length == 0) {
                    tooltip.showAt(position, "<p>Click to add first point</p>");
                } else {
                    // var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                    // var cartesian = scene.pickPosition(position);
                    // cartesian = getCesiumHightZero(cartesian);
                    var cartesian = options.strategy.pickStrategy(position, viewer);

                    if (cartesian) {
                        positions.pop();
                        // make sure it is slightly different
                        // cartesian.y += (1 + Math.random());
                        cartesian.y += Cesium.Math.EPSILON7;
                        positions.push(cartesian);
                        if (positions.length >= minPoints) {
                            poly.positions = positions;
                            poly._createPrimitive = true;
                        }
                        // update marker
                        markers.getBillboard(positions.length - 1).position = cartesian;
                        // show tooltip
                        tooltip.showAt(position, "<p>Click to add new point (" + positions.length + ")</p>" + (positions.length > minPoints ? "<p>Double click to finish drawing</p>" : ""));
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


    }

    function getExtentCorners(value) {
        return ellipsoid.cartographicArrayToCartesianArray([Cesium.Rectangle.northwest(value), Cesium.Rectangle.northeast(value), Cesium.Rectangle.southeast(value), Cesium.Rectangle.southwest(value)]);
    }

    _.prototype.startDrawingExtent = function (options) {

        var options = copyOptions(options, defaultSurfaceOptions);

        this.startDrawing(
            function () {
                if (extent != null) {
                    primitives && primitives.remove(extent);
                }
                markers && markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        var _self = this;
        var scene = this._scene;
        var viewer = this._viewer;
        var primitives = this._scene.primitives;
        var tooltip = this._tooltip;

        var firstPoint = null;
        var extent = null;
        var markers = null;

        var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        function updateExtent(value) {
            if (extent == null) {
                extent = new _.ExtentPrimitive({extent: value, material: options.material,});
                extent.asynchronous = false;
                primitives.add(extent);
            }
            extent.setExtent(value);
            extent.rectangle = value;
            // update the markers
            var corners = getExtentCorners(value);
            // create if they do not yet exist
            if (markers == null) {
                markers = new _.BillboardGroup(_self, defaultBillboard);
                markers.addBillboards(corners);
            } else {
                markers.updateBillboardsPositions(corners);
            }
        }

        // Now wait for start
        mouseHandler.setInputAction(function (movement) {
            if (movement.position != null) {
                // var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
                var cartesian = options.strategy.pickStrategy(movement.position, viewer);

                if (cartesian) {
                    if (extent == null) {
                        // create the rectangle
                        firstPoint = ellipsoid.cartesianToCartographic(cartesian);
                        var value = getExtent(firstPoint, firstPoint);
                        updateExtent(value);
                    } else {
                        _self.stopDrawing();
                        if (typeof options.callback == 'function') {
                            options.callback(getExtent(firstPoint, ellipsoid.cartesianToCartographic(cartesian), _self));
                        }
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        mouseHandler.setInputAction(function (movement) {
            var position = movement.endPosition;
            if (position != null) {
                if (extent == null) {
                    tooltip.showAt(position, "<p>Click to start drawing rectangle</p>");
                } else {
                    // var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                    var cartesian = options.strategy.pickStrategy(position, viewer);

                    if (cartesian) {
                        var value = getExtent(firstPoint, ellipsoid.cartesianToCartographic(cartesian));
                        updateExtent(value);
                        tooltip.showAt(position, "<p>Drag to change rectangle extent</p><p>Click again to finish drawing</p>");
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    }

    _.prototype.startDrawingCircle = function (options) {

        var options = copyOptions(options, defaultSurfaceOptions);

        this.startDrawing(
            function cleanUp() {
                if (circle != null) {
                    primitives && primitives.remove(circle);
                }
                markers && markers.remove();
                mouseHandler && mouseHandler.destroy();
                tooltip && tooltip.setVisible(false);
            }
        );

        var _self = this;
        var scene = this._scene;
        var viewer = this._viewer;
        var primitives = this._scene.primitives;
        var tooltip = this._tooltip;

        var circle = null;
        var markers = null;

        var mouseHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

        function pickPosition(position) {
            if (Cesium.defined(viewer.scene.pick(position))) {
                return getCesiumHightZero(viewer.scene.pickPosition(position));
            } else {
                return getCesiumHightZero(viewer.scene.camera.pickEllipsoid(position))
            }
        }


        // Now wait for start
        mouseHandler.setInputAction(function (movement) {
            if (movement.position != null) {
                // var cartesian = scene.camera.pickEllipsoid(movement.position, ellipsoid);
                // var cartesian = scene.pickPosition(movement.position);
                // cartesian = getCesiumHightZero(cartesian);
                // var cartesian = pickPosition(movement.position);
                var cartesian = options.strategy.pickStrategy(movement.position, viewer);
                if (cartesian) {
                    if (circle == null) {
                        // create the circle
                        circle = new _.CirclePrimitive({
                            center: cartesian,
                            radius: 0,
                            asynchronous: false,
                            material: options.material
                        });
                        primitives.add(circle);
                        markers = new _.BillboardGroup(_self, defaultBillboard);
                        markers.addBillboards([cartesian]);
                    } else {
                        if (typeof options.callback == 'function') {
                            options.callback(circle.getCenter(), circle.getRadius(), _self);
                        }
                        _self.stopDrawing();
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        mouseHandler.setInputAction(function (movement) {
            var position = movement.endPosition;
            if (position != null) {
                if (circle == null) {
                    tooltip.showAt(position, "<p>Click to start drawing the circle</p>");
                } else {
                    // var cartesian = scene.camera.pickEllipsoid(position, ellipsoid);
                    // var cartesian = scene.pickPosition(position);
                    var cartesian = options.strategy.pickStrategy(position, viewer);

                    if (cartesian) {
                        // Cesium.Cartographic.fromCartesian(circle.getCenter())
                        circle.setRadius(Cesium.Cartesian3.distance(getCesiumHightZero(circle.getCenter()), getCesiumHightZero(cartesian)));
                        // circle.setRadius(Cesium.Cartesian3.distance(circle.getCenter(), cartesian));
                        markers.updateBillboardsPositions(cartesian);
                        tooltip.showAt(position, "<p>Move mouse to change circle radius</p><p>Click again to finish drawing</p>");
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    }

    _.prototype.enhancePrimitives = function () {

        var drawHelper = this;

        Cesium.Billboard.prototype.setEditable = function () {

            if (this._editable) {
                return;
            }

            this._editable = true;

            var billboard = this;

            var _self = this;

            function enableRotation(enable) {
                drawHelper._scene.screenSpaceCameraController.enableRotate = enable;
            }

            setListener(billboard, 'leftDown', function (position) {
                // TODO - start the drag handlers here
                // create handlers for mouseOut and leftUp for the billboard and a mouseMove
                function onDrag(position) {
                    billboard.position = position;
                    _self.executeListeners({name: 'drag', positions: position});
                }

                function onDragEnd(position) {
                    handler.destroy();
                    enableRotation(true);
                    _self.executeListeners({name: 'dragEnd', positions: position});
                }

                var handler = new Cesium.ScreenSpaceEventHandler(drawHelper._scene.canvas);

                handler.setInputAction(function (movement) {
                    var cartesian = drawHelper._scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                    if (cartesian) {
                        onDrag(cartesian);
                    } else {
                        onDragEnd(cartesian);
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                handler.setInputAction(function (movement) {
                    onDragEnd(drawHelper._scene.camera.pickEllipsoid(movement.position, ellipsoid));
                }, Cesium.ScreenSpaceEventType.LEFT_UP);

                enableRotation(false);

            });

            enhanceWithListeners(billboard);

        }

        Cesium.Entity.prototype.setEditable = function (editable) {
            if(editable ===  false){
                var billboard = this;
                removeListener(billboard,'leftDown');
                this._editable = false;
                return;
            }

            if (this.modeType !== 'billboard' || this._editable) {
                return;
            }

            this._editable = true;

            var billboard = this;

            var _self = this;

            function enableRotation(enable) {
                drawHelper._scene.screenSpaceCameraController.enableRotate = enable;
            }

            setListener(billboard, 'leftDown', function (position) {
                // TODO - start the drag handlers here
                // create handlers for mouseOut and leftUp for the billboard and a mouseMove
                function onDrag(position) {
                    billboard.position = position;
                    _self.executeListeners({name: 'drag', positions: position});
                }

                function onDragEnd(position) {
                    handler.destroy();
                    enableRotation(true);
                    _self.executeListeners({name: 'dragEnd', positions: position});
                }

                var handler = new Cesium.ScreenSpaceEventHandler(drawHelper._scene.canvas);

                handler.setInputAction(function (movement) {
                    // var cartesian = drawHelper._scene.camera.pickEllipsoid(movement.endPosition, ellipsoid);
                    var cartesian =  customPickStrategy(movement.endPosition,drawHelper._scene,6);
                    if (cartesian) {
                        onDrag(cartesian);
                    } else {
                        onDragEnd(cartesian);
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                handler.setInputAction(function (movement) {
                    onDragEnd(customPickStrategy(movement.position,drawHelper._scene,6));
                }, Cesium.ScreenSpaceEventType.LEFT_UP);

                enableRotation(false);

            });

            enhanceWithListeners(billboard);
        }

        function setHighlighted(highlighted) {

            var scene = drawHelper._scene;

            // if no change
            // if already highlighted, the outline polygon will be available
            if (this._highlighted && this._highlighted == highlighted) {
                return;
            }
            // disable if already in edit mode
            if (this._editMode === true) {
                return;
            }
            this._highlighted = highlighted;
            // highlight by creating an outline polygon matching the polygon points
            if (highlighted) {
                // make sure all other shapes are not highlighted
                drawHelper.setHighlighted(this);
                this._strokeColor = this.strokeColor;
                this.setStrokeStyle(Cesium.Color.fromCssColorString('white'), this.strokeWidth);
            } else {
                if (this._strokeColor) {
                    this.setStrokeStyle(this._strokeColor, this.strokeWidth);
                } else {
                    this.setStrokeStyle(undefined, undefined);
                }
            }
        }

        function setEditMode(editMode) {
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

                    // function for updating the edit markers around a certain point
                    function updateHalfMarkers(index, positions) {
                        // update the half markers before and after the index
                        var editIndex = index - 1 < 0 ? positions.length - 1 : index - 1;
                        if (editIndex < editMarkers.countBillboards()) {
                            editMarkers.getBillboard(editIndex).position = calculateHalfMarkerPosition(editIndex);
                        }
                        editIndex = index;
                        if (editIndex < editMarkers.countBillboards()) {
                            editMarkers.getBillboard(editIndex).position = calculateHalfMarkerPosition(editIndex);
                        }
                    }

                    function onEdited() {
                        _self.executeListeners({name: 'onEdited', positions: _self.positions});
                    }

                    var handleMarkerChanges = {
                        dragHandlers: {
                            onDrag: function (index, position) {
                                _self.positions[index] = position;
                                updateHalfMarkers(index, _self.positions);
                                _self._createPrimitive = true;
                            },
                            onDragEnd: function (index, position) {
                                _self._createPrimitive = true;
                                onEdited();
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
                            updateHalfMarkers(index, _self.positions);
                            onEdited();
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

                    function calculateHalfMarkerPosition(index) {
                        var positions = _self.positions;
                        return ellipsoid.cartographicToCartesian(
                            new Cesium.EllipsoidGeodesic(ellipsoid.cartesianToCartographic(positions[index]),
                                ellipsoid.cartesianToCartographic(positions[index < positions.length - 1 ? index + 1 : 0])).interpolateUsingFraction(0.5)
                        );
                    }

                    var halfPositions = [];
                    var index = 0;
                    var length = _self.positions.length + (this.isPolygon ? 0 : -1);
                    for (; index < length; index++) {
                        halfPositions.push(calculateHalfMarkerPosition(index));
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
                                editMarkers.getBillboard(this.index - 1).position = calculateHalfMarkerPosition(this.index - 1);
                                editMarkers.insertBillboard(this.index, calculateHalfMarkerPosition(this.index), handleEditMarkerChanges);
                                _self._createPrimitive = true;
                                onEdited();
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

        _.PolylinePrimitive.prototype.setEditable = function () {

            if (this.setEditMode) {
                return;
            }

            var polyline = this;
            polyline.isPolygon = false;
            polyline.asynchronous = false;

            drawHelper.registerEditableShape(polyline);

            polyline.setEditMode = setEditMode;

            var originalWidth = this.width;

            polyline.setHighlighted = function (highlighted) {
                // disable if already in edit mode
                if (this._editMode === true) {
                    return;
                }
                if (highlighted) {
                    drawHelper.setHighlighted(this);
                    this.setWidth(originalWidth * 2);
                } else {
                    this.setWidth(originalWidth);
                }
            }

            polyline.getExtent = function () {
                return Cesium.Extent.fromCartographicArray(ellipsoid.cartesianArrayToCartographicArray(this.positions));
            }

            enhanceWithListeners(polyline);

            polyline.setEditMode(false);

        }

        _.PolygonPrimitive.prototype.setEditable = function () {

            var polygon = this;
            polygon.asynchronous = false;

            var scene = drawHelper._scene;

            drawHelper.registerEditableShape(polygon);

            polygon.setEditMode = setEditMode;

            polygon.setHighlighted = setHighlighted;

            enhanceWithListeners(polygon);

            polygon.setEditMode(false);

        }

        _.ExtentPrimitive.prototype.setEditable = function () {

            if (this.setEditMode) {
                return;
            }

            var extent = this;
            var scene = drawHelper._scene;

            drawHelper.registerEditableShape(extent);
            extent.asynchronous = false;

            extent.setEditMode = function (editMode) {
                // if no change
                if (this._editMode == editMode) {
                    return;
                }
                drawHelper.disableAllHighlights();
                // display markers
                if (editMode) {
                    // make sure all other shapes are not in edit mode before starting the editing of this shape
                    drawHelper.setEdited(this);
                    // create the markers and handlers for the editing
                    if (this._markers == null) {
                        var thisDragBillboard = this.dragBillboard? this.dragBillboard: dragBillboard;
                        var thisDragHalfBillboard = this.dragHalfBillboard? this.dragHalfBillboard: dragBillboard;

                        var markers = new _.BillboardGroup(drawHelper,thisDragHalfBillboard);

                        function onEdited() {
                            extent.executeListeners({name: 'onEdited', extent: extent.extent});
                        }

                        var handleMarkerChanges = {
                            dragHandlers: {
                                onDrag: function (index, position) {
                                    var corner = markers.getBillboard((index + 2) % 4).position;
                                    extent.setExtent(getExtent(ellipsoid.cartesianToCartographic(corner), ellipsoid.cartesianToCartographic(position)));
                                    markers.updateBillboardsPositions(getExtentCorners(extent.extent));
                                },
                                onDragEnd: function (index, position) {
                                    onEdited();
                                }
                            },
                            tooltip: function () {
                                return "Drag to change the corners of this extent";
                            }
                        };
                        markers.addBillboards(getExtentCorners(extent.extent), handleMarkerChanges);
                        this._markers = markers;
                        // add a handler for clicking in the globe
                        this._globeClickhandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
                        this._globeClickhandler.setInputAction(
                            function (movement) {
                                var pickedObject = scene.pick(movement.position);
                                // disable edit if pickedobject is different or not an object
                                try {
                                    if (!(pickedObject && !pickedObject.isDestroyed() && pickedObject.primitive)) {
                                        extent.setEditMode(false);
                                    }
                                } catch (e) {
                                    extent.setEditMode(false);
                                }
                            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

                        // set on top of the polygon
                        markers.setOnTop();
                    }
                    this._editMode = true;
                } else {
                    if (this._markers != null) {
                        this._markers.remove();
                        this._markers = null;
                        this._globeClickhandler.destroy();
                    }
                    this._editMode = false;
                }
            }

            extent.setHighlighted = setHighlighted;

            enhanceWithListeners(extent);

            extent.setEditMode(false);

        }

        _.EllipsePrimitive.prototype.setEditable = function () {

            if (this.setEditMode) {
                return;
            }

            var ellipse = this;
            var scene = drawHelper._scene;

            ellipse.asynchronous = false;

            drawHelper.registerEditableShape(ellipse);

            ellipse.setEditMode = function (editMode) {
                // if no change
                if (this._editMode == editMode) {
                    return;
                }
                drawHelper.disableAllHighlights();
                // display markers
                if (editMode) {
                    // make sure all other shapes are not in edit mode before starting the editing of this shape
                    drawHelper.setEdited(this);
                    var _self = this;
                    // create the markers and handlers for the editing
                    if (this._markers == null) {
                        var thisDragBillboard = this.dragBillboard? this.dragBillboard: dragBillboard;

                        var markers = new _.BillboardGroup(drawHelper,thisDragBillboard );

                        function getMarkerPositions() {
                            return Cesium.Shapes.computeEllipseBoundary(ellipsoid, ellipse.getCenter(), ellipse.getSemiMajorAxis(), ellipse.getSemiMinorAxis(), ellipse.getRotation() + Math.PI / 2, Math.PI / 2.0).splice(0, 4);
                        }

                        function onEdited() {
                            ellipse.executeListeners({
                                name: 'onEdited',
                                center: ellipse.getCenter(),
                                semiMajorAxis: ellipse.getSemiMajorAxis(),
                                semiMinorAxis: ellipse.getSemiMinorAxis(),
                                rotation: 0
                            });
                        }

                        var handleMarkerChanges = {
                            dragHandlers: {
                                onDrag: function (index, position) {
                                    var distance = Cesium.Cartesian3.distance(ellipse.getCenter(), position);
                                    if (index % 2 == 0) {
                                        ellipse.setSemiMajorAxis(distance);
                                    } else {
                                        ellipse.setSemiMinorAxis(distance);
                                    }
                                    markers.updateBillboardsPositions(getMarkerPositions());
                                },
                                onDragEnd: function (index, position) {
                                    onEdited();
                                }
                            },
                            tooltip: function () {
                                return "Drag to change the excentricity and radius";
                            }
                        };
                        markers.addBillboards(getMarkerPositions(), handleMarkerChanges);
                        this._markers = markers;
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
                    }
                    this._editMode = true;
                } else {
                    if (this._markers != null) {
                        this._markers.remove();
                        this._markers = null;
                        this._globeClickhandler.destroy();
                    }
                    this._editMode = false;
                }
            }

            ellipse.setHighlighted = setHighlighted;

            enhanceWithListeners(ellipse);

            ellipse.setEditMode(false);
        }

        _.CirclePrimitive.prototype.getCircleCartesianCoordinates = function (granularity) {
            var geometry = Cesium.CircleOutlineGeometry.createGeometry(new Cesium.CircleOutlineGeometry({
                ellipsoid: ellipsoid,
                center: this.getCenter(),
                radius: this.getRadius(),
                granularity: granularity
            }));
            var count = 0, value, values = [];
            for (; count < geometry.attributes.position.values.length; count += 3) {
                value = geometry.attributes.position.values;
                values.push(new Cesium.Cartesian3(value[count], value[count + 1], value[count + 2]));
            }
            return values;
        };

        _.CirclePrimitive.prototype.setEditable = function () {

            if (this.setEditMode) {
                return;
            }

            var circle = this;
            var scene = drawHelper._scene;

            circle.asynchronous = false;

            drawHelper.registerEditableShape(circle);

            circle.setEditMode = function (editMode) {
                // if no change
                if (this._editMode == editMode) {
                    return;
                }
                drawHelper.disableAllHighlights();
                // display markers
                if (editMode) {
                    // make sure all other shapes are not in edit mode before starting the editing of this shape
                    drawHelper.setEdited(this);
                    var _self = this;
                    // create the markers and handlers for the editing
                    if (this._markers == null) {
                        var thisDragBillboard = this.dragBillboard? this.dragBillboard: dragBillboard;

                        var markers = new _.BillboardGroup(drawHelper, thisDragBillboard);

                        function getMarkerPositions() {
                            // return _self.getCircleCartesianCoordinates(Cesium.Math.PI_OVER_TWO);
                            return _self.getCircleCartesianCoordinates(Cesium.Math.PI_OVER_TWO);
                        }

                        function onEdited() {
                            circle.executeListeners({
                                name: 'onEdited',
                                center: circle.getCenter(),
                                radius: circle.getRadius()
                            });
                        }

                        var handleMarkerChanges = {
                            dragHandlers: {
                                onDrag: function (index, position) {
                                    circle.setRadius(Cesium.Cartesian3.distance(circle.getCenter(), position));
                                    markers.updateBillboardsPositions(getMarkerPositions());
                                },
                                onDragEnd: function (index, position) {
                                    onEdited();
                                }
                            },
                            tooltip: function () {
                                return "Drag to change the radius";
                            }
                        };
                        markers.addBillboards(getMarkerPositions(), handleMarkerChanges);
                        this._markers = markers;
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
                    }
                    this._editMode = true;
                } else {
                    if (this._markers != null) {
                        this._markers.remove();
                        this._markers = null;
                        this._globeClickhandler.destroy();
                    }
                    this._editMode = false;
                }
            }

            circle.setHighlighted = setHighlighted;

            enhanceWithListeners(circle);

            circle.setEditMode(false);
        }

    }

    _.DrawHelperWidget = (function () {

        // constructor
        function _(drawHelper, options) {

            // container must be specified
            if (!(Cesium.defined(options.container))) {
                throw new Cesium.DeveloperError('Container is required');
            }

            var drawOptions = {
                // markerIcon: "./img/glyphicons_242_google_maps.png",
                // polylineIcon: "./img/glyphicons_097_vector_path_line.png",
                // polygonIcon: "./img/glyphicons_096_vector_path_polygon.png",
                // circleIcon: "./img/glyphicons_095_vector_path_circle.png",
                // extentIcon: "./img/glyphicons_094_vector_path_square.png",
                // clearIcon: "./img/glyphicons_067_cleaning.png",
                markerIcon: " marker",
                polylineIcon: " polyline",
                polygonIcon: " polygon",
                circleIcon: " circle",
                extentIcon: " extent",
                clearIcon: " clear",
                polylineDrawingOptions: defaultPolylineOptions,
                polygonDrawingOptions: defaultPolygonOptions,
                extentDrawingOptions: defaultExtentOptions,
                circleDrawingOptions: defaultCircleOptions,
                strategy: {
                    pickStrategy: options.pickStrategy ? options.pickStrategy : defaultPickStrategy
                }
            };

            fillOptions(options, drawOptions);

            var _self = this;

            var toolbar = document.createElement('DIV');
            toolbar.className = "toolbar";
            options.container.appendChild(toolbar);

            function addIcon(id, url, title, callback) {
                var div = document.createElement('DIV');
                div.className = 'button' + url;
                div.title = title;
                toolbar.appendChild(div);
                div.onclick = callback;
                // var span = document.createElement('SPAN');
                // div.appendChild(span);
                // var image = document.createElement('IMG');
                // image.src = url;
                // span.appendChild(image);
                return div;
            }

            var scene = drawHelper._scene;
            // console.log(options.buttons)

            options.buttons.indexOf("marker") !== -1 && addIcon('marker', options.markerIcon, 'Click to start drawing a 2D marker', function () {
                typeof options.clickCallback === 'function' &&
                options.clickCallback({
                    name: 'markerClick'
                });

                drawHelper.startDrawingMarker({
                    callback: function (position) {
                        _self.executeListeners({name: 'markerCreated', position: position});
                    },
                    strategy: options.strategy
                });
            })

            options.buttons.indexOf("polyline") !== -1 && addIcon('polyline', options.polylineIcon, 'Click to start drawing a 2D polyline', function () {
                typeof options.clickCallback === 'function' &&
                options.clickCallback({
                    name: 'polylineClick'
                });

                drawHelper.startDrawingPolyline({
                    callback: function (positions) {
                        _self.executeListeners({name: 'polylineCreated', positions: positions});
                    },
                    strategy: options.strategy
                });
            })

            options.buttons.indexOf("polygon") !== -1 && addIcon('polygon', options.polygonIcon, 'Click to start drawing a 2D polygon', function () {
                typeof options.clickCallback === 'function' &&
                options.clickCallback({
                    name: 'polygonClick'
                });

                drawHelper.startDrawingPolygon({
                    callback: function (positions) {
                        _self.executeListeners({name: 'polygonCreated', positions: positions});
                    },
                    strategy: options.strategy
                });
            })

            options.buttons.indexOf("extent") !== -1 && addIcon('extent', options.extentIcon, 'Click to start drawing an Extent', function () {
                typeof options.clickCallback === 'function' &&
                options.clickCallback({
                    name: 'extentClick'
                });

                drawHelper.startDrawingExtent({
                    callback: function (extent) {
                        _self.executeListeners({name: 'extentCreated', extent: extent});
                    },
                    strategy: options.strategy
                });
            })

            options.buttons.indexOf("circle") !== -1 && addIcon('circle', options.circleIcon, 'Click to start drawing a Circle', function () {
                typeof options.clickCallback === 'function' &&
                options.clickCallback({
                    name: 'circleClick'
                });

                drawHelper.startDrawingCircle({
                    callback: function (center, radius) {
                        _self.executeListeners({name: 'circleCreated', center: center, radius: radius});
                    },
                    strategy: options.strategy
                });
            })

            // add a clear button at the end
            // add a divider first
            var div = document.createElement('DIV');
            div.className = 'divider';
            toolbar.appendChild(div);

            options.buttons.indexOf("clear") !== -1 &&
            addIcon('clear', options.clearIcon, 'Remove all primitives', function () {
                typeof options.clickCallback === 'function' &&
                options.clickCallback({
                    name: 'clearClick'
                });

                scene.primitives.removeAll();
            });

            enhanceWithListeners(this);

        }


        return _;

    })();

    /**
     * 新增工具栏点击回调
     * @param container
     * @param options
     * @param {function(event)} options.clickCallback - event.name包括${toolbarName}Click
     * @returns {_|*}
     */
    _.prototype.addToolbar = function (container, options) {
        options = copyOptions(options, {container: container});
        return new _.DrawHelperWidget(this, options);
    }

    function getExtent(mn, mx) {
        var e = new Cesium.Rectangle();

        // Re-order so west < east and south < north
        e.west = Math.min(mn.longitude, mx.longitude);
        e.east = Math.max(mn.longitude, mx.longitude);
        e.south = Math.min(mn.latitude, mx.latitude);
        e.north = Math.max(mn.latitude, mx.latitude);

        // Check for approx equal (shouldn't require abs due to re-order)
        var epsilon = Cesium.Math.EPSILON7;

        if ((e.east - e.west) < epsilon) {
            e.east += epsilon * 2.0;
        }

        if ((e.north - e.south) < epsilon) {
            e.north += epsilon * 2.0;
        }

        return e;
    };

    function createTooltip(frameDiv) {

        var tooltip = function (frameDiv) {

            var div = document.createElement('DIV');
            div.className = "twipsy right";

            var arrow = document.createElement('DIV');
            arrow.className = "twipsy-arrow";
            div.appendChild(arrow);

            var title = document.createElement('DIV');
            title.className = "twipsy-inner";

            div.appendChild(title);

            this._div = div;
            this._title = title;

            // add to frame div and display coordinates
            frameDiv.appendChild(div);
            this.addEvent();
            this.setVisible(false);
        }

        tooltip.prototype.setVisible = function (visible) {
            this._div.style.display = visible ? 'block' : 'none';
        }

        tooltip.prototype.showAt = function (position, message) {
            if (position && message) {
                this.setVisible(true);
                this._title.innerHTML = message;
                // this._div.style.left = position.x + 10 + "px";
                // this._div.style.top = (position.y - this._div.clientHeight / 2) + "px";
            }
        }

        tooltip.prototype.show = function (message) {
            if (message) {
                this.setVisible(true);
                this._title.innerHTML = message;
            }
        }

        /**
         * 解决拖动到tip上时宕机的问题
         */
        tooltip.prototype.addEvent = function () {
            var me = this;
            var count = 0;
            document.body.addEventListener("mousemove", function (ev) {
                if (me._div.style.display === 'block' && (count = ((count++) % 3)) === 0) {
                    me._div.style.left = ev.offsetX + 20 + "px";
                    me._div.style.top = (ev.offsetY - me._div.clientHeight / 2) + "px";
                }
            })
        }

        return new tooltip(frameDiv);
    }

    function getDisplayLatLngString(cartographic, precision) {
        return cartographic.longitude.toFixed(precision || 3) + ", " + cartographic.latitude.toFixed(precision || 3);
    }

    function clone(from, to) {
        if (from == null || typeof from != "object") return from;
        if (from.constructor != Object && from.constructor != Array) return from;
        if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
            from.constructor == String || from.constructor == Number || from.constructor == Boolean)
            return new from.constructor(from);

        to = to || new from.constructor();

        for (var name in from) {
            to[name] = typeof to[name] == "undefined" ? clone(from[name], null) : to[name];
        }

        return to;
    }

    function fillOptions(options, defaultOptions) {
        options = options || {};
        var option;
        for (option in defaultOptions) {
            if (options[option] === undefined) {
                options[option] = clone(defaultOptions[option]);
            }
        }
    }

    // shallow copy
    function copyOptions(options, defaultOptions) {
        var newOptions = clone(options), option;
        for (option in defaultOptions) {
            if (newOptions[option] === undefined) {
                newOptions[option] = clone(defaultOptions[option]);
            }
        }
        return newOptions;
    }

    function extendOptions(options, defaultOptions) {
        var newOptions = clone(options), option;
        for (option in defaultOptions) {
            newOptions[option] = clone(defaultOptions[option]);
        }
        return newOptions;
    }

    function setListener(primitive, type, callback) {
        primitive[type] = callback;
    }

    function removeListener(primitive, type) {
        delete primitive[type];
    }

    function enhanceWithListeners(element) {

        element._listeners = {};

        element.addListener = function (name, callback) {
            this._listeners[name] = (this._listeners[name] || []);
            this._listeners[name].push(callback);
            return this._listeners[name].length;
        }

        element.executeListeners = function (event, defaultCallback) {
            if (this._listeners[event.name] && this._listeners[event.name].length > 0) {
                var index = 0;
                for (; index < this._listeners[event.name].length; index++) {
                    this._listeners[event.name][index](event);
                }
            } else {
                if (defaultCallback) {
                    defaultCallback(event);
                }
            }
        }

    }

    /**
     * 获取当前点位的近地点位
     * @param {Cesium.Cartesian3} cesium3
     * @returns {Cesium.Cartesian3}
     */
    function getCesiumHightZero(cesium3) {
        var fromCartesian = Cesium.Cartographic.fromCartesian(cesium3);
        return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
    }


//     return _;
// }));
export {_ as DrawHelper} ;

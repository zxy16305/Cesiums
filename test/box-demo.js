
(function () {

    Cesiums.cesium1_50Patch();
    var viewer = new Cesium.Viewer('map3d', {
        geocoder:false,
        homeButton:false,
        sceneModePicker:false,
        baseLayerPicker:false,
        navigationHelpButton:true,
        animation:false,
        timeline:false,
        fullscreenButton:false,
        vrButton:false
    });
    viewer.scene.debugShowFramesPerSecond = true;
    var scene = viewer.scene;

    let instance = Cesiums.EventSystemInstance.getInstance(viewer);
    // Cesiums.debugManager.debug = true;
    window.viewer = viewer;

    // 地图底图
    function setBaseMap(url, credit, subdomains, replace) {
        var mapProvider = new Cesium.UrlTemplateImageryProvider({
            url: url,
            //credit: credit,
            subdomains: subdomains
        });
        var mapLayer = new Cesium.ImageryLayer(mapProvider, Cesium.defaultValue(true, {}));
        if (replace) viewer.scene.imageryLayers.removeAll(false);
        viewer.scene.imageryLayers.add(mapLayer);
    }
    // google 有偏移
    // setBaseMap('http://www.google.cn/maps/vt?lyrs=s&gl=cn&x={x}&y={y}&z={z}', 'Google Map', ["mt0", "mt1", "mt2", "mt3"], true);
    // google 无偏移
    setBaseMap('http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}', 'Google Map', ["mt0", "mt1", "mt2", "mt3"], true);
    // scgis
    // setBaseMap('/scgis/satelite?level={z}&col={x}&row={y}', 'scgis', ["mt0", "mt1", "mt2", "mt3"], true);
    // setBaseMap('http://192.168.106.57:8080/scgis/satelite?level={z}&col={x}&row={y}', 'scgis', ["mt0", "mt1", "mt2", "mt3"], true);
    // 天地图
    // setBaseMap('http://{s}.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&L={z}', 'tianditu', ["t1", "t2", "t3", "t4"], true);
    // setBaseMap('http://{s}.tianditu.com/DataServer?T=cva_w&X={x}&Y={y}&L={z}', 'tianditu', ["t1", "t2", "t3", "t4"], false);
    // 天地图卫星图
    // setBaseMap('http://{s}.tianditu.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&style=default&format=tiles', 'tianditu', ["t1", "t2", "t3", "t4"], true);
    // setBaseMap('http://{s}.tianditu.com/DataServer?T=cva_w&X={x}&Y={y}&L={z}', 'tianditu', ["t1", "t2", "t3", "t4"], false);

    // 加载地形
    // var terrainProvider = Cesium.createWorldTerrain({
    //     requestVertexNormals: true
    // });
    // viewer.terrainProvider = terrainProvider;
    // 无地形
    // viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    // 加载 VR-theworld 地形
    // var vrTheWorldProvider = new Cesium.VRTheWorldTerrainProvider({
    //     url : 'http://www.vr-theworld.com/vr-theworld/tiles1.0.0/73/',
    //     credit : 'Terrain data courtesy VT MAK'
    // });
    // viewer.terrainProvider = vrTheWorldProvider;

    // 模型的中心点坐标
    var longitude = 120.1267;
    var latitude = 30.85776;
    // 高度校准（需手动调节）
    var height = -12;//2.5076627764545864e-9;
    var heading = 0;
    // 加载 3d-tiles 模型资源到场景中
    var tileset = new Cesium.Cesium3DTileset({
        url: 'http://192.168.100.233:9002/api/folder/d323b55c37894e3da8d0508eadf93c42/tileset.json'
    });
    viewer.scene.primitives.add(tileset);
    tileset.readyPromise.then(function(argument) {
        // 校准模型位置、高度、旋转角
        var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
        var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position);
        var rotationX = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(heading)));
        Cesium.Matrix4.multiply(mat, rotationX, mat);
        tileset.root.transform = mat;
        //
        // viewer.camera.flyTo({destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 1000)});
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 1000),
            duration: 0
        });
        //
        setTimeout(rayTest, 3000);
    }).otherwise(function(error) {
        console.error(error);
    });


    // 添加图标
    function addIcons() {
        // 坐标 + 高度偏移（标注在模型“上空”）
        var pos = Cesium.Cartesian3.fromDegrees(longitude + 0.00045, latitude, 30);
        viewer.entities.add({
            id: 'icon-12345',
            position: pos,
            // 图标
            billboard: {
                image: 'images/icon_dl.png'
            },
            // 文字标签
            label: {
                pixelOffset: new Cesium.Cartesian2(0, 30),
                fillColor: Cesium.Color.WHITE,
                outlineColor: new Cesium.Color.fromCssColorString('#191970'),
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                font: '24px Helvetica',
                text: '这是宿舍，还是教学楼？'
            }
        });
    }
    addIcons();


    var ellipsoid = Cesium.Ellipsoid.WGS84;
    //
    // var inspector = new Cesium.CesiumInspector(document.body, viewer.scene);

    // 3DTiles 调试工具
    // var tileInspector = new Cesium.Cesium3DTilesInspector(document.body, viewer.scene);

    console.log('pick position supported : ' + viewer.scene.pickPositionSupported);

    var eventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    eventHandler.setInputAction(function(e) {
        var pick = viewer.scene.pick(e.position);
        if (pick && pick.primitive instanceof Cesium.Cesium3DTileset) {
            console.log(pick.primitive);
        }
        var pos = viewer.scene.pickPosition(e.position);
        console.log(pos);
        // pos = viewer.scene.pickPositionWorldCoordinates(e.position);
        // console.log(pos);
        //console.log(pos, Cesium.Cartesian3.toDegrees(pos));
        // var rad = ellipsoid.cartesianToCartographic(pos);
        // console.log(rad);
        // rad.latitude = Cesium.Math.toDegrees(rad.latitude);
        // rad.longitude = Cesium.Math.toDegrees(rad.longitude);
        // console.log(rad);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    function rayTest() {
        var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, 100);
        var direction = new Cesium.Cartesian3(0, 0, -1);
        var ray = new Cesium.Ray(position, direction);
        // viewer
    }



    // 工具栏
    var toolbarVM = {
        drawType: 'box',
        showBox: false,
        doStartDraw: function(){
            console.log(this.drawType);
            startDrawingRectangle();
        }
    };
    Cesium.knockout.track(toolbarVM);
    var toolbar = document.getElementById('toolbar');
    Cesium.knockout.applyBindings(toolbarVM, toolbar);
    //for (var name in toolbarVM) {
    //    if (toolbarVM.hasOwnProperty(name)) {
    //        Cesium.knockout.getObservable(toolbarVM, name).subscribe(updatePostProcess);
    //    }
    //}
    Cesium.knockout.getObservable(toolbarVM, 'showBox').subscribe(updatePostProcess);
    function updatePostProcess() {
        console.log(toolbarVM);
        showBoxes(Boolean(toolbarVM.showBox));
    }


    var drawHelper = new DrawHelper(viewer);
    // var btn = document.querySelector('#tbtn-draw-rect');
    // if (btn) {
    //     btn.addEventListener('click', function(){
    //         startDrawingRectangle();
    //     });
    // }
    function startDrawingRectangle() {
        // drawHelper.startDrawingExtent({
        //     callback: function (extent, self) {
        //         graphicCreated({name: 'extentCreated', extent: extent});
        //     },
        //     strategy: {
        //         pickStrategy: pickStrategy
        //     }
        // });
        drawHelper.startDrawingPolygon({
            callback: function (positions, self) {
                polygonCreated(positions)
            },
            strategy: {
                pickStrategy: pickStrategy
            }
        });
    }

    var pickStrategy = function (position, viewer) {
        if (Cesium.defined(viewer.scene.pick(position)) && viewer.scene.pickPositionSupported) {
            return viewer.scene.pickPosition(position);
            // var fromCartesian = Cesium.Cartographic.fromCartesian(viewer.scene.pickPosition(position));
            // return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
        } else {
            var fromCartesian = Cesium.Cartographic.fromCartesian(viewer.scene.camera.pickEllipsoid(position));
            return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
        }
    };

    var boxes = [];
    function showBoxes(visible) {
        for (var i = 0; i < boxes.length; i++) {
            var attributes = boxes[i].getGeometryInstanceAttributes('box-1');
            attributes.show = [visible ? 1 : 0];
            boxes[i].show = visible;
        }
    }

    function graphicCreated(o) {
        // {name:'',extent:{west,south,east,north}}
        console.log(o);
        var rect = o.extent;
        // 矩形方式（不建议使用）
        if (toolbarVM.drawType == 'rect') {
            var highlightRect = viewer.entities.add({
                // polygon : {
                //     hierarchy : new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromRadiansArray([
                //         rect.west, rect.south,
                //         rect.east, rect.south,
                //         rect.east, rect.north,
                //         rect.west, rect.north
                //     ])),
                //     material : new Cesium.Color(1.0, 0.0, 0.0, 0.5),
                //     classificationType : Cesium.ClassificationType.BOTH
                // }
                rectangle : {
                    coordinates : rect,
                    material : new Cesium.Color(1.0, 0.0, 0.0, 0.5),
                    classificationType : Cesium.ClassificationType.BOTH
                }
            });
            console.log(highlightRect);

        } else if (toolbarVM.drawType == 'box') {
            // 长方体方式（适用于3DTiles中的建筑单体化，楼层单体化）
            rect = {
                west: Cesium.Math.toDegrees(rect.west),
                south: Cesium.Math.toDegrees(rect.south),
                east: Cesium.Math.toDegrees(rect.east),
                north: Cesium.Math.toDegrees(rect.north),
                toString: function() {return this.west+', '+this.south+'; '+this.east+', '+this.north;}
            };
            console.log(rect);
            var boxHeight = 100;
            var center = Cesium.Cartesian3.fromDegrees((rect.west + rect.east) / 2, (rect.south + rect.north) / 2, boxHeight / 2 - 30);
            var xw = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(rect.west, rect.south), Cesium.Cartesian3.fromDegrees(rect.east, rect.south));
            var yw = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(rect.west, rect.south), Cesium.Cartesian3.fromDegrees(rect.west, rect.north));
            var dimension = new Cesium.Cartesian3(xw, yw, boxHeight);
            //
            // var geometry = scene.primitives.add(new Cesium.Primitive({
            //     geometryInstances : new Cesium.GeometryInstance({
            //         geometry : Cesium.BoxGeometry.fromDimensions({
            //             vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
            //             dimensions : dimension
            //         }),
            //         modelMatrix : Cesium.Transforms.eastNorthUpToFixedFrame(center),
            //         attributes : {
            //             color : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 0.0, 0.0, 0.5)),
            //             show : new Cesium.ShowGeometryInstanceAttribute(Boolean(toolbarVM.showBox))
            //         },
            //         id : 'box-1'
            //     }),
            //     appearance : new Cesium.PerInstanceColorAppearance({
            //         translucent : true,
            //         closed : true
            //     })
            // }));
            // geometry.show = Boolean(toolbarVM.showBox);
            // boxes.push(geometry);
            // console.log(geometry);
            //
            var buildingHighlight = scene.primitives.add(new Cesium.ClassificationPrimitive({
                geometryInstances : new Cesium.GeometryInstance({
                    geometry : Cesium.BoxGeometry.fromDimensions({
                        // vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                        dimensions : dimension
                    }),
                    modelMatrix : Cesium.Transforms.eastNorthUpToFixedFrame(center),
                    attributes : {
                        color : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 0.0, 0.0, 0.5)),
                        // show : new Cesium.ShowGeometryInstanceAttribute(true)
                    },
                    id : 'box-2'
                }),
                // classificationType : Cesium.ClassificationType.BOTH//CESIUM_3D_TILE
            }));
            console.log(buildingHighlight);
        }
    }

    function polygonCreated(positions) {
        let center = Cesiums.Cartesian3s.getCenter(positions);

        // var geometry = scene.primitives.add(new Cesium.ClassificationPrimitive({
        //     geometryInstances : new Cesium.GeometryInstance({
        //         geometry : Cesium.PolygonGeometry.fromPositions({
        //             vertexFormat : Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        //             positions: positions,
        //             extrudedHeight: 100
        //         }),
        //         // modelMatrix : Cesium.Transforms.eastNorthUpToFixedFrame(center),
        //         attributes : {
        //             color : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 0.0, 0.0, 0)),
        //             // show : new Cesium.ShowGeometryInstanceAttribute(Boolean(toolbarVM.showBox))
        //             show : new Cesium.ShowGeometryInstanceAttribute(true)
        //         },
        //         id : 'box-2'
        //     }),
        //     // appearance : new Cesium.PerInstanceColorAppearance({
        //     //     translucent : true,
        //     //     closed : true
        //     // }),
        //     classificationType : Cesium.ClassificationType.BOTH//CESIUM_3D_TILE
        // }));

        let primivtive = new Cesiums.BuildingHightlightBuilder()
            .setPositions(positions)
            .setOnClick(function (position, primitive) {
                console.log([position,primitive])
            })
            .setColor(Cesium.Color.TEAL.withAlpha(0.2))
            .setHoverColor(Cesium.Color.TEAL.withAlpha(0.5))
            .setBottomHeight(-200)//底边绝对高度
            .setHeight(400) //总高度
            .build()
        scene.primitives.add(primivtive)

        // geometry.show = Boolean(toolbarVM.showBox);
        // boxes.push(geometry);
        // console.log(geometry);


    }
    var hoverObjId = null;
    var hoverPrimitive = null;
    // eventHandler.setInputAction(function(movement) {
    //     var pickedObject = scene.pick(movement.endPosition);
    //     //
    //     if (toolbarVM.drawType == 'rect') {
    //         // if (pickedObject && pickedObject.primitive instanceof Cesium.ClassificationPrimitive) {
    //         // if (pickedObject && pickedObject.id instanceof Cesium.Entity && pickedObject.id.polygon) {
    //         if (pickedObject && pickedObject.id instanceof Cesium.Entity && pickedObject.id.rectangle) {
    //             if (pickedObject.id == hoverObjId) return;
    //             hoverObjId = pickedObject.id;
    //             hoverPrimitive = pickedObject.primitive;
    //             console.log(pickedObject);
    //             hoverObjId.rectangle.material.color = new Cesium.Color(1.0, 1.0, 0.0, 0.5);
    //         } else {
    //             if (hoverObjId) {
    //                 hoverObjId.rectangle.material.color = new Cesium.Color(1.0, 0.0, 0.0, 0.5);
    //                 hoverObjId = null;
    //                 hoverPrimitive = null;
    //                 console.log(pickedObject);
    //             }
    //         }
    //     } else if (toolbarVM.drawType == 'box') {
    //         if (pickedObject && pickedObject.primitive instanceof Cesium.ClassificationPrimitive) {
    //             if (pickedObject.id == hoverObjId) return;
    //             hoverObjId = pickedObject.id;
    //             hoverPrimitive = pickedObject.primitive;
    //             console.log(hoverPrimitive);
    //             var attributes = hoverPrimitive.getGeometryInstanceAttributes(hoverObjId);
    //             // attributes.color = Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 0.0, 0.5)),
    //             attributes.color = [255, 255, 0, 128];
    //         } else {
    //             if (hoverPrimitive) {
    //                 var attributes = hoverPrimitive.getGeometryInstanceAttributes(hoverObjId);
    //                 // attributes.color = Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 0.0, 0.0, 0.5)),
    //                 attributes.color = [255, 0, 0, 0];
    //                 hoverObjId = null;
    //                 hoverPrimitive = null;
    //             }
    //         }
    //     }
    // }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

})();

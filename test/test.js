// import * as Cesiums from "../src";

let viewer;


var longitude = 120.12674008947434;
var latitude = 30.857729240430604;
var height = 20;
var heading = 0;

init();

function init() {
    // Cesiums.cesium1_50Patch();
    viewer = new Cesium.Viewer(document.getElementById("map"));
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    setMap();
    next();
}


function setMap() {
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


    setBaseMap('http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}', 'Google Map', ["mt0", "mt1", "mt2", "mt3"], true);

    var tileset = new Cesium.Cesium3DTileset({
        url: 'http://localhost:9002/api/folder/044c1e57c01d4251967cceba34331cc4/tileset.json'
    });
    viewer.scene.primitives.add(tileset);
    tileset.readyPromise.then(function (argument) {
        // 校准模型位置、高度、旋转角
        var position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
        // var mat = Cesium.Transforms.eastNorthUpToFixedFrame(position);
        // var rotationX = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(heading)));
        // Cesium.Matrix4.multiply(mat, rotationX, mat);

        var boundingSphere = tileset.boundingSphere;
        var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height );
        var translation = Cesium.Cartesian3.subtract(position, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
        ;
        //
        // viewer.camera.flyTo({destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 1000)});
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 1000),
            duration: 0
        });
        //
        // setTimeout(rayTest, 3000);
    }).otherwise(function (error) {
        console.error(error);
    });

}

function next() {
    Cesiums.Debugs.positionPick(viewer)


    // var longitude = 118.92363523296339;
    // var latitude = 32.11622044873156;
    // // 高度校准（需手动调节）
    // var height = -20;//2.5076627764545864e-9;
    var heading = 0;

    var pos = Cesium.Cartesian3.fromDegrees(longitude, latitude, 20);

    window.pos = pos;
    let entity = new Cesiums.DazzlingLabelEntity({
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
            text: '点击环形特效'
        }
    }, {
        modelColor: Cesium.Color.RED,
        ring: {
            timePeriod: 5,
            relativeSize: 1
        }
    });
    Cesiums.EventSystemInstance.setViewer(viewer);

    // Cesiums.eventSystem.onLeftClick(entity, function (e) {
    //     console.log("left Click!");
    // })

    // viewer.entities.add(entity)
    entity.setViewer(viewer);
    // viewer.entities.add(entity.parent)

    let flyCancelFun;

    entity.onClick(function (position) {
        this.selected = !this.selected;
    });

    entity.onSelect(() => {
        flyCancelFun = Cesiums.Cameras.flyAroundPosition(viewer.scene.camera, pos, 50, 30, 0.2);
    })
    entity.onRelease(() => {
        typeof flyCancelFun === "function" && flyCancelFun();
    })

    //事件接管
    let eventSystem = Cesiums.EventSystemInstance.getInstance();

    // eventSystem.setListener(entity, Cesiums.EventType.LEFT_CLICK,function (position) {
    //     console.log(["left click", position]);
    // })
    eventSystem.setListener(entity, Cesiums.EventType.LEFT_DOUBLE_CLICK,function (position) {
        console.log(["leftDoubleClick", position]);
    })
    eventSystem.setListener(entity, Cesiums.EventType.MOUSE_MOVE,function (position) {
        console.log(["mouseMove", position]);
    })
    eventSystem.setListener(entity, Cesiums.EventType.LEFT_UP,function (position) {
        console.log(["leftUp", position]);
    })
    eventSystem.setListener(entity, Cesiums.EventType.LEFT_DOWN,function (position) {
        console.log(["leftDown", position]);
    })
    eventSystem.setListener(entity, Cesiums.EventType.DRAW_START,function (position) {
        console.log(["drawStart", position]);
    })
    eventSystem.setListener(entity, Cesiums.EventType.DRAW,function (position) {
        console.log(["draw", position]);
    })
    eventSystem.setListener(entity, Cesiums.EventType.DRAW_END,function (position) {
        console.log(["drawEnd", position]);
    })
    eventSystem.setListener(entity, Cesiums.EventType.MOUSE_MOVE_OUT,function (position) {
        console.log(["mouseMoveOut", position]);
    })

    // viewer.trackedEntity = entity;
    // setTimeout(flyAroundPosition, 3000)


    // viewer.scene.camera.flyTo({
    //     destination: Cesiums.Cartesian3s.formatHeightPlus(pos,5000)
    // })

    var pos1 = Cesium.Cartesian3.fromDegrees(longitude, latitude, 40);
    let editableEntity = new Cesiums.EditableEntity({
        id: 'icon-123451',
        position: pos1,
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
            text: '可移动'
        }
    });
    editableEntity.setViewer(viewer)
    editableEntity.relativeHeight = 10;

    editableEntity.setEditable()

    // editableEntity.setEditable(false)


     let compassCallback = new Cesiums.CompassElementBuilder()
         .setCamera(viewer.camera)
         .setImageUrl("./images/compress.jpg")//相对于当前html的路径
         .setClassName("test")//自定义指南针样式
         .is3DMode(false)//3dmode下，pitch和roll也会旋转
         .build();
    document.body.appendChild(compassCallback.compass.element)

     let compassCallback2 = new Cesiums.CompassElementBuilder()
         .setCamera(viewer.camera)
         .setImageUrl("./images/compress.jpg")
         .setClassName("test")
         .setPosition({x: 200,y:0})
         .is3DMode(true)
         .build();
    document.body.appendChild(compassCallback2.compass.element)

    var drawHelper = new DrawHelper(viewer);

    // var pos = Cesium.Cartesian3.fromDegrees(longitude + 0.015, latitude, 30);
    // let add = viewer.entities.add({
    //     id: 'icon-142345',
    //     position: pos,
    //     // 图标
    //     billboard: {
    //         image: 'images/icon_dl.png'
    //     },
    //     modeType:"billboard",
    //     // 文字标签
    //     label: {
    //         pixelOffset: new Cesium.Cartesian2(0, 30),
    //         fillColor: Cesium.Color.WHITE,
    //         outlineColor: new Cesium.Color.fromCssColorString('#191970'),
    //         outlineWidth: 2,
    //         style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    //         font: '24px Helvetica',
    //         text: '这是宿舍，还是教学楼？'
    //     }
    // });
    // window.add = add;
    // add.setEditable(true)


}


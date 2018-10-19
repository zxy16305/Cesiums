// import * as Cesiums from "../src";

let viewer;


var longitude = 120.12674008947434;
var latitude = 30.857729240430604;
var height = 40;
var heading = 0;

init();

function init() {
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
        url: 'http://192.168.100.233:9002/api/folder/9c22855864f340c88db15b69a94c05c3/tileset.json'
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
        var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
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
    Cesiums.eventSystem.setView(viewer);

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


    // viewer.trackedEntity = entity;
    // setTimeout(flyAroundPosition, 3000)


    // viewer.scene.camera.flyTo({
    //     destination: Cesiums.Cartesian3s.formatHeightPlus(pos,5000)
    // })


}


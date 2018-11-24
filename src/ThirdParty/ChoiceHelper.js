/*   if (typeof exports === 'object' && typeof module === 'object')
       module.exports = factory(require('Cesium'), require('DrawHelper'));
   else if (typeof define === 'function' && define.amd)
       define('ChoiceHelper', [ 'Cesium', 'DrawHelper'], factory);
   else {
       root.ChoiceHelper = factory(root.Cesium, root.DrawHelper);
   }*/
// import * as Cesium from "Cesium";
import {DrawHelper} from "../index"

// export const ChoiceHelper =  factory(Cesium,DrawHelper);


/**
 * @param {Object} config
 * @param {Object} config.viewer - Cesium.viewer对象
 * @param {Object} config.toolbar - toolbar,为空则不创建
 * @param {Element} config.toolbar.container - toolbar所在容器
 * @param {string[]} config.toolbar.buttons - 包括 'polygon', 'circle', 'extent' 代表多边形、圆形、矩形
 * @param {Object} config.dom - dom事件绑定模式
 * @param {Element} config.polygon - 绑定开始画polygon的事件
 * @param {Element} config.marker - 绑定开始画marker的事件
 * @param {Element} config.extent - 绑定开始画extent的事件
 * @param {Element} config.circle - 绑定开始画circle的事件
 * @param {Element} config.clear - 清空绘制事件
 * @param {Element} config.cancel - 结束绘制事件
 * @param {Array} config.callbacks - 选择回调，可配置多种选择回调
 * @param {function(Cesium.Entity):boolean} config.callbacks.choice[].filter - 过滤器，即选择器,确认为需要选择的对象，返回ture
 * @param {function(Cesium.Entity[])} config.callbacks.choice[].onChoice - 选择回调
 * @param {function(Cesium.Cartesian3)} config.callbacks.marker - marker创建回调
 * @param {function} config.callbacks.afterClick - 工具栏点击回调
 * {
 *     viewer: viewer对象,
 *     toolbar:{
 *         container: toolbar所在容器,
 *         buttons: [],//
 *     },
 *     dom:{//
 *             polygon: function | dom ,
 *             marker: function | dom ,
 *             extent: function | dom ,
 *             circle: function | dom ,
 *             clear : dom,
 *             cancel : dom
 *     },
 *     callbacks:{
 *          choice:[{
 *             filter: function
 *             onChoice: function
 *         }],
 *         marker: function,
 *         afterClick: function,
 *     }
 * }
 * @constructor
 */
export function ChoiceHelper(config) {
    this._cesiumViewer = config.viewer;
    this.util = new Util(this._cesiumViewer);

    this._scene = this._cesiumViewer.scene;
    this._drawHelper = new DrawHelper(this._cesiumViewer);
    this._option = config;
    this._afterClick = config.callbacks.afterClick;

    this._primitives = [];
    var me = this;

    if (Cesium.defined(config.toolbar) && Cesium.defined(config.toolbar.container)) {
        this._toolbarContainer = config.toolbar.container;

        this._toolbar = this._drawHelper.addToolbar(this._toolbarContainer, {
            buttons: config.toolbar.buttons,
            clickCallback: function (event) {
                //移除之前绘制的
                me._afterClick && me._afterClick();
                me.util.getWithDefault(me._primitives, []).forEach(function (element, index) {
                    me._scene.primitives.remove(element);
                })
            },
            //点位选取策略配置
            pickStrategy: pickStrategy
        })
    } else if (Cesium.defined(config.dom)) {
        this._toolbar = this._drawHelper.addToolbar(document.body, {buttons: []});
        var toolbar = this._toolbar;
        config.dom.polygon && function () {
            var lastOnclick = config.dom.polygon.onclick;
            config.dom.polygon.onclick = function (e) {
                lastOnclick && lastOnclick(e);

                me._afterClick && me._afterClick();
                me._drawHelper.startDrawingPolygon({
                    callback: function (positions, self) {
                        toolbar.executeListeners({name: 'polygonCreated', positions: positions});
                    },
                    strategy: {
                        pickStrategy: pickStrategy
                    }
                });
            }
            // $(config.dom.polygon).on('click', function (e) {
            //     me._afterClick && me._afterClick();
            //     me._drawHelper.startDrawingPolygon({
            //         callback: function (positions, self) {
            //             toolbar.executeListeners({name: 'polygonCreated', positions: positions});
            //         },
            //         strategy: {
            //             pickStrategy: pickStrategy
            //         }
            //     });
            // });
        }();
        config.dom.polygon && function () {
            var lastOnclick = config.dom.polyline.onclick;
            config.dom.polyline.onclick = function (e) {
                lastOnclick && lastOnclick(e);
                me._afterClick && me._afterClick();
                me._drawHelper.startDrawingPolyline({
                    callback: function (positions, self) {
                        toolbar.executeListeners({name: 'polylineCreated', positions: positions});
                    },
                    strategy: {
                        pickStrategy: pickStrategy
                    }
                });
            }
            // $(config.dom.polyline).on('click', function (e) {
            //     me._afterClick && me._afterClick();
            //     me._drawHelper.startDrawingPolyline({
            //         callback: function (positions, self) {
            //             toolbar.executeListeners({name: 'polylineCreated', positions: positions});
            //         },
            //         strategy: {
            //             pickStrategy: pickStrategy
            //         }
            //     });
            // });
        }();
        config.dom.marker && function () {
            var lastOnclick = config.dom.marker.onclick;
            config.dom.marker.onclick = function (e) {
                lastOnclick && lastOnclick(e);
                me._afterClick && me._afterClick();
                me._drawHelper.startDrawingMarker({
                    callback: function (position, self) {
                        toolbar.executeListeners({name: 'markerCreated', position: position});
                    },
                    strategy: {
                        pickStrategy: pickStrategy
                    }
                });
            }
            // $(config.dom.marker).on('click', function (e) {
            //     me._afterClick && me._afterClick();
            //     me._drawHelper.startDrawingMarker({
            //         callback: function (position, self) {
            //             toolbar.executeListeners({name: 'markerCreated', position: position});
            //         },
            //         strategy: {
            //             pickStrategy: pickStrategy
            //         }
            //     });
            // });
        }();
        config.dom.extent && function () {
            var lastOnclick = config.dom.extent.onclick;

            config.dom.extent.onclick = function (e) {
                lastOnclick && lastOnclick(e);
                me._afterClick && me._afterClick();
                me._drawHelper.startDrawingExtent({
                    callback: function (extent, self) {
                        toolbar.executeListeners({name: 'extentCreated', extent: extent});
                    },
                    strategy: {
                        pickStrategy: pickStrategy
                    }
                });
            }
            // $(config.dom.extent).on('click', function (e) {
            //     me._afterClick && me._afterClick();
            //     me._drawHelper.startDrawingExtent({
            //         callback: function (extent, self) {
            //             toolbar.executeListeners({name: 'extentCreated', extent: extent});
            //         },
            //         strategy: {
            //             pickStrategy: pickStrategy
            //         }
            //     });
            // });
        }();
        config.dom.circle && function () {
            var lastOnclick = config.dom.circle.onclick;

            config.dom.circle.onclick = function (e) {
                lastOnclick && lastOnclick(e);
                me._afterClick && me._afterClick();
                me._drawHelper.startDrawingCircle({
                    callback: function (center, radius, self) {
                        toolbar.executeListeners({name: 'circleCreated', center: center, radius: radius});
                    },
                    strategy: {
                        pickStrategy: pickStrategy
                    }
                });
            }
            // $(config.dom.circle).on('click', function (e) {
            //     me._afterClick && me._afterClick();
            //     me._drawHelper.startDrawingCircle({
            //         callback: function (center, radius, self) {
            //             toolbar.executeListeners({name: 'circleCreated', center: center, radius: radius});
            //         },
            //         strategy: {
            //             pickStrategy: pickStrategy
            //         }
            //     });
            // });
        }();
        config.dom.clear && function () {
            var lastOnclick = config.dom.clear.onclick;

            config.dom.clear.onclick = function (e) {
                lastOnclick && lastOnclick(e);
                me._afterClick && me._afterClick();
            }
            // $(config.dom.clear).on('click', function (e) {
            //     me._afterClick && me._afterClick();
            //
            // });
        }();
        config.dom.cancel && function () {
            var lastOnclick = config.dom.cancel.onclick;

            config.dom.cancel.onclick = function (e) {
                lastOnclick && lastOnclick(e);
                me._afterClick && me._afterClick();
                me._drawHelper.stopDrawing()
            }
            // $(config.dom.cancel).on('click', function (e) {
            //     me._afterClick && me._afterClick();
            //     me._drawHelper.stopDrawing()
            // });
        }();
    } else {
        console.error("传入参数有误！");
        return;
    }
    this._eventInit();
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

ChoiceHelper.prototype._optionReload = function () {

}

ChoiceHelper.prototype._eventInit = function () {
    var me = this;
    me._toolbar.addListener('polygonCreated', function (event) {
        var polygon = new DrawHelper.PolygonPrimitive({
            positions: event.positions,
            material: Cesium.Material.fromType('Checkerboard')
        });

        console.log(event)
        var LatLngPaths = [];

        me.util.getWithDefault(event.positions, []).forEach(function (position, index) {
            LatLngPaths.push(me.util.Cartesian3ToLatLng(position));
        });


        me._filterExecuter(function (entities) {
            var parseEntities = [];
            me.util.getWithDefault(entities, []).forEach(function (entity, index) {
                var latlng = Cesium.Cartographic.fromCartesian(entity.position.getValue(0));
                if (me.util._isInPolygon(latlng, LatLngPaths)) {
                    parseEntities.push(entity);
                }
            });
            return parseEntities;
        })


    });
    // circle.center :  Cartesian3
    // circle.ellipsoid._maximumRadius : number
    // circle.ellipsoid._minimumRadius : number
    me._toolbar.addListener('circleCreated', function (event) {

        // var r = event.radius
        me._filterExecuter(function (entities) {
            var parseEntities = [];

            me.util.getWithDefault(entities, []).forEach(function (entity, index) {
                var latlng = Cesium.Cartographic.fromCartesian(entity.position.getValue(0));
                var groundPosition = Cesium.Cartesian3.fromRadians(latlng.longitude, latlng.latitude, 0.0);
                if (Cesium.Cartesian3.distance(me.util.getCesiumHightZero(event.center), groundPosition) <= event.radius) {
                    parseEntities.push(entity);
                }
            })

            return parseEntities;
        });
    });

    //Cesium.Rectangle.subsample(e.extent)
    me._toolbar.addListener('extentCreated', function (e) {
        var extent = e.extent;

        me._filterExecuter(function (entities) {
            var parseEntities = [];

            me.util.getWithDefault(entities, []).forEach(function (entity, index) {
                var cartesian3ToLatLng = me.util.Cartesian3ToLatLng(entity.position.getValue(0));
                if (extent.west <= cartesian3ToLatLng.longitude && extent.east >= cartesian3ToLatLng.longitude
                    && extent.south <= cartesian3ToLatLng.latitude && extent.north >= cartesian3ToLatLng.latitude) {
                    parseEntities.push(entity);
                }
            })

            return parseEntities;
        });
    });

    me._toolbar.addListener('markerCreated', function (event) {
        me._option.callbacks.marker(event.position);
        // loggingMessage('Marker created at ' + event.position.toString());
        // create one common billboard collection for all billboards
        // var b = new Cesium.BillboardCollection();
        // viewer.scene.primitives.add(b);
        // var billboard = b.add({
        //     show : true,
        //     position : event.position,
        //     pixelOffset : new Cesium.Cartesian2(0, 0),
        //     eyeOffset : new Cesium.Cartesian3(0.0, 0.0, 0.0),
        //     horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
        //     verticalOrigin : Cesium.VerticalOrigin.CENTER,
        //     scale : 1.0,
        //     image: './img/glyphicons_242_google_maps.png',
        //     color : new Cesium.Color(1.0, 1.0, 1.0, 1.0)
        // });
        // billboard.setEditable();
    });
}


ChoiceHelper.prototype.setOption = function (option) {

}

ChoiceHelper.prototype._callBack = function () {

}

ChoiceHelper.prototype._filterExecuter = function (containsCallback) {
    var me = this;
    //选出在圈内的entities
    var containEntities = containsCallback(me._cesiumViewer.entities.values);

    me.util.getWithDefault(me._option.callbacks.choice, []).forEach(function (callback, index) {
        var entities = [];
        //过滤出需要的entity
        me.util.getWithDefault(containEntities, []).forEach(function (entity, index2) {
            if (callback.filter(entity)) entities.push(entity);
        })
        //callback
        callback.onChoice(entities);
    })

};


function Util(viewer) {
    this._viewer = viewer;
    this._ellipsoid = this._viewer.scene.globe._ellipsoid;
}

/**
 * 将Cartesian3转为经纬度
 * @param cartesian3
 * @returns {{height:number,latitude:number,longitude:number}}
 */
Util.prototype.Cartesian3ToLatLng = function (cartesian3) {
    // return  Cesium.Cartographic.fromCartesian(cartesian3);
    return this._ellipsoid.cartesianToCartographic(cartesian3);
}
/**
 * 但是Cesium不支持此类
 * @param cartesian3
 * @return {{height: *, latitude: *, longitude: *}}
 * @constructor
 */
Util.prototype.Cartesian3ToDegrees = function (cartesian3) {
    var cartographic = this._ellipsoid.cartesianToCartographic(cartesian3);
    var degree = {
        height: cartographic.height,
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        longitude: Cesium.Math.toDegrees(cartographic.longitude)
    }
    return degree;
}

Util.prototype.getWithDefault = function (element, defaultElement) {
    return element ? element : defaultElement;
}

/**
 * 获取当前点位的近地点位
 * @param {Cesium.Cartesian3} cartesian3
 * @return {Cesium.Cartesian3}
 */
Util.prototype.getCesiumHightZero = function (cartesian3) {
    var fromCartesian = Cesium.Cartographic.fromCartesian(cartesian3);
    return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
}

/**
 * 修正当前点位的高度
 * @param {Cesium.Cartesian3} cartesian3
 * @param {number} heightPlus
 * @return {Cesium.Cartesian3}
 */
Util.prototype.formatHetightPlusNumber = function (cartesian3, heightPlus) {
    var fromCartesian = Cesium.Cartographic.fromCartesian(cartesian3);
    return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, fromCartesian.height + heightPlus);

}

/**
 *
 * @param position
 * @param paths
 */
Util.prototype._isInPolygon = function (position, paths) {
    var x = position.longitude;
    var y = position.latitude;

    var isum, icount, index = 0;
    var dLon1 = 0, dLon2 = 0, dLat1 = 0, dLat2 = 0, dLon;

    if (paths.size < 3) {
        return false;
    }

    isum = 0;
    icount = paths.length;

    for (index = 0; index < icount - 1; index++) {
        if (index === icount - 1) {
            dLon1 = paths[index].longitude;
            dLat1 = paths[index].latitude;
            dLon2 = paths[0].longitude;
            dLat2 = paths[0].latitude;
        }
        else {
            dLon1 = paths[index].longitude;
            dLat1 = paths[index].latitude;
            dLon2 = paths[index + 1].longitude;
            dLat2 = paths[index + 1].latitude;
        }

        if (((y >= dLat1) && (y < dLat2)) || ((y >= dLat2) && (y < dLat1))) {
            if (Math.abs(dLat1 - dLat2) > 0) {
                dLon = dLon1 - ((dLon1 - dLon2) * (dLat1 - y)) / (dLat1 - dLat2);
                if (dLon < x)
                    isum++;
            }
        }
    }

    return (isum % 2) !== 0;
}


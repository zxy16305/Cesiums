import * as Cesium from "Cesium";
import {ellipsoid} from '../constant/DefaultValue'

export const getExtent = (mn, mx) => {
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
}

export const getExtentCorners = (value) => {
    return ellipsoid.cartographicArrayToCartesianArray([Cesium.Rectangle.northwest(value), Cesium.Rectangle.northeast(value), Cesium.Rectangle.southeast(value), Cesium.Rectangle.southwest(value)]);
}


export const createIconDiv = (id, url, title, callback) => {
    let div = document.createElement('DIV');
    div.className = 'button' + url;
    div.title = title;
    toolbar.appendChild(div);
    div.onclick = callback;
    return div;
}

export const getCesiumHightZero = (cesium3) => {
    var fromCartesian = Cesium.Cartographic.fromCartesian(cesium3);
    return Cesium.Cartesian3.fromRadians(fromCartesian.longitude, fromCartesian.latitude, 0);
}
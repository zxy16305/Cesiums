/**
 * 获取绕某点的圆 SampledPositionProperty
 * @param lon 角度
 * @param lat 角度
 * @param height
 * @param radius
 */
export const computeCirclularFlight = (lon, lat, height, radius) => {
    let property = new Cesium.SampledPositionProperty();
    let startAngle = Cesium.Math.nextRandomNumber() * 360.0;
    let endAngle = startAngle + 360.0;

    let increment = (Cesium.Math.nextRandomNumber() * 2.0 - 1.0) * 10.0 + 45.0;
    for (let i = startAngle; i < endAngle; i += increment) {
        let radians = Cesium.Math.toRadians(i);
        let timeIncrement = i - startAngle;
        let time = Cesium.JulianDate.addSeconds(start, timeIncrement, new Cesium.JulianDate());
        let position = Cesium.Cartesian3.fromDegrees(lon + (radius * 1.5 * Math.cos(radians)), lat + (radius * Math.sin(radians)), height);
        property.addSample(time, position);
    }
    return property;
}

export const computeCirclularFlightPositions = (lon, lat, height, radius) => {
    let positions = [];
    let startAngle = Cesium.Math.nextRandomNumber() * 360.0;
    let endAngle = startAngle + 360.0;

    let increment = (Cesium.Math.nextRandomNumber() * 2.0 - 1.0) * 10.0 + 45.0;
    for (let i = startAngle; i < endAngle; i += increment) {
        let radians = Cesium.Math.toRadians(i);
        let position = Cesium.Cartesian3.fromDegrees(lon + (radius * 1.5 * Math.cos(radians)), lat + (radius * Math.sin(radians)), height);
        positions.push(position);
    }
    return positions;
}

export const computeCirclularAugle = (increment) => {
    let startAngle = Cesium.Math.nextRandomNumber() * 360.0;
    let endAngle = startAngle + 360.0;
    // let increment = (Cesium.Math.nextRandomNumber() * 2.0 - 1.0) * 10.0 + 45.0;

    let angles = [];
    for (let i = startAngle; i < endAngle; i += increment) {
        angles.push(i)
    }
    return angles;
}

export const computeCircle = (radius) => {
    var positions = [];
    for (var i = 0; i < 360; i++) {
        var radians = Cesium.Math.toRadians(i);
        positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
    }
    return positions;
}
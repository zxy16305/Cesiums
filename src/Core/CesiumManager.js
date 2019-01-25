export class CesiumManager {
    constructor() {
        this._Cesium  = window.Cesium;
    }

    get Cesium() {
        return this._Cesium;
    }

    set Cesium(c) {
        this._Cesium = c;
    }
}

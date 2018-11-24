// import * as Cesium from "Cesium";

import {PolyshapeHandler} from "./PolyshapeHandler";

export class PolygonHandler extends PolyshapeHandler{
    start(options, drawHelper){
        super.start(options, drawHelper,true);
    }
}
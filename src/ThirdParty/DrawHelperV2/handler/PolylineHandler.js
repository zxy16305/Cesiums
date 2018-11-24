// import * as Cesium from "Cesium";

import {PolyshapeHandler} from "./PolyshapeHandler";

export class PolylineHandler extends PolyshapeHandler{
    start(options, drawHelper){
        super.start(options, drawHelper,false);
    }
}
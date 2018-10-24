import * as Cesium from "Cesium";

let lastPickObject = null;

export class Scenes {
    static pick(scene,position,fix,fix2){
        if(lastPickObject)
            return lastPickObject;

        lastPickObject = scene.pick(position,fix,fix2);
        setTimeout(()=>{
            lastPickObject = null;
        },100)
        return lastPickObject;
    }


}
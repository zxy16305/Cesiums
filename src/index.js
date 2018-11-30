export const __dirpath = getPathDir();

/**
 * 用于组织管理输出,打包输出的内容依赖此文件的输出
 */
/**Scene*/
export {Cameras} from "./Scene/Cameras"
import "./Scene/Cameras.css"

/**Core*/
export {Cartesian3s} from "./Core/Cartesian3s"
export {EventSystemInstance,EventType} from "./Core/EventSystem"
export {Debugs} from "./Core/Debugs";


/**DataSources*/
export {DazzlingLabelEntity} from "./DataSources/DazzlingLabelEntity"
export {EditableEntity} from "./DataSources/EditableEntity"
export {BuildingHightlightBuilder} from "./DataSources/BuildingHightlightBuilder"


/**Util**/
import * as officialUtils from "./Util/OfficialUtils";
export const OfficialUtils = officialUtils;

/**Widgets**/
export {Settings} from  "./Widgets/Settings";
export {cesium1_50Patch} from  "./Widgets/Patchs";
export {CompassElementBuilder} from "./Widgets/Compass"


/*ThirdParty*/
export {DrawHelper} from "./ThirdParty/DrawHelper"

export {DrawHelper as DrawHelperV2} from "./ThirdParty/DrawHelperV2/DrawHelperV2"

export {ChoiceHelper} from "./ThirdParty/ChoiceHelper"

import "./ThirdParty/DrawHelper.css"

export const debugManager = {
    _debug : false,
    set debug(enable){
        this._debug = enable
    },
    get debug(){
        return this._debug;
    },
    log: function (message) {
        if(this._debug){
            console.groupCollapsed(message)
            console.trace(message)
            console.groupEnd()
        }
    }
}



//遍历script 获取src路径
function getPathDir() {
    let scriptSrc = "";
    let nodeList = document.querySelectorAll("script");
    for(let i = 0; i< nodeList.length;i++){
        if(/Cesiums[^\/]*$/.test(nodeList.item(i).src)){
            scriptSrc = nodeList.item(i).src;
            break;
        }
    }

    return scriptSrc.match(/(.+)\/(Cesiums.js.*|Cesiums.min.js)/)[1];
}


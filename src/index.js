export const __dirpath = getPathDir();

/**
 * 用于组织管理输出,打包输出的内容依赖此文件的输出
 */
/**Scene*/
export {Cameras} from "./Scene/Cameras"
import "./Scene/Cameras.css"

/**Core*/
export {Cartesian3s} from "./Core/Cartesian3s"
export {eventSystem} from "./Core/EventSystem"


/**DataSources*/
export {DazzlingLabelEntity} from "./DataSources/DazzlingLabelEntity"
export {EditableEntity} from "./DataSources/EditableEntity"


/**Util**/
import * as officialUtils from "./Util/OfficialUtils";
export const OfficialUtils = officialUtils;

/**Widgets**/
export {Settings} from  "./Widgets/Settings";


/*ThirdParty*/
import * as drawHelper from "./ThirdParty/DrawHelper";
export const DrawHelper = drawHelper;

export {ChoiceHelper} from "./ThirdParty/ChoiceHelper"

import "./ThirdParty/DrawHelper.css"



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


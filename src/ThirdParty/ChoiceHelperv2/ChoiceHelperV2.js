import * as Cesium from "Cesium";
import {DrawHelper} from "../.."

/**
 * 使用单例模式来写choiceHelper
 */

export class ChoiceHelper {
    constructor(viewer) {
        this._viewer = viewer;
    }

    addChoice({
                  choiceMethod,
                  domElement,
                  filter = () => {
                  },
                  callback: {
                      onChoice = () => {
                      },
                      afterClick = () => {
                      },
                      onComplete = () => {
                      }
                  }
              }) {

    }


}

export const ChoiceMethod = Object.freeze({
    POLYGON: 'polygon',
    MARKER: 'marker',
    EXTENT: 'extent',
    CIRCLE: 'circle',
    CLEAR: 'clear',
    CANCEL: 'cancel'
})
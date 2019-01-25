// import * as Cesium from "Cesium";

import {debugManager} from "../index";

/**
 * cesium 1.50 ， 加载模型时报错的问题
 */
export const cesium1_50Patch = () => {
    if(Cesium.VERSION <"1.50") {
        debugManager.log("cesium版本小于1.50")
        return;
    }

    var fixGltf = function (gltf) {
        if (!gltf.extensionsUsed) {
            return;
        }

        var v = gltf.extensionsUsed.indexOf('KHR_technique_webgl');
        var t = gltf.extensionsRequired.indexOf('KHR_technique_webgl');
        // 中招了。。
        if (v !== -1) {
            gltf.extensionsRequired.splice(t, 1, 'KHR_techniques_webgl');
            gltf.extensionsUsed.splice(v, 1, 'KHR_techniques_webgl');
            gltf.extensions = gltf.extensions || {};
            gltf.extensions['KHR_techniques_webgl'] = {};
            gltf.extensions['KHR_techniques_webgl'].programs = gltf.programs;
            gltf.extensions['KHR_techniques_webgl'].shaders = gltf.shaders;
            gltf.extensions['KHR_techniques_webgl'].techniques = gltf.techniques;
            var techniques = gltf.extensions['KHR_techniques_webgl'].techniques;

            gltf.materials.forEach(function (mat, index) {
                gltf.materials[index].extensions['KHR_technique_webgl'].values = gltf.materials[index].values;
                gltf.materials[index].extensions['KHR_techniques_webgl'] = gltf.materials[index].extensions['KHR_technique_webgl'];

                var vtxfMaterialExtension = gltf.materials[index].extensions['KHR_techniques_webgl'];

                for (var value in vtxfMaterialExtension.values) {
                    var us = techniques[vtxfMaterialExtension.technique].uniforms;
                    for (var key in us) {
                        if (us[key] === value) {
                            vtxfMaterialExtension.values[key] = vtxfMaterialExtension.values[value];
                            delete vtxfMaterialExtension.values[value];
                            break;
                        }
                    }
                }
                ;
            });

            techniques.forEach(function (t) {
                for (var attribute in t.attributes) {
                    var name = t.attributes[attribute];
                    t.attributes[attribute] = t.parameters[name];
                }
                ;

                for (var uniform in t.uniforms) {
                    var name = t.uniforms[uniform];
                    t.uniforms[uniform] = t.parameters[name];
                }
                ;
            });
        }
    }

    try {
        Object.defineProperties(Cesium.Model.prototype, {
            _cachedGltf: {
                set: function (value) {
                    this._vtxf_cachedGltf = value;
                    if (this._vtxf_cachedGltf && this._vtxf_cachedGltf._gltf) {
                        fixGltf(this._vtxf_cachedGltf._gltf);
                    }
                },
                get: function () {
                    return this._vtxf_cachedGltf;
                }
            }
        });
    }catch (e) {
        window.debugMode && console.error(e)
    }
}


export const cancelPrintTitleProviderErrorInCesium1_50 = () => {
    Cesium.TileProviderError.handleError = function (previousError, provider, event, message, x, y, level, retryFunction, errorDetails) {
        var error = previousError;
        if (!defined(previousError)) {
            error = new TileProviderError(provider, message, x, y, level, 0, errorDetails);
        } else {
            error.provider = provider;
            error.message = message;
            error.x = x;
            error.y = y;
            error.level = level;
            error.retry = false;
            error.error = errorDetails;
            ++error.timesRetried;
        }

        if (event.numberOfListeners > 0) {
            event.raiseEvent(error);
        } else {
            // console.log('An error occurred in "' + provider.constructor.name + '": ' + formatError(message));
        }

        if (error.retry && defined(retryFunction)) {
            retryFunction();
        }

        return error;
    };

}

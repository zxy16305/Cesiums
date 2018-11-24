// import * as Cesium from "Cesium";
import {createIconDiv} from "../util/constructHelper"
import {
    defaultPolygonOptions,
    defaultPolylineOptions,
    defaultExtentOptions,
    defaultCircleOptions,
    defaultPickStrategy
} from "../constant/DefaultValue"

import {fillOptions} from "../util/util"
import {enhanceWithListeners} from  '../util/EventHelper'

export class DrawHelperWidget {
    constructor(drawHelper, options) {
        // container must be specified
        if (!(Cesium.defined(options.container))) {
            throw new Cesium.DeveloperError('Container is required');
        }

        var drawOptions = {
            markerIcon: " marker",
            polylineIcon: " polyline",
            polygonIcon: " polygon",
            circleIcon: " circle",
            extentIcon: " extent",
            clearIcon: " clear",
            polylineDrawingOptions: defaultPolylineOptions,
            polygonDrawingOptions: defaultPolygonOptions,
            extentDrawingOptions: defaultExtentOptions,
            circleDrawingOptions: defaultCircleOptions,
            strategy: {
                pickStrategy: options.pickStrategy ? options.pickStrategy : defaultPickStrategy
            }
        };
        fillOptions(options, drawOptions);

        let toolbar = document.createElement('DIV');
        toolbar.className = "toolbar";
        options.container.appendChild(toolbar);

        let scene = drawHelper._scene;


        options.buttons.indexOf("marker") !== -1 && createIconDiv(toolbar, 'marker', options.markerIcon, 'Click to start drawing a 2D marker',  () =>{
            typeof options.clickCallback === 'function' &&
            options.clickCallback({
                name: 'markerClick'
            });

            drawHelper.startDrawingMarker({
                callback:  (position) =>{
                    _self.executeListeners({name: 'markerCreated', position: position});
                },
                strategy: options.strategy
            });
        })

        options.buttons.indexOf("polyline") !== -1 && createIconDiv(toolbar, 'polyline', options.polylineIcon, 'Click to start drawing a 2D polyline',  ()=> {
            typeof options.clickCallback === 'function' &&
            options.clickCallback({
                name: 'polylineClick'
            });

            drawHelper.startDrawingPolyline({
                callback:  (positions) =>{
                    this.executeListeners({name: 'polylineCreated', positions: positions});
                },
                strategy: options.strategy
            });
        })

        options.buttons.indexOf("polygon") !== -1 && createIconDiv(toolbar, 'polygon', options.polygonIcon, 'Click to start drawing a 2D polygon',  () =>{
            typeof options.clickCallback === 'function' &&
            options.clickCallback({
                name: 'polygonClick'
            });

            drawHelper.startDrawingPolygon({
                callback:  (positions) =>{
                    this.executeListeners({name: 'polygonCreated', positions: positions});
                },
                strategy: options.strategy
            });
        })

        options.buttons.indexOf("extent") !== -1 && createIconDiv(toolbar, 'extent', options.extentIcon, 'Click to start drawing an Extent',  ()=> {
            typeof options.clickCallback === 'function' &&
            options.clickCallback({
                name: 'extentClick'
            });

            drawHelper.startDrawingExtent({
                callback:  (extent)=> {
                    this.executeListeners({name: 'extentCreated', extent: extent});
                },
                strategy: options.strategy
            });
        })

        options.buttons.indexOf("circle") !== -1 && createIconDiv(toolbar, 'circle', options.circleIcon, 'Click to start drawing a Circle',  ()=> {
            typeof options.clickCallback === 'function' &&
            options.clickCallback({
                name: 'circleClick'
            });

            drawHelper.startDrawingCircle({
                callback:  (center, radius) =>{
                    this.executeListeners({name: 'circleCreated', center: center, radius: radius});
                },
                strategy: options.strategy
            });
        })

        // add a clear button at the end
        // add a divider first
        let div = document.createElement('DIV');
        div.className = 'divider';
        toolbar.appendChild(div);

        options.buttons.indexOf("clear") !== -1 &&
        createIconDiv(toolbar, 'clear', options.clearIcon, 'Remove all primitives',  ()=> {
            typeof options.clickCallback === 'function' &&
            options.clickCallback({
                name: 'clearClick'
            });

            scene.primitives.removeAll();
        });

        enhanceWithListeners(this);

    }


}



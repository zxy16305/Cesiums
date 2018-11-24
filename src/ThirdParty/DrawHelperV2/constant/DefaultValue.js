// import * as Cesium from "Cesium";
import {copyOptions} from "../util/util"

export const ellipsoid = Cesium.Ellipsoid.WGS84;

var material = Cesium.Material.fromType(Cesium.Material.ColorType);
material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 0.5);

export const defaultPickStrategy = (position, viewer) => {
    return viewer.scene.camera.pickEllipsoid(position);
}

export const defaultShapeOptions = {
    ellipsoid: Cesium.Ellipsoid.WGS84,
    textureRotationAngle: 0.0,
    height: 0.0,
    asynchronous: true,
    show: true,
    debugShowBoundingVolume: false,
    strategy: {
        pickStrategy: defaultPickStrategy
    }
}

export const defaultSurfaceOptions = copyOptions(defaultShapeOptions, {
    appearance: new Cesium.EllipsoidSurfaceAppearance({
        aboveGround: false
    }),
    material: material,
    granularity: Math.PI / 180.0,
    strategy: {
        pickStrategy: defaultPickStrategy
    }
});

export const defaultPolygonOptions = copyOptions(defaultShapeOptions, {});
export const  defaultExtentOptions = copyOptions(defaultShapeOptions, {});
export const  defaultCircleOptions = copyOptions(defaultShapeOptions, {});
export const  defaultEllipseOptions = copyOptions(defaultSurfaceOptions, {rotation: 0});

export const  defaultPolylineOptions = copyOptions(defaultShapeOptions, {
    width: 5,
    geodesic: true,
    granularity: 10000,
    appearance: new Cesium.PolylineMaterialAppearance({
        aboveGround: false
    }),
    material: material
});

export const defaultBillboard = {
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAABbElEQVQoU2NkIAEwwtR6enqyc3Jy6jEzMyv9//+fl5GR8fPfv3/vff/+/dL27dt/gtSBFYMUcnBwePj4+ARYW1u7cHFxiX/9+vXl0aNH92zdunXDjx8/doA0gBV7eXmZ+/r6Zjo4OMR+//6dCWYbOzv7v3379i3evn379G3btp0EK3Z3d49tampq//79u/T///8Zfv36xfD792+Gf//+MbCwsDydOHFi5c6dOxeDFTs5OeV0dHT0vXr1ivXLl28Mf//+gXubjY3t9/Tp04r27ds3BazYysoqsaqqtuX7919S6IHz7dvXZzNnTqk5duzYfLBiY2NjG2dnt2w7O9ewf//+wd38/z/Dv717t686evTA1LNnzx4BK3ZwcOB49epViKOju7+NjYsNHx+/yKdPH94cPrz3yIEDOzeKiYmtOXDgwA94OMvIyHB+//7d+v///7oMDAwCDAwMHxgZGS9zcnIeffLkyXd4OBMbiQDHU6AM+91hMQAAAABJRU5ErkJggg==",
    shiftX: 0,
    shiftY: 0,
    strategy: {
        pickStrategy: defaultPickStrategy
    }
}

export const dragBillboard = {
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAABbElEQVQoU2NkIAEwwtR6enqyc3Jy6jEzMyv9//+fl5GR8fPfv3/vff/+/dL27dt/gtSBFYMUcnBwePj4+ARYW1u7cHFxiX/9+vXl0aNH92zdunXDjx8/doA0gBV7eXmZ+/r6Zjo4OMR+//6dCWYbOzv7v3379i3evn379G3btp0EK3Z3d49tampq//79u/T///8Zfv36xfD792+Gf//+MbCwsDydOHFi5c6dOxeDFTs5OeV0dHT0vXr1ivXLl28Mf//+gXubjY3t9/Tp04r27ds3BazYysoqsaqqtuX7919S6IHz7dvXZzNnTqk5duzYfLBiY2NjG2dnt2w7O9ewf//+wd38/z/Dv717t686evTA1LNnzx4BK3ZwcOB49epViKOju7+NjYsNHx+/yKdPH94cPrz3yIEDOzeKiYmtOXDgwA94OMvIyHB+//7d+v///7oMDAwCDAwMHxgZGS9zcnIeffLkyXd4OBMbiQDHU6AM+91hMQAAAABJRU5ErkJggg==",
    shiftX: 0,
    shiftY: 0
}

export const dragHalfBillboard = {
    iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAALCAYAAACprHcmAAABCklEQVQoU5XRMUiEcBTH8e8/iBQMAoXAULBRqTWwGxvaagi3GxqjpragMWhrKhobbpOG2hoaL6G18MYTlIRAIUjQCDKU7mhwqDd/Hvze7wn+MWJi67qeA1aBZWAeeAfGwJMQ4qNxLf6Bm8A2sAEsAq/APXAD3DULE7wG7AF9YOZXsi9gAFwKIR5bXJZlX5KkU2Cp44SXqqqOZFketDjLsgNVVc+A2Q78mef5oaZp5y2O43jXMIwTQO/AaZIkx6ZpXrU4DMOebdv7gNeR2R+NRheO4wxbHEWRlKbpjuu6W0AP0Jp0wDAIgltd168ty6qmPfu+LxdFsQ6sAAvAG/CsKMqD53nltOe/PvEbmPRTDApQ3d8AAAAASUVORK5CYII=",
    shiftX: 0,
    shiftY: 0
}
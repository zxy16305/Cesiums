

# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2019-1-15 软件版本  v1.0.0.11
### 更新功能说明
1. [update] 更新二版可拖动坐标系 ，固定为屏幕尺寸
2. [update] EventSystemV2 , 使drop在drag end之前调用，符合html规范。。
3. [fix] 注意pickPosition遇到drillPick [drillPick doesn't play well with pickPosition on 3D tilesets](https://github.com/AnalyticalGraphicsInc/cesium/issues/5622)

### 数据库变更
### 配置文件的变更
### 软件依赖及适配说明

# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2019-1-11 软件版本  v1.0.0.10
### 更新功能说明

1. [fix] 修复runOnce系列没有清除绑定的事件
2. [add] EventSystemV2 , 支持多viewer管理， 修改drag绑定逻辑（按下对象存在）

### 数据库变更
### 配置文件的变更
### 软件依赖及适配说明


# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2019-1-10 软件版本  v1.0.0.9
### 更新功能说明

1. 添加在按下和缩放执行一次的方法,以 `flyAroundPosition`为例
```javascript
Cesiums.Cameras.runFunAtLeftDownAndZoomOnce(
    Cesiums.Cameras.flyAroundPosition(viewer.scene.camera, pos, 50, 30, 0.2),//在缩放和拖动时调用返回的停止方法
    viewer
);
```
### 数据库变更
### 配置文件的变更
### 软件依赖及适配说明

# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2019-1-7 软件版本  v1.0.0.8
### 更新功能说明

1. 加入 `Settings.cancelErrorPanel(func:(title,content,error,originalFunction)=>{})`，可取代报错窗口

### 数据库变更
### 配置文件的变更
### 软件依赖及适配说明

# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2019-1-7 软件版本  v1.0.0.7
### 更新功能说明

1. 内置drawhelper的mousemove加入时间节流

### 数据库变更
### 配置文件的变更
### 软件依赖及适配说明

# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2019-1-2 软件版本  v1.0.0.6
### 更新功能说明

1. 添加可拖动坐标系 `Cesiums.DraggableCoordinate` ,用于点位拖动和模型拖动
2. 增加轻量级的事件工具 `Cesiums.EventUtils`

### 数据库变更
### 配置文件的变更
### 软件依赖及适配说明


# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2018-12-05 软件版本  v1.0.0.5
### 更新功能说明

1. 添加在拖动和缩放执行一次的方法,以 `flyAroundPosition`为例
```javascript
Cesiums.Cameras.runFunAtDragAndZoomOnce(
    Cesiums.Cameras.flyAroundPosition(viewer.scene.camera, pos, 50, 30, 0.2),//在缩放和拖动时调用返回的停止方法
    viewer
);
```
2. 覆盖了地图瓦片日志打印，需要调用
```javascript
cancelPrintTitleProviderErrorInCesium1_50();
```

### 数据库变更
### 配置文件的变更
### 软件依赖及适配说明



# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2018-11-30 软件版本  v1.0.0.4
### 更新功能说明
1. 提取EditableEntity,使用方法:
```javascript
    var editableEntity = new Cesiums.EditableEntity({//config与entity一致
        id: 'icon-123451',
        position: pos1,
        // 图标
        billboard: {
            image: 'images/icon_dl.png'
        },
        // 文字标签
        label: {
            pixelOffset: new Cesium.Cartesian2(0, 30),
            fillColor: Cesium.Color.WHITE,
            outlineColor: new Cesium.Color.fromCssColorString('#191970'),
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            font: '24px Helvetica',
            text: '可移动'
        }
    });
    editableEntity.setViewer(viewer);//不同点，为了绑定内部事件
    //开启拖动编辑
    editableEntity.setEditable();
    //关闭拖动编辑
    editableEntity.setEditable(false);
```
### 数据库变更
### 配置文件的变更
### 软件依赖及适配说明


# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2018-11-30 软件版本  v1.0.0.2
### 更新功能说明
1. 内部drawhelper从umd方式改为es6
### 数据库变更
### 配置文件的变更
### 软件依赖及适配说明

![](.CHANGE_LOG_images\8c61bfa6.png)

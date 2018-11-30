# 版本更新记录
## 提交人 ：张琪伟  提交时间 ：2018-11-30 软件版本  v1.0.0.3
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



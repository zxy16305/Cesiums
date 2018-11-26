/**
 * 1. 更新package.json版本号(外部控制)
 * 2. 打包至对应路径 并加入version.md 与 CHANGE_LOG.md 及 md对应的图片
 * 3. jsdoc生成 //TODO
 */

let config = require("./config");
let utils = require("./utils");
let fs = require("fs");
let fse = require("fs-extra");
let path = require("path");
let versionExport = require("./versionExport");
let info = require("../package");
let timestamp = require('moment')().format('YYMMDDHHmmss');
var compressing = require("compressing");
//
let exportFileName = `${info.name}_r${info.version}-${timestamp}.zip`;
let tempDir = `${config.napeShotPath}/${timestamp}/${info.name}`;

fse.emptyDirSync(tempDir)
fse.ensureDirSync(config.napeShotPath, "0o777");

//copy
config.packageDirs.forEach((dir) => {
    // console.log(`${path.basename(dir)}`)
    if (fs.existsSync(dir)) {
        fse.copySync(dir, `${tempDir}/${path.basename(dir)}`);
    } else {
        console.log(`${dir} not exist`)
    }
})

config.packageFiles.forEach((file) => {
    // console.log(`${path.basename(file)}`)
    if (fs.existsSync(file)) {
        fse.copySync(file, `${tempDir}/${path.basename(file)}`);
    } else {
        console.log(`${file} not exist`)
    }
})
//version
versionExport.export(tempDir, exportFileName);

//compress && remove temp
compressing.zip.compressDir(tempDir, `${config.napeShotPath}/${exportFileName}`)
    .then((error) => {
        if (error) {
            console.error(error)
        }
        fse.removeSync(`${config.napeShotPath}/${timestamp}`)
    })


let packageInfo = require("../package");
let config = {
    releasePathDir: "F://Ashe/nodejs/release",
    napeShotPathDir: "F://Ashe/nodejs/update",
    packageDirs: ["./dist/resources","./doc/.CHANGE_LOG_images"],
    packageFiles: ["./doc/CHANGE_LOG.md", "./dist/Cesiums.css", "./dist/Cesiums.min.css", "./dist/Cesiums.js", "./dist/Cesiums.min.js", "./dist/Cesiums.min.js.map"]
}


module.exports = {
    ...config,
    releasePath: `${config.releasePathDir}/${packageInfo.name}/v${packageInfo.version}`,
    napeShotPath: `${config.napeShotPathDir}/${packageInfo.name}/v${packageInfo.version}`,
}

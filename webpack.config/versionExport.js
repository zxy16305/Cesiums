let packageInfo = require("../package");
let fs = require('fs');


module.exports.export = ( dir = "../dist" ,message = `${packageInfo.name}_r${packageInfo.version}`) => {
    fs.writeFile(`${dir}/version.md`, message, "utf-8", (error) => {
        if (error) console.error(error);
        else console.log("version.md已输出");
    })
}

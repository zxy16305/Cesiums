var info = require(`./package`);

module.exports = {
    //项目打包输出主目录
    outputDir: "E:\\WebProjects",
    //打包时间戳
    time: new Date(),
    //临时目录
    tempDir: `temp${new Date().getTime()}`,
    //打包文件，key为目录（压缩包内部）,value为文件的数组，相对路径和绝对路径皆可
    packFiles: {//to : froms
        ".": ["README.md", "doc\\CHANGE_LOG.md"],
        ".CHANGE_LOG_images":["doc\\.CHANGE_LOG_images"]
    },
    //打包文件夹，只会复制文件夹的内容
    packDirs: {
        ".": ["build", "dist"]
    },
    //版本
    version: info.version,
    //项目名，目前会去掉scope
    projectName: info.name
}

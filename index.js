'use strict';
const _url = require('url');
const _path = require('path');
const _fs = require('fs');

const indexOf = (arr, item)=>{
  for(let i= 0, len = arr.length; i < len; i++){
    if(item == arr[i]){
      return i
    }
  }
  return -1
}

function isIgnore(ignoreRules, path){
    if(!ignoreRules){return false}
    ignoreRules = [].concat(ignoreRules)
    for(let i = 0, len = ignoreRules.length; i < len; i++){
        if(path.indexOf(ignoreRules[i]) != "-1"){
            return true
        }else{
            let reg = new RegExp(ignoreRules[i])
            if(reg.test(path)){
                return true
            }
        }
    }
    return false
}
//忽略灰度
function willBuildHook(buildConfig, cb){
    if(!buildConfig.ignore){
        buildConfig.ignore = []
    }
    buildConfig.ignore.push(".+\.gray\.[A-z]+$")
    cb(null, buildConfig)
}

exports.registerPlugin = function(cli, options){
    options = options ||{}
    if(indexOf(process.argv, "-G") == -1){
        cli.log.info("未使用 -G 参数，忽略灰度替换")
        cli.registerHook("build:willBuild", willBuildHook)
        return
    }
    let hbsRoot = cli.options.pluginsConfig["sp-hbs"] ?  cli.options.pluginsConfig["sp-hbs"].root : ""
    cli.registerHook('route:didRequest', (req, data, content, cb)=>{
        let pathname = req.path
        let ext = _path.extname(pathname)
        let probable = []
        let reg;
        let root = ""
        switch(ext){
            case ".html":
                root = hbsRoot
                reg = /html$/
                probable = ["hbs", "html"]
                break;
            case ".js":
                reg = /js$/
                probable = ["js", "es6", "coffee", "ts"]
                break
            case ".css":
                reg = /css$/
                probable = ["css", "less", "scss", "sass"]
                break
        }
        if(isIgnore(options.ignore, pathname)){
            return cb(null, content)
        }
      
        let fakeFilePath = _path.join(cli.cwd(), root, pathname).replace("/", _path.sep);
        for(let i =0, len = probable.length; i < len; i++){
            let probableFile =  fakeFilePath.replace(reg, `gray.${probable[i]}`)
            if(_fs.existsSync(probableFile)){
                data.realPath =  req.path = pathname.replace(reg, `gray${ext}`)
                break
            }
        }
        cb(null, content)
    }, -1)
    //覆盖
    cli.registerHook('build:doCompile', (buildConfig, data, content, cb)=>{
        console.log(data)
        let inputFilePath = data.inputFilePath
        let outputFilePath = data.outputFilePath
        if(/.+\.gray\.[A-z]+$/.test(inputFilePath)){
            data.outputFilePath = outputFilePath.replace(/\.gray\.([A-z]+)$/, ".$1")
            data.outputFileRelativePath = data.outputFileRelativePath.replace(/\.gray\.([A-z]+)$/, ".$1")
        }else{
            let tempGrayFilePath = inputFilePath.replace(/\.([A-z]+)$/, ".gray.$1")
            if(_fs.existsSync(tempGrayFilePath)){
                data.ignore = true
            }
        }
        cb(null, content)
    },1)
}
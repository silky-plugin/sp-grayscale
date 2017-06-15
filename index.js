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

exports.registerPlugin = function(cli, options){
    if(indexOf(process.argv, "-G") == -1){
        cli.log.info("未使用 -G 参数，忽略灰度替换")
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
                probable = ["js", "es6", "coffee"]
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
                req.path = pathname.replace(reg, `gray${ext}`)
                console.log(req.path , 1)
                break
            }
        }
        cb(null, content)
    }, -1)
}
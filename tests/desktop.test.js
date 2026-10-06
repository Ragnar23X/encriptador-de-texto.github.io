'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
test('desktop sandbox blocks remote requests, navigation, windows and permissions',async()=>{
  let ready, options, request, permission, permissionCheck, popup, loaded;
  const events={};
  class BrowserWindow {
    constructor(config){options=config;this.webContents={setWindowOpenHandler:fn=>popup=fn,on:(event,fn)=>events[event]=fn};}
    on(){} loadFile(file){loaded=file;} static getAllWindows(){return [];}
  }
  const electron={app:{whenReady:()=>({then:fn=>ready=fn}),on(){},quit(){}},BrowserWindow,session:{fromPartition:partition=>{
    assert.equal(partition,'vault-memory');
    return {setPermissionRequestHandler:fn=>permission=fn,setPermissionCheckHandler:fn=>permissionCheck=fn,webRequest:{onBeforeRequest:fn=>request=fn}};
  }}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../desktop/main.cjs'),'utf8'),{
    require:name=>name==='electron'?electron:require(name),__dirname:path.join(__dirname,'../desktop'),process
  });
  await ready();
  assert.equal(options.webPreferences.nodeIntegration,false);
  assert.equal(options.webPreferences.contextIsolation,true);
  assert.equal(options.webPreferences.sandbox,true);
  assert.equal(options.webPreferences.webSecurity,true);
  assert.equal(popup().action,'deny');
  for(const event of ['will-navigate','will-attach-webview']) {
    let prevented=false;events[event]({preventDefault(){prevented=true;}});assert.ok(prevented);
  }
  for(const url of ['https://example.com/','file:///etc/passwd']) {
    request({url},result=>assert.equal(result.cancel,true));
  }
  request({url:pathToFileURL(loaded).href},result=>assert.equal(result.cancel,false));
  permission(null,'camera',allowed=>assert.equal(allowed,false));
  assert.equal(permissionCheck(),false);
});

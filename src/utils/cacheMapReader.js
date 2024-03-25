import fs from "node:fs";
import path from "pathe";
import zlib from "node:zlib";

export default class CacheMapReader {
  constructor(processCwd) {
    //if processCwd ends with .reejs, then remove it
    if(processCwd.endsWith(".reejs")) {
      processCwd = processCwd.slice(0, -6);
    }
    this.OLDcacheMapPath = path.join(processCwd, ".reejs", "cache", "cache.json");
    this.cacheMapPath = path.join(processCwd, ".reejs", "cache", "cache.bin");
  }

  updateOldToNew() {
    try {
      console.log("%c[REEJS] %cUpdating cache map from old to new. This makes Reejs installation smaller over time.", "color: green; font-weight: bold", "color: yellow");
      const cacheMap = JSON.parse(fs.readFileSync(this.OLDcacheMapPath, "utf-8"));
      fs.writeFileSync(this.cacheMapPath, zlib.brotliCompressSync(Buffer.from(JSON.stringify(cacheMap))));
      fs.unlinkSync(this.OLDcacheMapPath);
      console.log("%c[REEJS] %cCache map successfully updated.", "color: green; font-weight: bold", "color: green");
    } catch (e) {
      console.log("%c[REEJS] %cError while updating cache map from old to new.", "color: red", "color: yellow");
      //check if error is related to json parsing, then dont say user to report the issue, else say to report the issue
      if (e instanceof SyntaxError) {
        console.log("%c[REEJS] %cError is related to json parsing, proceeding to ignore the old cache.", "color: red", "color: yellow");
      }
      else {
        console.log("%c[REEJS] %cPlease report this issue over Github!", "color: red", "color: yellow");
        throw e;
      }
    }
  }

  read() {
    if(fs.existsSync(this.OLDcacheMapPath)) {
      this.updateOldToNew();
    }
    if(!fs.existsSync(this.cacheMapPath)) {
      return {};
    }
    try{
    return JSON.parse(zlib.brotliDecompressSync(fs.readFileSync(this.cacheMapPath)).toString());
    } catch(e) {
      console.log("%c[REEJS] %cError while reading cache map. Looks like corrupted?", "color: red", "color: yellow");
      console.log(e);
    }
  }
  write(data) {
    try{
    fs.writeFileSync(this.cacheMapPath, zlib.brotliCompressSync(Buffer.from(data)));
    }catch(e){
      console.log("%c[REEJS] %cError while writing cache map. Permission issue or something maybe?", "color: red", "color: yellow");
      console.log(e);
    }
  }
}
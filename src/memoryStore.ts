import {Store} from "./store"
let RemoveIdle = require("latte_removeIdle")
let latte_lib = require("latte_lib")

class MemoryStore  implements Store {
    opts: any;
    sessions: any;
    removeIdle: any;
    constructor(opts) {
        let self = this;
        this.removeIdle = new RemoveIdle({
            destroy: function(object) {
                if(self.sessions[object]) {
                    console.log('delete', object);
                    delete self.sessions[object];
                    self.save();
                }
            },
            idleTimeoutMillis: opts.timeout ||  1000 * 10
        });
        this.opts = opts || {};
        this.opts.path = this.opts.path || ".session.latte";
        this.load();
        for(let i in this.sessions) {
            this.removeIdle.release(i);
        }
    };
    get(key:string, callback) {
        let value = this.sessions[key];
        if(value) {
            this.removeIdle.getIdle(key);
        }
        callback && callback(null, value);
    };
    set(key:string,value:any, callback) {
        this.sessions[key] = value;
        this.removeIdle.release(key);
        this.save();
        callback && callback(null, 1);
    };
    del(key:string, callback) {
        let value = this.sessions[key];
        this.removeIdle.getIdle(key);
        delete this.sessions[key];
        this.save();
        callback && callback();
    }
    load() {
        let result = latte_lib.fs.existsSync(this.opts.path);
        if(!result) {
            this.sessions = {};
            return;
        }
        let data = latte_lib.fs.readFileSync(this.opts.path);
        
        try {
            this.sessions = JSON.parse(data);
        }catch(err) {
            this.sessions = {};
        }
    }
    save() {
        latte_lib.fs.writeFileSync(this.opts.path,JSON.stringify(this.sessions));
    }
};

export function create(opts) {
    return new MemoryStore(opts); 
}
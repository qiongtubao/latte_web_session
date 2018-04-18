import {Store} from "./store"
let RemoveIdle = require("latte_removeIdle")
let latte_lib = require("latte_lib")

class MemoryStore extends Store {
    opts: any;
    sessions: any;
    removeIdle: any;
    constructor(opts) {
        super();
        this.opts = opts || {};
        this.opts.path = this.opts.path || ".session.latte";
        this.load();
        let self = this;
        this.removeIdle = new RemoveIdle({
            destroy: function(object) {
                console.log(object);
                for(let i in self.sessions) {
                    if(self.sessions[i] == object) {
                        console.log('delete');
                        delete self.sessions[i];
                        self.save();
                    }
                }
            },
            idleTimeoutMillis: opts.timeout ||  1000 * 10
        });
        for(var i in self.sessions) {
            this.removeIdle.release(this.sessions[i]);
        }
        this.removeIdle.dispense();
    };
    get(key:string, callback) {
        let value = this.sessions[key];
        if(value) {
            this.removeIdle.getIdle(value);
        }
        callback && callback(null, value);
    };
    set(key:string,value:any, callback) {
        this.sessions[key] = value;
        this.removeIdle.release(value);
        this.save();
        callback && callback(null, 1);
    };
    del(key:string, callback) {
        let value = this.sessions[key];
        this.removeIdle.getIdle(value);
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
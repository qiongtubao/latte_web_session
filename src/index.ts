
import {create as MemoryStore} from './memoryStore';
import {Store} from './store';
let crypto = require('crypto');
let UIDCHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
let tostr = (bytes) => {
    let chars, r;
    r = [];
    for(let i = 0; i < bytes.length; i++) {
        r.push(UIDCHARS[bytes[i] % UIDCHARS.length]);
    }
    return r.join("");
}
let uid = (length, cb:any) =>{
    if(typeof cb === "undefined") {
        return tostr(crypto.pseudoRandomBytes(length));
    } else {
        crypto.pseudoRandomBytes(length, function(err, bytes) {
            if(err) return cb(err);
            cb(null, tostr(bytes));
        });
    }
}
class Session {
    id: string;
    data: any;
    isChange: boolean;
    constructor(id) {
        this.id = id;
        this.data = {};
    }
    setData(data) {
        this.data = data;
        this.isChange = true;
    }
}
class SessionUtil {
    key: string;
    store: Store;
    useAjaxKey: string;
    timeout: number;
    constructor(opts) {
        this.key = opts.key || "latte.sid";
        this.timeout = opts.timeout || 60 * 60 * 1000;
        this.store = opts.store ||  MemoryStore({timeout: opts.timeout});
        this.useAjaxKey = opts.useAjaxKey;
    };
    before() {
        let self = this;
        return (ctx, next) => {
            if(!ctx.cookie) {
                throw new Error('you must bind cookie module');
            }
            let key = ctx.cookie.get(this.key);
            if(!key && this.useAjaxKey) {
                key = ctx.gets[this.useAjaxKey] || ctx.posts[this.useAjaxKey];
            }
            ctx.sessionStore = this.store;
            let createSession = (oldKey:any)=> {
                key = oldKey || uid(24, undefined);
                /*
                ctx.cookie.set(self.key, key, {
                    expires: new Date(Date.now() + self.timeout)
                });
                */
               ctx.session = new Session(key);
               next();
            }
            if(!key) {
                return createSession(undefined);
            }else{
                self.store.get(key, function(err, data) {
                    if(err) { throw err; }
                    if(!data) {
                        return createSession(key);
                    }
                    ctx.session = new Session(key);
                    ctx.session.data = data;
                    next();
                });
            }
        }
        
    };
    after() {
        let self = this;
        return (ctx, next) => {
            //需要在cookie的after前面执行
            ctx.cookie.set(this.key, ctx.session.id, {
                expires: new Date(Date.now() + this.timeout)
            })
            if(ctx.session && ctx.session.isChange) {
                self.store.set(ctx.session.id, ctx.session.data, (err, result) => {
                    if(err) {
                        throw err; 
                    }
                    next();
                });
            }else{
                next();
            }
        }
        
    };
};
export function create(opts) {
    return new SessionUtil(opts);
}
let stores = {
    memoryStore: MemoryStore
};
export function createStore(type, opts) {
    if(stores[type]) {
        return stores[type](opts);
    }
    return null;
}
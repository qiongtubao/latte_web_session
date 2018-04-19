"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RemoveIdle = require("latte_removeidle");
var latte_lib = require("latte_lib");
var MemoryStore = (function () {
    function MemoryStore(opts) {
        var self = this;
        this.removeIdle = new RemoveIdle({
            destroy: function (object) {
                if (self.sessions[object]) {
                    console.log('delete', object);
                    delete self.sessions[object];
                    self.save();
                }
            },
            idleTimeoutMillis: opts.timeout || 1000 * 10
        });
        this.opts = opts || {};
        this.opts.path = this.opts.path || ".session.latte";
        this.load();
        for (var i in this.sessions) {
            this.removeIdle.release(i);
        }
    }
    ;
    MemoryStore.prototype.get = function (key, callback) {
        var value = this.sessions[key];
        if (value) {
            this.removeIdle.getIdle(key);
        }
        callback && callback(null, value);
    };
    ;
    MemoryStore.prototype.set = function (key, value, callback) {
        this.sessions[key] = value;
        this.removeIdle.release(key);
        this.save();
        callback && callback(null, 1);
    };
    ;
    MemoryStore.prototype.del = function (key, callback) {
        var value = this.sessions[key];
        this.removeIdle.getIdle(key);
        delete this.sessions[key];
        this.save();
        callback && callback();
    };
    MemoryStore.prototype.load = function () {
        var result = latte_lib.fs.existsSync(this.opts.path);
        if (!result) {
            this.sessions = {};
            return;
        }
        var data = latte_lib.fs.readFileSync(this.opts.path);
        try {
            this.sessions = JSON.parse(data);
        }
        catch (err) {
            this.sessions = {};
        }
    };
    MemoryStore.prototype.save = function () {
        latte_lib.fs.writeFileSync(this.opts.path, JSON.stringify(this.sessions));
    };
    return MemoryStore;
}());
;
function create(opts) {
    return new MemoryStore(opts);
}
exports.create = create;

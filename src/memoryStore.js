"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var store_1 = require("./store");
var RemoveIdle = require("latte_removeIdle");
var latte_lib = require("latte_lib");
var MemoryStore = /** @class */ (function (_super) {
    __extends(MemoryStore, _super);
    function MemoryStore(opts) {
        var _this = _super.call(this) || this;
        _this.opts = opts || {};
        _this.opts.path = _this.opts.path || ".session.latte";
        _this.load();
        var self = _this;
        console.log(opts.timeout);
        _this.removeIdle = new RemoveIdle({
            destroy: function (object) {
                console.log(object);
                for (var i_1 in self.sessions) {
                    if (self.sessions[i_1] == object) {
                        console.log('delete');
                        delete self.sessions[i_1];
                        self.save();
                    }
                }
            },
            idleTimeoutMillis: opts.timeout || 1000 * 10
        });
        for (var i in self.sessions) {
            _this.removeIdle.release(_this.sessions[i]);
        }
        _this.removeIdle.dispense();
        return _this;
    }
    ;
    MemoryStore.prototype.get = function (key, callback) {
        var value = this.sessions[key];
        if (value) {
            this.removeIdle.getIdle(value);
        }
        callback && callback(null, value);
    };
    ;
    MemoryStore.prototype.set = function (key, value, callback) {
        this.sessions[key] = value;
        this.removeIdle.release(value);
        this.save();
        callback && callback(null, 1);
    };
    ;
    MemoryStore.prototype.del = function (key, callback) {
        var value = this.sessions[key];
        this.removeIdle.getIdle(value);
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
}(store_1.Store));
;
function create(opts) {
    return new MemoryStore(opts);
}
exports.create = create;

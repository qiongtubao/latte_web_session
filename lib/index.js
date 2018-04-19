"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var memoryStore_1 = require("./memoryStore");
var crypto = require('crypto');
var UIDCHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var tostr = function (bytes) {
    var chars, r;
    r = [];
    for (var i = 0; i < bytes.length; i++) {
        r.push(UIDCHARS[bytes[i] % UIDCHARS.length]);
    }
    return r.join("");
};
var uid = function (length, cb) {
    if (typeof cb === "undefined") {
        return tostr(crypto.pseudoRandomBytes(length));
    }
    else {
        crypto.pseudoRandomBytes(length, function (err, bytes) {
            if (err)
                return cb(err);
            cb(null, tostr(bytes));
        });
    }
};
var Session = (function () {
    function Session(id) {
        this.id = id;
        this.data = {};
    }
    Session.prototype.setData = function (data) {
        this.data = data;
        this.isChange = true;
    };
    Session.prototype.getData = function (data) {
        return this.data;
    };
    return Session;
}());
var SessionUtil = (function () {
    function SessionUtil(opts) {
        this.key = opts.key || "latte.sid";
        this.timeout = opts.timeout || 60 * 60 * 1000;
        this.store = opts.store || memoryStore_1.create({ timeout: opts.timeout });
        this.useAjaxKey = opts.useAjaxKey;
    }
    ;
    SessionUtil.prototype.before = function () {
        var _this = this;
        var self = this;
        return function (ctx, next) {
            if (!ctx.cookie) {
                throw new Error('you must bind cookie module');
            }
            var key = ctx.cookie.get(_this.key);
            if (!key && _this.useAjaxKey) {
                key = ctx.gets[_this.useAjaxKey] || ctx.posts ? ctx.posts[_this.useAjaxKey] : undefined;
            }
            ctx.sessionStore = _this.store;
            var createSession = function (oldKey) {
                key = oldKey || uid(24, undefined);
                ctx.session = new Session(key);
                next();
            };
            if (!key) {
                return createSession(undefined);
            }
            else {
                self.store.get(key, function (err, data) {
                    if (err) {
                        throw err;
                    }
                    if (!data) {
                        return createSession(key);
                    }
                    ctx.session = new Session(key);
                    ctx.session.data = data;
                    next();
                });
            }
        };
    };
    ;
    SessionUtil.prototype.after = function () {
        var _this = this;
        var self = this;
        return function (ctx, next) {
            ctx.cookie.set(_this.key, ctx.session.id, {
                expires: new Date(Date.now() + _this.timeout)
            });
            if (ctx.session && ctx.session.isChange) {
                self.store.set(ctx.session.id, ctx.session.data, function (err, result) {
                    if (err) {
                        throw err;
                    }
                    next();
                });
            }
            else {
                next();
            }
        };
    };
    ;
    return SessionUtil;
}());
;
function create(opts) {
    return new SessionUtil(opts);
}
exports.create = create;
var stores = {
    memoryStore: memoryStore_1.create
};
function createStore(type, opts) {
    if (stores[type]) {
        return stores[type](opts);
    }
    return null;
}
exports.createStore = createStore;

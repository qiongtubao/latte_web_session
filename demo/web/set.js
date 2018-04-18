(function() {
    this.get = function(ctx) {
        ctx.session.setData({
            x: ctx.gets.x
        });
        ctx.webSend("ok");
    }
    this.path = "/set";
}).call(module.exports);
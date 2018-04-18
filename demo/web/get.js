(function() {
    this.get = function(ctx) {
        ctx.send(ctx.session.data);
    }
    this.path = "/get";
}).call(module.exports);
var latte_server = require("latte_webServer");
var server = latte_server.bindServer('test', {
    web: {
        loadPath: "./web"
    },
    port: 10088
});
server.on('webError', function() {
    console.log(err);
});
server.doSlave(function() {
    var Cookie = require('latte_web_cookie');
    var cookie = Cookie.create({});
    var Session =  require('../src/index');
    var session = Session.create({
        timeout: 20 * 1000
    });
    server.web.before('cookie',cookie.before());
    server.web.before(['cookie',session.before()]);
    server.web.after('session',session.after());
    server.web.after(['session',cookie.after()]);
});
server.run();
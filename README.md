# latte_web_session

##install

```bash
npm install latte_web_session
```

##use

```javascript
    var Session = require('latte_web_session');
    var session = Session.create({});
    server.web.before(session.before());
    server.web.after(session.after());
```
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const {
  createNewUser,
  userLogin,
  createNewPoll,
  showPolls,
  showAllPolls,
  deletePoll,
  votePoll,
  sharePoll,
} = require('./src/handler');
const bodyParser = require('body-parser');
const session = require('express-session');
const { flash } = require('express-flash-message');

// const store = new session.MemoryStore()

app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});

app.use(
  session({
    secret: 'some secret',
    cookie: { maxAge: 600000 }, // expires in 1 hour
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash({ sessionKeyName: 'flashMessage' }));

app.use(function (req, res, next) {
  app.locals.session = req.session;
  next();
});

app.get('/', (req, res) => {
  showAllPolls(async (err, done) => {
    if (err) {
      console.log(err);
    }
    let data = {
      title: 'Home',
    };

    if (!err) {
      let flash = await req.consumeFlash('info');

      if (flash.toString() !== null) {
        data.message = flash.toString();
      }
      data.polls = done;
      res.render('index', { data });
    }
  });
});

app
  .route('/login')
  .get(async (req, res) => {
    let data = {
      title: 'Login',
    };
    let flash = await req.consumeFlash('info');

    if (flash.toString() !== null) {
      data.message = flash.toString();
    }
    res.render('login', { data });
  })
  .post((req, res) => {
    userLogin(req.body, (err, userFound) => {
      let data = {
        title: 'Login',
      };

      if (err) {
        data.error = 'Login failed' + err.message;
        res.render('login', { data });
      }

      if (userFound.length < 1) {
        data.error = 'Login failed';
        res.render('login', { data });
      } else {
        req.session.authenticated = true;
        req.session.user = {
          username: userFound[0].username,
          userId: userFound[0]._id.toString(),
        };
        data.title = 'My Polls';
        data.session = req.session;
        return res.redirect('mypolls');
      }
    });
  });

app
  .route('/signup')
  .get((req, res) => {
    let data = {
      title: 'Sign Up',
    };
    res.render('signup', { data });
  })
  .post((req, res) => {
    createNewUser(req.body, async (err, data) => {
      if (err) {
        let message;
        if (err.code === 11000) {
          message = 'Username not available';
        } else {
          message = err.message;
        }
        let data = {
          title: 'Signup',
          error: 'Signup failed, ' + message,
        };
        res.render('signup', { data });
      }

      if (!err) {
        await req.flash('info', 'Sign Up success');
        return res.redirect('/login');
      }
    });
  });

app.get('/mypolls', (req, res) => {
  if (!app.locals.session.authenticated) {
    return res.redirect('/login');
  }
  showPolls(app.locals.session.user.username, async (err, done) => {
    if (err) {
      console.log(err);
    }
    let data = {
      title: 'My Polls',
    };
    if (!err) {
      let flash = await req.consumeFlash('info');

      if (flash.toString() !== null) {
        data.message = flash.toString();
      }
      data.polls = done;
      res.render('mypolls', { data });
    }
  });
});

app
  .route('/newpoll')
  .get((req, res) => {
    if (!app.locals.session.authenticated) {
      return res.redirect('/login');
    } else {
      let data = {
        title: 'New Poll',
      };
      res.render('newpoll', { data });
    }
  })
  .post((req, res) => {
    createNewPoll(req.body, app.locals.session.user.username, (err, done) => {
      if (err) {
        let data = {
          title: 'New Poll',
          error: 'Failed add new poll',
        };
        res.render('newpoll', { data });
      }

      if (!err) {
        return res.redirect('mypolls');
      }
    });
  });

app.post('/delete/:id', async (req, res) => {
  const id = req.params.id;
  deletePoll(id, (err, deleted) => {
    if (err) console.log(err);
    if (!err) {
      showAllPolls(async (err, done) => {
        if (!err) {
          await req.flash('info', 'Poll deleted successfully');
          res.redirect('/mypolls');
        }
      });
    }
  });
});

app.post('/vote/:id', (req, res) => {
  const id = req.params.id;

  votePoll(id, req.body, async (err, done) => {
    if (err) console.log(err);
    if (!err) {
      await req.flash('info', 'Voting success!');
      return res.redirect('/');
    }
  });
});

app.get('/share/:id', (req, res) => {
  const id = req.params.id;
  sharePoll(id, (err, done) => {
    if (err) console.log(err);
    if (!err) {
      let data = {
        title: 'Share Poll',
        poll: done,
      };

      res.render('share', { data });
    }
  });
});

app.get('/logout', (req, res) => {
  if (!app.locals.session.authenticated) {
    return res.redirect('/login');
  } else {
    req.session.destroy((err) => {
      if (err) console.log(err);
      app.locals.session = req.session;
      return res.redirect('/');
    });
  }
});

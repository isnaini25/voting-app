const { User, Poll } = require("./database");
const bcrypt = require("bcrypt");

const createNewUser = (req, done) => {
  bcrypt.hash(req.password, 10, (err, hash) => {
    const newUser = new User({ username: req.username, password: hash });

    newUser.save((err, data) => {
      if (err) return done(err, null);
      done(null, data);
    });
  });
};

const userLogin = (req, done) => {
  bcrypt.hash(req.password, 10, (err, hash) => {
    if (err) return done(err, null);
    bcrypt.compare(req.password, hash, (err, result) => {
      if (err) return done(err, null);
      if (result) {
        User.find({ username: req.username }).exec((err, userFound) => {
          if (err) return done(err, null);
          done(null, userFound);
        });
      }
    });
  });
};

const createNewPoll = (req, username, done) => {
  const newOptions = req.options.split(",").map((op) => op.trim());
  let options = [];
  newOptions.forEach((item) => {
    options.push({ name: item, count: 0 });
  });

  const newPoll = new Poll({
    question: req.question,
    username: username,
    options: options,
  });

  newPoll.save((err, data) => {
    if (err) return done(err, null);
    done(null, data);
  });
};

const showPolls = (username, done) => {
  Poll.find({ username: username }).exec((err, pollFound) => {
    if (err) return done(err, null);
    done(null, pollFound);
  });
};

const showAllPolls = (done) => {
  Poll.find().exec((err, pollFound) => {
    if (err) return done(err, null);
    done(null, pollFound);
  });
};

const deletePoll = (id, done) => {
  Poll.findByIdAndRemove(id, (err, deletedPoll) => {
    if (err) return done(err, null);
    done(null, deletedPoll);
  });
};

const votePoll = (id, req, done) => {
  Poll.findById(id).exec((err, pollFound) => {
    if (err) return done(err, null);
    // console.log(pollFound)
    if (req.option === "add") {
      pollFound.options.push({ name: req.newOption, count: 1 });
    } else {
      let optionFound = pollFound.options.find(
        (opt) => opt._id.toString() === req.option
      );

      optionFound.count = optionFound.count + 1;
    }

    pollFound.save((err, updatedPoll) => {
      if (err) return done(err, null);
      done(null, updatedPoll);
    });
  });
};

const sharePoll = (id, done) => {
  Poll.findById(id).exec((err, pollFound) => {
    if (err) return done(err, null);
    done(null, pollFound);
  });
};

module.exports = {
  createNewUser,
  userLogin,
  createNewPoll,
  showPolls,
  showAllPolls,
  deletePoll,
  votePoll,
  sharePoll,
};

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    minlength: [3, 'Must be at least 3'],
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [3, 'Must be at least 3'],
  },
});

const User = mongoose.model('User', userSchema);

//Poll
const pollSchema = new mongoose.Schema({
  question: String,
  options: [
    {
      name: String,
      count: Number,
    },
  ],
  username: String,
});

const Poll = mongoose.model('Poll', pollSchema);

module.exports = {
  User,
  Poll,
};

const express       = require('express');
const session       = require('express-session');
const hbs           = require('express3-handlebars');
const mongoose      = require('mongoose');
const passport      = require('passport');
const localStrategy = require('passport-local').Strategy;
const bcrypt        = require('bcrypt');
const app           = express();
const path          = require ('path');

mongoose.connect("mongodb://localhost:27017/simple-login-system", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const user = mongoose.model('User', userSchema)

//Middleware
app.engine('hbs', hbs({ extname: '.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname + '/puplic')));
app.use(session({
    secret: "REPLACEBALEsecretkey",
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

//Passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done){
   done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    user.findById(id, function (err, user) {
        done(err, user);
    })
});

passport.use(new localStrategy(function (username, password, done) {
       User.findOne({username: username}, function (err, user) {
           if (err) return done(err);
           if (!user) return done(null, false, {message: 'incorrect Username'});

           bcrypt.compare(password, user.password, function (err, res) {
               if (err) return done(err);
               if (res === false) return done(null, false, {message: 'incorrect password'});

               return done(null, user);
           })
       });
}));

app.get('/', (req, res) => {
    res.render("index", {title: "Home"});
});

app.listen(3000, () => {
    console.log("server is running")
})

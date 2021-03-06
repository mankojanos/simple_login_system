const express       = require('express');
const session       = require('express-session');
const hbs           = require('express-handlebars');
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
app.use(express.static(path.join(__dirname + '/public')));
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
//ROUTES

function isLogedIn(req, res, next) {
    if(req.isAuthenticated()) return next();
    res.redirect("/login");
}

function isLogedOut(req, res, next) {
    if(!req.isAuthenticated()) return next();
    res.redirect("/");
}

app.get('/', isLogedIn, (req, res) => {
    res.render("index", {title: "Home"});
});

app.get('/login', isLogedOut, (req, res) => {
    let response = {
        title: "Login",
        error: req.query.error
    }

    res.render("login", response)
})

app.post('login', passport.authenticate('local',{
    successRedirect: '/',
    failureRedirect: '/login?error=true',
}));

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/')
    });

//Setup admin user
app.get('/setup', async (req, res) => {
    const exists = await User.exists( {username: "admin"});

    if(exists) {
        console.log("exists");
        res.redirect('/login');
        return;
    }

    bcrypt.genSalt(10, function (err, salt) {
        if (err) return next(err);
        bcrypt.hash("pass", salt, function (err, hash) {
            const newAdmin = new User({
                username: "admin",
                password: hash
            });

            newAdmin.save()

            res.redirect('/login');
        });
    });
});

app.listen(3001, () => {
    console.log("server is running")
})

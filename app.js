var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const db = require('./db');
const fs = require('fs');
var fileUpload = require('express-fileupload');

var userProfile;

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'key',
  cookie:{maxAge:600000},
  proxy: true,
  resave: true,
  saveUninitialized: true,
}));
app.use(fileUpload());



app.get('/', function(req, res) {
  console.log(userProfile);
  if (userProfile) {
    req.session.loggedIn=true;
    req.session.userName=userProfile.displayName;
    res.render('index.ejs', {user:userProfile});
  }else{
    req.session.loggedIn=false;
    res.render('index.ejs', {user:false});
  }
  
});

app.use(passport.initialize());
app.use(passport.session());
app.get('/error', (req, res) => res.send("error logging in"));


passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GOOGLE_CLIENT_ID = '610412597343-3cbmdrc787bblj4d3ut7eg0bnber4lgh.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:8000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
      userProfile=profile;
      return done(null, userProfile);
  }
));
 
app.get('/auth/google', 
  passport.authenticate('google', { scope : ['profile', 'email'] }));
 
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/');
  });
  

  app.get('/tables', function(req, res){
    console.log(req.session.loggedIn);
    if(req.session.loggedIn==false){
      res.redirect('/auth/google')
    }
    else{
      res.render('tables')
    }
    
  })

  app.post('/book-table', async function(req, res){
    let bookingData = req.body 

    
    let timeFrom  = bookingData.timeFrom
    let timeTo  = bookingData.timeTo
    let tables = []

    const allDataAsArray = Object.values(bookingData);

    for (let i = 2; i < allDataAsArray.length; i++) {
        tables.push(allDataAsArray[i])
    }
 
    data={"tables":tables, "TimeFrom": timeFrom, "timeTo": timeTo, "userName": req.session.userName}
    let username = req.session.userName;
    let tablesJson = JSON.stringify(tables)
    var sql = "INSERT INTO tableBooking (timeFrom, timeTo, tables, userName) VALUES ('"+timeFrom+"', '"+timeTo+"', '"+tablesJson+"', '"+username+"')";
    db.con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted", result);
  });

    res.json("no_errors")

  })

  app.get('/logout', function(req, res){
    userProfile = null;
    req.session.loggedIn=false;
    req.session.userName=null;
    req.session.destroy()
    res.redirect('/')
    
  })

  app.get('/orders', function(req, res){
    var sql = "select * from menu";
    
    db.con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("data sent", result[0].productName);
      res.render('orders',{result});
      
    });
    
   
  })

  app.get('/admin', function(req, res){
    var sql = "select * from tableBooking";
    
    db.con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("data sent", result);
      res.render('admin',{result});
    });
  })

  app.post('/foodorders', function(req, res){

    var username = req.session.userName;
    var data = req.body

    var sql = "INSERT INTO foodOrders (username,  food, totalCost) VALUES ('"+username+"', '"+data.foods+"', '"+data.totalCost+"')";
    
    db.con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("food orders inserted");
      res.json("no_errors");
    });
  })

  app.get('/successful', function(req, res){
    res.render('successful');
  })
  app.get('/addMenu', function(req, res){
    res.render('addmenu');
  })

  app.post('/updateMenu', async function(req, res){

    var product = req.body.productName;
    var description = req.body.Description;
    var quantity = req.body.Quantity;
    var price = req.body.Price;


    var image = req.files.foodImage


    await image.mv('./public/menuImage/'+product + '.png',  (err,done)=>{
      if(!err){
        
          var sql = "INSERT INTO menu (productName, description, price, quantity, image) VALUES ('"+product+"', '"+description+"', '"+price+"' , '"+quantity+"' , '"+product+"')";
          
          db.con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("food orders inserted");
            res.redirect('/admin');
          });

      }else{
        console.log(err)
      }
    })


    

    
  })


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(8000, ()=>{console.log("server running")});

module.exports = app;
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Akhiljith@My112",
    database: "reataurant"
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });


module.exports = {con};

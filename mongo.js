var mongoclient = require("mongodb").MongoClient

var mongo = new mongoclient("mongodb://localhost:27017")

async function saveTableBookingData(data) {
    console.log(data);
    await mongo.connect()
    var db = mongo.db("restaurantData")
    var coll = db.collection("tableData")
    await coll.insertMany([data])

}

module.exports = {saveTableBookingData};


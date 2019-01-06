'use-strict'
const MongoClient = require('mongodb').MongoClient
var uri = "mongodb://smartslide:Kzdf96574@cluster0-shard-00-00-4e7c0.mongodb.net:27017,cluster0-shard-00-01-4e7c0.mongodb.net:27017,cluster0-shard-00-02-4e7c0.mongodb.net:27017/smartslides?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true"

//Connect Returns a db Object
function Connect(){
    return new Promise(function(resolve, reject){
        MongoClient.connect(uri, {useNewUrlParser:true}, function(error, db) {
            if(error) reject(error)
            else resolve(db.db("smartslides"))
        }) 
    })
}

//ConnectAndRun Takes the db Object Returned by Connect
//Turns it into a collection-> Passes it to run
//run->Any Function that you want to run on the Users Collection
function ConnectAndRun(run, data){
    return new Promise(function(resolve, reject){
        Connect()
        .then(function(db){
            resolve(run(db.collection("Users"), data))
        }).catch(function(error){
            reject(error)
        })
    })
}

//Returns an Array of your results from any query
//dbo->is of type db.db("Smartslides").Collection("Users")
//query->is of type {"id": foo}
function QueryArray(dbo, query){
    return new Promise(function(resolve, reject){
        dbo.find(query).toArray(function(err, result){
            if(err) reject(err)
            resolve(result)
            return result
        })
    })
}
module.exports.Connect = Connect
module.exports.ConnectAndRun = ConnectAndRun
module.exports.QueryArray = QueryArray
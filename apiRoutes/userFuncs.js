const db = require('./db')
const bcrypt = require('bcrypt');
const saltRounds = 10;
var ObjectID = require('mongodb').ObjectID



function User(ObjectID, userInfo, presentations) {
    this.user = {
        "_id": ObjectID,
        "info": userInfo,
        "presentations": presentations,
    }
}
User.prototype.UpdateUser = function(userObj){
    this.user = userObj
}
User.prototype.InsertNotecard = function(presId, notecard){
    //The id property is loaded with the previous notecard's id to maintain order in the db
    let prevNotecardId = notecard.id
    //Once we store the prevNotecardId we give the notecard a new Id
    notecard.id = new ObjectID()

    //When a notecard is first created, we need to initialize the notecard array
    if(!this.user.presentations[presId].notecards){
        this.user.presentations[presId].notecards = []
    }

    //If there are no notecards in the Array
    //We just want to push the notecard to the back
    if(this.user.presentations[presId].notecards.length == 0){
        this.user.presentations[presId].notecards.push(notecard)
        //Returns the notecard Id so we can send it in res.send()
        return new Promise(function(resolve, reject){
            return resolve(notecard.id)
        })
    }
    //If we have notecards in the Array
    //We want to check to find the index of the previous notecard
    //Perform an insertion after that index
    for(var i=0; i < this.user.presentations[presId].notecards.length; i++){
        let notecards = this.user.presentations[presId].notecards
        
        if(notecards[i].id == prevNotecardId){
            notecards.splice(i+1,0, notecard)
            //Returns the notecard Id so we can send it in res.send()
            return new Promise(function(resolve, reject){
                return resolve(notecard.id)
            })
        }
    }
    
}
User.prototype.DeleteNotecard = function(presId, notecardId){
    //Loop through the notecard array
    //Find a notecard equal to the given notecardId
    //Delete it from the array
    for(var i=0; i < this.user.presentations[presId].notecards.length; i++){
        let notecards = this.user.presentations[presId].notecards
        
        if(notecards[i].id == notecardId){
            
            notecards.splice(i,1)
            break
        }
    }
    
}

function CreateUserInDb(user){
    return new Promise(function(resolve, reject){
        db.ConnectAndRun(findUserByUsername, user.username)
            .then(function(result){
                if(result){
                    // An account with this username already exists
                    // so we can't create a new one
                    return reject(Error("Username Already Exists"))
                }else{
                    // No users exist with this username
                    // Now we need to check passwords
                    if(validatePassword(user)){
                        // Sign Them Up!
                        encryptPassword(user)
                        .then(function(result){
                            var u = new User(new ObjectID(), result, {})
                            console.log(u)
                            db.ConnectAndRun(InsertUser, u.user)
                            .then(function(result){
                                return resolve(u.user._id)
                            })
                            .catch(function(error){
                                return reject(error)
                            })
                        })
                        //console.log(user)
                    }
                }
            })
            .catch(function(error){
                return reject(error)
            })
    })
}

////
//  Login Func; Cookie Set in UserRoutes.js
///
function Login(user, response_data){
    return new Promise(function(resolve, reject){
        
        
        if(user.username == ''){
            reject(Error("Username Blank"))
        }
        if(user.password == ''){
            reject(Error("Password Blank"))
        }
        db.ConnectAndRun(findUserByUsername, user.username)
        .then(function(encUser){
            if(encUser == false){
                reject(Error("Username Doesn't exist"))
            }
            decryptPassword(user.password, encUser[0].info.password)
            .then(function(result){
                if(result == true){
                    response_data['result'] = true
                    resolve(encUser[0]._id)
                }
                else
                    response_data['result'] = false
                    reject()
            })
            .catch(function(err){
                // Specific errors if bcrypt errors instead of returning false
                reject(err)
            })
        })
        .catch(function(err){
            reject(err)
        })
    })
}

////
//  Insert Query
////    
function InsertUser(dbo, user){
    return new Promise(function(resolve, reject){
        dbo.insertOne(user, function(err, res){
            if(err) reject(err)
            return resolve(res)
        })
    })
}

////
//  Update Queries
////
function InsertPresentation(dbo, newUserObj){
    return new Promise(function(resolve, reject){
        // Because the presentation field is one object, we can't update without overwriting
        //   past data, so the data argument will hold the entire presentation object and user_id.
        //   The presentation object will include one more empty presentation with the new title
        //   so you are safe to replace the old pres object within the user object
        // Set the query to search for userID
        console.log(newUserObj[0])
        var q = {"_id": newUserObj[0]._id}
        var newValue = {$set: {presentations: newUserObj[0].presentations}}
        // And the values to set once found
        dbo.updateOne(q, newValue, function(err,res){
            if(err) reject(err)
            resolve(true)
        }) 
    })
}
function UpdateNotecard(dbo, userObj){
    return new Promise(function(resolve, reject){
        console.log(userObj)
        var q = {"_id": userObj._id}
        var newValue = {$set: {presentations: userObj.presentations}}
        
        dbo.updateOne(q, newValue, function(err,res){
            if(err) reject(err)
            resolve(true)
        }) 
        
    })
}

////
//  Find Queries
////
function FindAllUsers(dbo){
    return new Promise(function(resolve,reject){
        let query = {}
        db.QueryArray(dbo, query)
            .then(function(result){
                // console.log(result)
                return resolve(result)
            })
    })
}
function FindUserById(dbo, id){
    return new Promise(function(resolve, reject){
        id = ObjectID(id)
        let query = {"_id": id}
        db.QueryArray(dbo, query)
            .then(function(result){
                return resolve(result)
            })
            .catch(function(error){
                return reject(error)
            })

    })
}
function findUserByUsername(dbo, username){
    return new Promise(function(resolve, reject){
        let query = {"info.username": username}
        db.QueryArray(dbo, query)
        .then(function(result){
            console.log(result)
            if(result.length != 0){
                return resolve(result)
            }
            return resolve(false)
        })
    })
}


////
//  Password Functions
////
function passwordMatchesUserInput(user, password){
    
}

function validatePassword(user){
    if(passwordMatchesConfirmPassword(user)){
        // Passwords Match so Now we need to check length
        if(passwordAboveLength(user)){
            // We're Good to Create the Account
            return true
        }else{
            throw Error("Password Must Be Atleast 8 Characters")
            return false
        }
    }else{
        throw Error("Passwords Don't Match")
        return false
    }
}
function passwordMatchesConfirmPassword(user){
    if(user.password === user.confirm_password){
        return true
    }
    return false
}
function passwordAboveLength(user){
    if(user.password.length >= 8){
        return true
    }
    return false
}
function encryptPassword(user){
    return new Promise(function(resolve, reject){
        bcrypt.hash(user.password, saltRounds)
               .then(function(hash) {
                   user.password = hash
                   user.confirm_password = hash
                   return resolve(user)
               });
    })
}
function decryptPassword(plainPass, encPass){
    return new Promise(function(resolve, reject){
        bcrypt.compare(plainPass, encPass, function(err, res) {
            console.log("bcrypt:",res, err)
            if(err) reject(err)
            return resolve(res)
        })
    })
}

////
//  Function Exports
////
module.exports.CreateUserInDb = CreateUserInDb
module.exports.Login = Login
//module.exports.FindAllUsers = db.ConnectAndRun(FindAllUsers)
// module.exports.FindUserById = db.ConnectAndRun(FindUserById)
module.exports.FindUserById = FindUserById
module.exports.FindAllUsers = FindAllUsers
module.exports.ConnectAndRun = db.ConnectAndRun
module.exports.InsertPresentation = InsertPresentation
module.exports.UpdateNotecard = UpdateNotecard
module.exports.User = User
// module.exports.FindUserByUsername = db.ConnectAndRun(findUserByUsername)
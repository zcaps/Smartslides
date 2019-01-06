'use-strict'
userFuncs = require("./userFuncs")
var ObjectID = require('mongodb').ObjectID

function CreateUser(req, res){
    var response_data = {'result':false}
    return userFuncs.CreateUserInDb(req.body)
             .then(function(data) {
                 response_data['result'] = true
                 res.cookie("userID", data)
                 res.send(response_data)
             })
             .catch(function(error) {
                 console.log("Things went wrong: " + error)
                 response_data['result'] = error.message
                 res.send(response_data)
             })
}

function Login(req, res){
    // Variables to pass by reference and track what happens. 
    // Although I suppose the promise conditions already do this though. 
    // It only resolves on success...         my life is a fraud...
    var response_data = {'result' : undefined}
    
    return userFuncs.Login(req.body,response_data)
    .then(function(result){
        console.log("Ayyy what's new my dude, come on in:\n",response_data)
        res.cookie("userID", result)
        res.send(response_data)
    })
    .catch(function(error){
        // If there is a specific error besides wrong password, return that instead
        if(error) response_data['result'] = error.message
        console.log("No Login for you:", response_data)
        res.send(response_data)
    })
}

function UserpageFindUser(req,res){
    console.log(req.cookies.userID)
    userFuncs.ConnectAndRun(userFuncs.FindUserById, req.cookies.userID )
    .then(function(data){
        console.log("passed", data)
        
        if(data.length == 0){
            res.render("templates/homepage.ejs");
        }else{
            res.render("templates/userpage.ejs")
        }
    })
    .catch(function(error){
        console.log("ID could not be passed", error)
        
    })
    
}

// CreatePresentation will simply take the existing presentations object, found using FindUserById,
//   add to the presentation object with the new title, 
//   and send the data into InsertPresentation to update the user object. 
function CreatePresentation(req, res){
    return userFuncs.ConnectAndRun(userFuncs.FindUserById, req.cookies.userID)
    .then(function(data){
        // Make new user object to update
        var newUserObj = data;
        console.log("newUser before adding presentation", req.body.title, "\n" , newUserObj[0],"\n")
        let presID = new ObjectID()
        let pres = {'title': req.body.title,
                    'contents': [] }
        newUserObj[0]['presentations'][presID] = pres

        userFuncs.ConnectAndRun(userFuncs.InsertPresentation, newUserObj)
        .then(function(result){
            console.log("Successfull presentation update")
            let response_data = {}
            response_data['id'] = presID
            response_data['title'] = pres.title
            res.send(response_data)
        })
        .catch(function(err){
            console.log("Update failed")
            res.send(err)
        })
    })
    .catch(function(error){
        // Retrieving user with _id failed
        console.log(error)
        res.send(error)
    })
}

function DeletePresentation(req, res){
    let response_data = {}
    let presId = req.body.presId
    return userFuncs.ConnectAndRun(userFuncs.FindUserById, req.cookies.userID)
    .then(function(user){
        delete user[0].presentations[presId]
        userFuncs.ConnectAndRun(userFuncs.InsertPresentation, user)
        .then(function(result){
            response_data['result'] = true
            res.send(response_data)
        })
        .catch(function(err){
            response_data['result'] = err.message
            res.send(response_data)
        })
    })
    .catch(function(){
        res.send(error)
    })
}

////
//  GetPresentations Grabs a UserID cookie on request
//  And responds with json array of all presentations
////
function GetPresentations(req, res){
    return userFuncs.ConnectAndRun(userFuncs.FindUserById, req.cookies.userID)
    .then((user)=>{
        console.log("GetPresentations: ", user[0].presentations)
        res.send(user[0].presentations)
    })
    .catch((error)=>{
        console.log("GetPresentations: ", error)
        res.send(error)
    })
}
////
//  EditorPage just renders the Notecard Editor Page
////
function EditorPage(req, res){
    
    userFuncs.ConnectAndRun(userFuncs.FindUserById, req.cookies.userID )
    .then(function(data){
        console.log("passed", data)
        
        if(data.length == 0){
            res.redirect("/");
        }else{
            res.render("templates/editpresentation.ejs")
        }
    })
    .catch(function(error){
        console.log("ID could not be passed", error)
        
    })
}

////
//  AddNotecard Adds a notecard to the database in the correct order
////
function AddNotecard(req, res){
    return userFuncs.ConnectAndRun(userFuncs.FindUserById, req.cookies.userID)
    .then(function(user){
        let presId = req.body.Id
        let notecard = req.body.Notecards[0]

        userObj = new userFuncs.User()
        userObj.UpdateUser(user[0])
        userObj.InsertNotecard(presId, notecard).then(function(id){
            res.send({"Id": id})
            userFuncs.ConnectAndRun(userFuncs.UpdateNotecard, userObj.user)
        })
        .catch(function(err){
            console.log(err)
        })
        
    })
    .catch(function(err){
        
    })
}
////
//  GetNotecards gets all notecards from a specific presentation
////
function GetNotecards(req, res){
    return userFuncs.ConnectAndRun(userFuncs.FindUserById, req.cookies.userID)
    .then(function(user){
        let presId = req.params.presId
        if(user[0].presentations[presId]){
            console.log("Presentation exists")
            res.send(user[0].presentations[presId])
        }else{
            console.log("Presentation Doesn't exist")
            res.send(false)
        }
        
    })
    .catch(function(error){

    })
}
////
//  DeleteNotecard deletes a notecard from a specific presentation
////
function DeleteNotecard(req, res){
    return userFuncs.ConnectAndRun(userFuncs.FindUserById, req.cookies.userID)
    .then(function(user){
        console.log("delete notecard")
        let presId = req.body.Id
        var userObj = new userFuncs.User()
        userObj.UpdateUser(user[0])
        userObj.DeleteNotecard(presId, req.body.Amount)
        console.log(userObj.user.presentations[presId])
        userFuncs.ConnectAndRun(userFuncs.UpdateNotecard, userObj.user)
        
    })
    .catch(function(error){

    })
}
module.exports.CreateUser = CreateUser
module.exports.CreatePresentation = CreatePresentation
module.exports.DeletePresentation = DeletePresentation
module.exports.Userpage = UserpageFindUser
module.exports.Login = Login
module.exports.GetPresentations = GetPresentations
module.exports.EditorPage = EditorPage
module.exports.AddNotecard = AddNotecard
module.exports.GetNotecards = GetNotecards
module.exports.DeleteNotecard = DeleteNotecard
'use-strict'
const express = require('express')
const fs = require('fs')
const environmentalVars = require('dotenv').config();
const bodyParser = require('body-parser')
const userRoutes = require('./apiRoutes/userRoutes')

const app = express();
const port = process.env.PORT || 8000;
const server = require('http').createServer(app);

// Middleware
const cookieParser = require('cookie-parser')

// Google Cloud
const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient(); // Creates a client

// Socket.io
const io = require('socket.io')(server)


app.enable('strict routing');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.json({ type: function(req){ 
    return req.headers['content-type'] === 'json'
    } 
}));
app.use(cookieParser());

//STATIC ROUTES
app.use("/css/", express.static(__dirname + '/views/css'));
app.use("/js/", express.static(__dirname + '/views/js'));
app.use("/images/", express.static(__dirname + '/views/images'));

// Page Serving
app.get("/", userRoutes.Userpage);
app.get("/user", userRoutes.Userpage)
app.get("/editor", userRoutes.EditorPage)
app.get("/speak",function(req,res){ res.render("templates/speak"); })

//API ROUTES
app.post("/api/create-account", userRoutes.CreateUser)
app.post("/api/create-presentation", userRoutes.CreatePresentation)
app.post("/api/delete-presentation", userRoutes.DeletePresentation)
app.post("/api/sign-in", userRoutes.Login)
app.post("/api/update-presentation", userRoutes.AddNotecard)
app.post("/api/delete-notecard", userRoutes.DeleteNotecard)
app.get("/api/get-presentations", userRoutes.GetPresentations)
app.get("/api/get-presentation/:presId", userRoutes.GetNotecards)



// ======================= SPEECH INTERPRETOR =========================== //
// =========================== SOCKET.IO ================================ //

io.on('connection', function (client) {
    console.log('Client Connected to server');
    let recognizeStream = null;

    client.on('join', function (data) {
        client.emit('messages', 'Socket Connected to Server');
    });

    client.on('messages', function (data) {
        client.emit('broad', data);
    });

    client.on('startGoogleCloudStream', function (data) {
        startRecognitionStream(this, data);
    });

    client.on('endGoogleCloudStream', function (data) {
        stopRecognitionStream();
    });

    client.on('binaryData', function (data) {
        // console.log(data); //log binary data
        if (recognizeStream !== null) {
            recognizeStream.write(data);
        }
    });

    function startRecognitionStream(client, data) {
        recognizeStream = speechClient.streamingRecognize(request)
            .on('error', console.error)
            .on('data', (data) => {
                process.stdout.write(
                    (data.results[0] && data.results[0].alternatives[0])
                        ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
                        : `\n\nReached transcription time limit, press Ctrl+C\n`);
                client.emit('speechData', data);

                // if end of utterance, let's restart stream
                // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
                // if (data.results[0] && data.results[0].isFinal) {
                //     stopRecognitionStream();
                //     startRecognitionStream(client);
                //     // console.log('restarted stream serverside');
                // }
            });
    }

    function stopRecognitionStream() {
        if (recognizeStream) {
            recognizeStream.end();
        }
        recognizeStream = null;
    }
});


// =========================== GOOGLE CLOUD SETTINGS ================================ //

const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US'; //en-US

const request = {
    config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
        profanityFilter: false,
        enableWordTimeOffsets: true,
        speechContext:{
            "phrases":[
                'uh'
            ]
        }
    },
    interimResults: true // Necessary for results possible before final, includes changes. 
};


// =========================== START SERVER ================================ //
server.listen(port, "127.0.0.1", function () { //http listen, to make socket work
    // app.address = "127.0.0.1";
    console.log('Server started on port:' + port)
});
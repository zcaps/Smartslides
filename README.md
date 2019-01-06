# smartslides
Flip through notecards based on what you say. Makes presentations flow easier.

~~The project can be run in 3 simple commands`.`
```

smartslides> npm install
smartslides> export GOOGLE_APPLICATION_CREDENTIALS=gcpAuthoKey.json
smartslides> node app.js
```
## Credits
* Jacob Sides
* Austin Day

## Node Dependancies:
Once inside the `team-wirth/websocket` directory
`npm install @google-cloud/speech express ejs dotenv socket.io mongodb`
* Google Cloud's Speech Recognition
* Express for handling easy routing
* ejs for html templates
* dotenv for managing GCloud keys and port configurations
* socket.io for the audio streaming websocket
* mongodb for Mongo Database access to presentations
	

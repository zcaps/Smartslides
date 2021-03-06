# Smartslides
Flip through presentation slides based on what you say. Make your speeches more charismatic. You will be less focused on technology and more focused on your audience. We aim to get rid of the awkward tension when you tell someone to switch your slides. We want you to make a better connection with your audience.

## How to Install
~The project can be run in 3 simple commands from`~/{nodepath}/github.com/zcaps/Smartslides`
```
smartslides> npm install
smartslides> export GOOGLE_APPLICATION_CREDENTIALS=gcpAuthoKey.json
smartslides> node app.js
```
## Credits
* Jacob Sides - https://github.com/the-sides
* Austin Day

## Node Dependancies
* Google Cloud's Speech Recognition
* Express for handling easy routing
* ejs for html templates
* dotenv for managing GCloud keys and port configurations
* socket.io for the audio streaming websocket
* mongodb for Mongo Database access to presentations
	

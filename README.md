# smartslides
A web application for interactive note cards targetting public speaking

~~The project can be run by opening TWO terminals, one in `.`, the other in `websocket`
```
team-wirth> go run main.go
websocket> node app.js
```
The two process will need to be running on port 8000 and 7000 as they refer to one another

## Node Dependancies:
Once inside the `team-wirth/websocket` directory
`npm install @google-cloud/speech express ejs dotenv socket.io mongodb`
* Google Cloud's Speech Recognition
* Express for handling easy routing
* ejs for html templates
* dotenv for managing GCloud keys and port configurations
* socket.io for the audio streaming websocket
* mongodb for Mongo Database access to presentations
	
## Go Dependancies: 
Go used for DB management and webpage serving
Typically...
`go get .` and
`go build` are enough
* julien-schmidt httprouter,
* gorilla sessions~~

WE USE NODE NOW! 
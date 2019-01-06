'use strict'

//  Socket.io configured by Vinzenz Aubry for sansho 24.01.17
//  Extended by Jacob Sides for team-wirth
//  Feel free to improve!
$(document).ready(function(){
	//connection to socket
	const socket = io.connect();
	debugLogs(socket)
	
	//================= CONFIG =================
	// Stream Audio
	let bufferSize = 2048,
		AudioContext,
		context,
		processor,
		input,
		globalStream;
	
	//vars
	let audioElement = document.querySelector('audio'),
		finalWord = false,
		resultText = document.getElementById('notecard-text'),
		removeLastWord = true,
		streamStreaming = false;
	
	
	//audioStream constraints
	const constraints = {
		audio: true,
		video: false
	};
	
	//================= RECORDING =================
	
	function initRecording() {
		socket.emit('startGoogleCloudStream', ''); //init socket Google Speech Connection
		streamStreaming = true;
		AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();
		processor = context.createScriptProcessor(bufferSize, 1, 1);
		processor.connect(context.destination);
		context.resume();
	
		var handleSuccess = function (stream) {
			globalStream = stream;
			input = context.createMediaStreamSource(stream);
			input.connect(processor);
	
			processor.onaudioprocess = function (e) {
				microphoneProcess(e);
			};
		};
	
		navigator.mediaDevices.getUserMedia(constraints)
			.then(handleSuccess);
	
	}
	
	function microphoneProcess(e) {
		var left = e.inputBuffer.getChannelData(0);
		// var left16 = convertFloat32ToInt16(left); // old 32 to 16 function
		var left16 = downsampleBuffer(left, 44100, 16000)
		socket.emit('binaryData', left16);
	}
	
	//=========== PRESENTATION IMPORTER ===========
	
	// Read presentation id
	var pid = (new URLSearchParams(window.location.search)).get('pid')
	var cardInd = Number((new URLSearchParams(window.location.search)).get('card'))
	

	console.log("Retrieving this presentation",pid)

	var NCcontentRaw = {}
	var notecardRaw = "this is an example speech that someone may want to recite while performing a presentation"
	var cardsN
	var indexedWords = {}; /* These are the words searched/deleted while detecting */
	var listedWords = []
	var keywords = {}
	var wordsDone = false
	var boundsize = 5
	var bounds = [0,boundsize];
	var modeStatus = "s"
	var dataFinal = false

	$.ajax({
		type:"GET", 
		url: "/api/get-presentation/"+pid,
		contentType: "json",
		async: false,
		success: function(data){
			$('#title-text').text(data.title)
			NCcontentRaw = data.notecards
			debugLogs("Notecards N:", data.notecards.length)
			cardsN = data.notecards.length;
		},
		error: function(data){
			console.log("Presentation could not be recieved")
		}
	})

	
	//================= INTERFACE =================
	
	
	var startButton = document.getElementById("startRecButton");
	startButton.addEventListener("click", startRecording);
	
	var endButton = document.getElementById("stopRecButton");
	endButton.disabled = true;
	endButton.addEventListener("click", stopRecording);
	
	var timeRunner 

	function startRecording() {
		startButton.disabled = true;
		endButton.disabled = false;
		initRecording();
		timeRunner = setInterval(timeTrack, 1000);
	}
	
	function stopRecording() {
		// waited for FinalWord
		startButton.disabled = true;
		endButton.disabled = true;
		streamStreaming = false;
		clearInterval(timeRunner);
		socket.emit('endGoogleCloudStream', '');
		
		
		let track = globalStream.getTracks()[0];
		track.stop();
	
		input.disconnect(processor);
		processor.disconnect(context.destination);
		context.close().then(function () {
			input = null;
			processor = null;
			context = null;
			AudioContext = null;
			startButton.disabled = false;
		});
	}

	$('#reset').click(function(){
		resetWordIndex(false)
	})

	$("#verbatimBtn").click(function(){
		$("#modeStatus").text("MODE: Verbatim")
		modeStatus = 'v'
	})
	$("#smoothBtn").click(function(){
		$("#modeStatus").text("MODE: Smooth")
		modeStatus = 's'
	})


	// ======== Card Navigation =========== //
	var prevButton = document.getElementById("prevButton");
	prevButton.disabled = true;
	var nextButton = document.getElementById("nextButton");

	// May also be activated once all keywords are found.
	function showPrevCard(){
		if (cardInd == 0) return		
		cardInd--
		loadNotecardPreview(cardInd);
		setCurrentTimecard(cardInd);
	}

	function showNextCard(){
		if (cardInd == cardsN - 1) return
		cardInd++
		loadNotecardPreview(cardInd);
		setCurrentTimecard(cardInd);
		setTimeout(function() {
			socket.on('speechData', processSpeechData);
		}, 0)
	}

	$("#prevButton").click(showPrevCard)
	$("#nextButton").click(showNextCard)
	

	// ============= Time Tracking ============== //
	// Format Timeline divs
	let widthForEach = (1 / cardsN) * 100 // Percentage
	// Create time cards for each notecard
	for(let i = 0; i < cardsN; i++){
		let lilTimeCard = $('<div></div>').addClass("timeCard card"+i)
		let lilTimer = $('<span></span>').text("0:00").addClass("timeElapsed")
		$('#timeline').append(lilTimeCard.append(lilTimer))
	}
	// Set current time card from cardInd
	$('.card'+cardInd).addClass("currentTimeCard")

	$('.timeCard').css('width', widthForEach + '%')

	function timeTrack(cardInd){
		let time = String($('.currentTimeCard').text())
		let secs = Number(time.substring(2,4))
		let mins = Number(time.substring(0,1))   // lol btw, will totally break at 10 mins
		if(secs == 59){
			mins += 1
			secs = -1
		}
		secs += 1
		let newTime = String(mins) + ":"
		if(String(secs).length == 1) newTime += '0'
		newTime += secs
		$('.currentTimeCard').text(newTime)
	}

	function setCurrentTimecard(cardInd){
		$(".currentTimeCard").removeClass("currentTimeCard")
		$('.card'+cardInd).addClass("currentTimeCard")
	}
	
	// Clear Button
	// for(let i = 0; i < cardsN; i++){
	$('#clearTimeButton').click(function(){
		$('.currentTimeCard').text("0:00")
	})


// ================== Preview Generator =================== //

	// Function extension of string using regex to replace all occurences of a string
	String.prototype.replaceAll = function(search, replacement) {
		var target = this;
		return target.replace(new RegExp(search, 'g'), replacement);
	};
	
	// Takes a full HTML body of text and adds a unique span around each *separate* word
	// A word formatted partway through will be processed as 2 words. e.g. im<i>possible</i> becomes two separate spans im and possible
	function spanify(contents) {

		let isAlphaNumeric = function(chr) {
			var code
	
			if (chr=="'") return true
		
			code = chr.charCodeAt(0);
			if (!(code > 47 && code < 58) && // numeric (0-9)
				!(code > 64 && code < 91) && // upper alpha (A-Z)
				!(code > 96 && code < 123)) { // lower alpha (a-z)
				return false;
			}
			return true;
		};

		// Lazy, but effective.
		contents = contents.replaceAll("<span style=\"color: red;\">", "<keyword>")
		contents = contents.replaceAll("</span>", "</keyword>")

		let out = ""
		let inword = false
		let intag = false
		let iskeyword = false
		let count = 0
		let word = ""
		
		// Second initialization?
		keywords = {}
		listedWords = []

		// Creates a unique span and increments count + some extra stuff for convenience 
		let openspan = function() {
			out += "<span id=\"word" + count + "\">"
			count++
			inword = true
			word = ""
		}

		// Closes span + some extra stuff for convenience 
		let closespan = function() {
			out += "</span>"
			inword = false
			listedWords.push(word.toLowerCase())
			if (iskeyword) keywords[count-1] = word.toLowerCase()

		}

		// Loop through each character and process to add spans where appropriate
		for(let c = 0;c < contents.length; c++){
			if (isAlphaNumeric(contents[c])) {
				if (!inword && !intag) {
					openspan()
				}
				if (inword) {
					word += contents[c]
				}
			} else {
				if (inword) {
					closespan()
				}
				// Revert quill's XSS protection change (< and > turn into &lt; and &gt;)
				if (contents[c] == "&" && (contents.substr(c, 4) == "&lt;" || contents.substr(c,4) == "&gt;")) {
					c += 3
					if (contents[c+1] == 'l') out += "<"
					else out += ">"
					continue;
				}
				//Logic for when you hit a tag
				if (contents[c] == "<") {
					if (contents.substr(c, 9) == "<keyword>") iskeyword = true
					if (contents.substr(c, 10) == "</keyword>") iskeyword = false
					intag = true
				} else if (contents[c] == ">") {
					intag = false
				}
			}
			out += contents[c]
		}

		debugLogs(out)

		return out
	}

	function loadNotecardPreview(cardInd){
		// var notecardRaw = "this is an example speech that someone may want to recite while performing a presentation"
		indexedWords = {}; /* These are the words searched/deleted while detecting */
		bounds = [0, boundsize];


		// Clear existing spaces
		$('#notecard-text').text("")

		console.log("Attempting to load card", cardInd)
		let notecardRaw = NCcontentRaw[cardInd].Content
		let presentationText = spanify(notecardRaw)

		debugLogs("Keywords: ", keywords)

		// Using listedWords, fill indexedWords with parsed word bank (listedWords)
		resetWordIndex(false)

		$('#notecard-text').html(presentationText)

		// UPDATE: Limit buttons based on notecards available
		if(cardInd+1 == cardsN) nextButton.disabled = true;
		else nextButton.disabled = false;
		if(cardInd == 0) prevButton.disabled = true;
		else prevButton.disabled = false;
	}

	// convert raw to list that will allow recognized words to be removed
	// var notecardRaw = $('#notecard-text').text().trim()
	
	//========== CREATE SPANS W/ IMPORTED WORDS ======================
	
	// Make a list of words with hardcoded indexes for adjusting bounds for optimization
	loadNotecardPreview(cardInd)
	
	// Reference words with a contant index and replace whitespace to be recognized against
	
	debugLogs(indexedWords)
	
	//============= RESET SESSION ======================
	function resetWordIndex(initial){
		// Restore list of words to detect by using the listedWords array from before
		indexedWords = {}; // Don't need any past words
		debugLogs(listedWords)
		for(let i = 0; i < listedWords.length; i++)
			indexedWords[i] = listedWords[i]
												.replace(/[.,\?\/#!$%\^&\*;:{}=\-_`~()]/g,"")
												.toLocaleLowerCase();
		// Set all spans back to white
		if(!initial)
			for(let k = 0; k < listedWords.length; k++)
				$("#word"+k).css("color","white");
	}
	
	//============== DETECTING WORDS ===================
	function checkKeywords(word){
		word = word.toLowerCase()
		Object.keys(keywords).forEach(function(key) {
			if (word === keywords[key]) {
				delete keywords[key]
				delete indexedWords[key]
				fillPreviousWords(key)
				$("#word"+key).css("color","green");
				
				if (jQuery.isEmptyObject(keywords)) {
					wordsDone = true
				}
			}
		})
		return 0;
	}

	function detectAndAffect(words){
		let word;
		for(let i = 0; i < words.length; i++){
			word = words[i].toLowerCase();

			//Check for keywords being said regardless of location in card
			if (checkKeywords(word)) break

			//Iterate through the applied bounds to check for non-keywords
			for(let j = bounds[0]; j < bounds[1]; j++){
				if(indexedWords.hasOwnProperty(j) === false) continue;
				// debugLogs("  ",indexedWords[j])
				if(word === indexedWords[j]){
					delete indexedWords[j]
					if (!keywords.hasOwnProperty(j)) $("#word"+j).css("color","yellow")
	
					// Bump up bounds 
					if(modeStatus == 's'){
						if(bounds[0] < j){
							fillPreviousWords(j, word)
						}
					}
					// Verbatim mode logic - each time a word is processed, the upper bound increases by one. When a word is filled, it will set the lower bound to the index of the new earliest word.
					else if (modeStatus == 'v') {
						// There is no native function to find the min of an array of strings, so just use reduce to find the new lowest key
						bounds[0] = Number(Object.keys(indexedWords).reduce(function (p, v) {
							return ( p < v ? p : v );
						  }));
						bounds[1] = Number(bounds[1]) + 1;
					}
					break;
				}
			}
		}
	}

	function moveIfDone() {
		if(wordsDone || jQuery.isEmptyObject(indexedWords)) {
			socket.on("speechData", function() {})
			wordsDone = false
			setTimeout(showNextCard, 0); // If anymore operations execute after this, bugs induce.
			return 1;
		}
	}

	function fillPreviousWords(index, word=null) {
		if (bounds[0] >= index || modeStatus == 'v') return
		// Stupid little hack that keeps 3 or fewer letter words from triggering this annoyingly
		if (word != null && word.length <= 3) {
			bounds[1] = Number(bounds[1]) + 1
			return
		}
		for (let i = bounds[0]; i < index; i++) {
			if(indexedWords.hasOwnProperty(i) === false) continue;
			if (!keywords.hasOwnProperty(i)) {
				delete indexedWords[i]
				$("#word"+i).css("color","yellow")
			} 
		}
		bounds[0] = index
		bounds[1] = bounds[0] + boundsize
	}
	


	//================= SOCKET IO =================
	socket.on('connect', function (data) {
		console.log("Trying to joing server")
		socket.emit('join', 'Server Connected to Client')
	});
	
	socket.on('messages', function (data) {
		//debugLogs(data);
	});

	function processSpeechData(data) {
		dataFinal = undefined || data.results[0].isFinal;
		var words = data.results[0].alternatives[0].transcript.split(' ')

		if (dataFinal === false) {
			debugLogs(words);
			if(detectAndAffect(words.slice(-2))){
				console.log("STOP DOING THINGS")	
				return;
			} 
		} else if (dataFinal === true) {
			debugLogs("======= FINAL ======\n",words,"==============\n")
			detectAndAffect(words)
			moveIfDone()
			endButton.disabled = false
		}
	}
	
	socket.on('speechData', processSpeechData);
	
	function debugLogs(text) {
		if (0) console.log(text)
	}
	
	
	
	
	
	window.onbeforeunload = function () {
		if (streamStreaming) { socket.emit('endGoogleCloudStream', ''); }
	};
	
	//================= SANTAS HELPERS =================
	
	// sampleRateHertz 16000 //saved sound is awefull
	function convertFloat32ToInt16(buffer) {
		let l = buffer.length;
		let buf = new Int16Array(l / 3);
	
		while (l--) {
			if (l % 3 == 0) {
				buf[l / 3] = buffer[l] * 0xFFFF;
			}
		}
		return buf.buffer
	}
	
	var downsampleBuffer = function (buffer, sampleRate, outSampleRate) {
		if (outSampleRate == sampleRate) {
			return buffer;
		}
		if (outSampleRate > sampleRate) {
			throw "downsampling rate show be smaller than original sample rate";
		}
		var sampleRateRatio = sampleRate / outSampleRate;
		var newLength = Math.round(buffer.length / sampleRateRatio);
		var result = new Int16Array(newLength);
		var offsetResult = 0;
		var offsetBuffer = 0;
		while (offsetResult < result.length) {
			var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
			var accum = 0, count = 0;
			for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
				accum += buffer[i];
				count++;
			}
	
			result[offsetResult] = Math.min(1, accum / count)*0x7FFF;
			offsetResult++;
			offsetBuffer = nextOffsetBuffer;
		}
		return result.buffer;
	}
})
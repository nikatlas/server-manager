var sm = require('./index.js');

var readline = require('readline');
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


var address = "0.0.0.0";
var port = 1213;
var server = sm.UDP.create("test", port, address); // promise
server.then(function(server){
	console.log("everything ok! ");
	//lets send a message to another server
	
	// so  here we use our 'on' function
	server.on('testscript','message', function(msg){
		console.log("MESSAGE FORM Client 1 ");
		console.log(msg.toString()); // GOOGLE
	});
});
// running in console! Client now 

// client test
var server2 = sm.UDP.createClient("test", port, "127.0.0.1"); // promise.
function sendMessage(){
	rl.question('Send Message? ', (answer) => {
		server2.then(function(s){
			s.send(answer); // sending data  
			sendMessage();
		}); 
	});
}
sendMessage();





//lets test


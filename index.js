var net = require('net');
var dgram = require('dgram');
var utils = require('util');
var fs = require('fs');
var promise = require('promise');
require('promise/lib/rejection-tracking').enable(
  {allRejections: true}
);
function newServer(name){
	var server = {
		name: name,
		_ip:"",
		_port:0,
		_server:null,
		_createServer: function (fun) {
			if(!fun)fun = function(conn) {console.log('server connected');}
			this._server = net.createServer(fun);
			return promise.resolve(this._server);
		},
		_bind: function(port, ip){
			var self = this;
			return new promise(function(resolve,reject){
				self._server.listen(port, ip, function(){
					resolve(server);
				});
				console.log("listening");
				self._server.on('listening', function() {
				});
				self._server.on('error', function(e){
					reject(e);
				})
			});
		},
		create: function(port, ip){
			var self = this;
			return this._createServer()
					.then(function(server){
						console.log("Bindind!");
						return self._bind(port,ip);
					})
					.then(function(obj){
						obj._ip = ip;
						obj._port = port;
						console.log("Server created and is bound to " + ip + ":" + port + " !");
						return obj;
					});
		}
	}
	return	server;
}

function newClient(name){
	var client = {
		name: name,
		_ip: "",
		_port: 0,
		_socket: null,
		_createSocket: function(){
			var self = this;
			self._socket = new net.Socket();
			return promise.resolve(self._socket);
		},
		_connectSocket: function(port,ip){
			var self = this;
			return new promise(function(resolve,reject){
				self._socket.connect(port,ip,function(){
					console.log("Connected!");
					resolve(client);
				});

				self._socket.on('error', function(err) {
				    console.log(err);
				    reject(err);
				});
			});
		},
		connect: function(port,ip){
			var self = this;
			return self._createSocket().then(function(){
				return	self._connectSocket(port,ip);
			});
		},
		sendFile: function(filepath){
			var self = this;
			return new promise(function(resolve,reject){
				var fileStream = fs.createReadStream(filepath);
			    console.log("ReadStream on file: " + filepath)
			    fileStream.on('error', function(err){
			        console.log(err);
			        reject(err);
			    })

			    fileStream.on('open',function() {
			        fileStream.pipe(self._socket);
			        resolve(fileStream);
			    });
			});
		}
	}
	return client;
}
var ServerManager = {
	servers : {},
	clients : {},
	create 	: function(name, port, ip){
		ServerManager.servers[name] = newServer(name);
		return ServerManager.servers[name].create(port,ip).then( function(r){ 
			return ServerManager.servers[name]; 
		});
	},
	createClient: function(name,port,ip){
		ServerManager.clients[name] = newClient(name);
		return ServerManager.clients[name].connect(port,ip);
	},
	get 	: function(name){
		return servers[name];
	},
	getClient: 	function(name){
		return clients[name];
	}
};

















function newUDPServer(name){ // Done! Test if its runnign 
	var server = {
		name: name,
		_ip:"",
		_port:0,
		_server:null,
		_createServer: function (fun) {
			if(!fun)fun = function(conn) {console.log('server connected');}
			this._server = dgram.createSocket('udp4');
			return promise.resolve(this._server);
		},
		_bind: function(port, ip){
			var self = this;
			return new promise(function(resolve,reject){
				self._server.bind(port, ip, function(){
					resolve(server); 	// this callback
					// the listening callback is called already... 

				});
				console.log("listening");
				self._server.on('listening', function() {
					// To add on listening ! but its the same as ^
				});
				self._server.on('error', function(e){
					reject(e); // error handling
				})
			});
		},
		create: function(port, ip){ // done
			var self = this; 
			return this._createServer()
					.then(function(server){
						console.log("Bindind!");
						return self._bind(port,ip);
					})
					.then(function(obj){
						obj._ip = ip;
						obj._port = port;
						console.log("Server created and is bound to " + ip + ":" + port + " !");
						return obj; 
					});
		},
		createClient: function(port,ip){
			return this._createServer()
						.then(function(s){
							console.log("UDP Socket is ready!");
							server._ip = ip;
							server._port = port;
							return server; // want to return the parent object not the socket only
						});

		},
		// Inheriting and overriding if we want event handling implementation
		callbacks: {},
		on: function(callbackname, event, callback){
			if( !server.callbacks[event] )
				server.callbacks[event] = {}; // initialize as obbject
			server.callbacks[event][callbackname] = callback; // if the same code tries to add the same callback it will be overwritten! 
			server._server.on(event,callback);
		},
		send : function(msg){ // since i have a client i have a target ip:port stored locally
			// Here i must make the iteration process that was mentioned ...
			server._server.send(msg, 0, msg.length, server._port, server._ip, function(r){
				console.log(r);
			});
		}
	}
	return	server;
}




var UDPServerManager = {
	servers : {},
	clients : {},
	create 	: function(name, port, ip){
		ServerManager.servers[name] = newUDPServer(name);
		return ServerManager.servers[name].create(port,ip).then( function(r){ 
			return ServerManager.servers[name]; 
		});
	},
	createClient : function(name, port, ip){
		ServerManager.clients[name] = newUDPServer(name);
		return ServerManager.clients[name].createClient(port,ip).then( function(r){ 
			return ServerManager.clients[name]; 
		});
	},
	get 	: function(name){
		return servers[name];
	},
	getClient: 	function(name){
		return clients[name];
	}
};

module.exports = { TCP: ServerManager , UDP : UDPServerManager };
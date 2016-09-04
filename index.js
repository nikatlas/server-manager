var net = require('net');
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

module.exports = ServerManager;
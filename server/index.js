var WebSocketServer = require('websocket').server;
var http = require('http');

const NEW_CLIENT_CONNECT = "$NEW_CLIENT_CONNECT$";
const CLIENT_ACCEPTED = "$CLIENT_ACCEPT$";
const CLIENT_DISCONNECT = "$CLIENT_DISCONNECT$";
const SEND_MESSAGE = "$SEND_MESSAGE$";
const RECIEVE_MESSAGE = "$RECIEVE_MESSAGE$"

const clients = new Map();

const broadcast_new_client = (newClientID) => {
  clients.forEach((value) => {
      value.sendUTF(NEW_CLIENT_CONNECT + newClientID);
  })  
};

const broadcast_disconnected_client = (oldClientID) => {
    clients.forEach((value) => {
        value.sendUTF(CLIENT_DISCONNECT + oldClientID);
    })  
  };

const getUniqueID = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4();
  };

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8888, function() {
    console.log((new Date()) + ' Server is listening on port 8888');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted. Informing other clients.');
    var clientID = getUniqueID()
    clients.forEach((value, key) => {
        connection.sendUTF(NEW_CLIENT_CONNECT + key);
    }) 
    clients.set(clientID, connection);
    broadcast_new_client(clientID);
    connection.sendUTF(CLIENT_ACCEPTED + clientID);
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            if(message.utf8Data.startsWith(SEND_MESSAGE)){
                clients.forEach((value) => {
                    value.sendUTF(RECIEVE_MESSAGE + message.utf8Data.slice(SEND_MESSAGE.length));
                });
            }
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        clients.delete(clientID);
        broadcast_disconnected_client(clientID);
    });
});
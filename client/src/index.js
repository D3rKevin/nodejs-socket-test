import React from 'react';
import './index.css';
import { render } from "react-dom";
var W3CWebSocket = require('websocket').w3cwebsocket;
const rootElement = document.getElementById("root");

var ownID = "";

const NEW_CLIENT_CONNECT = "$NEW_CLIENT_CONNECT$";
const CLIENT_ACCEPTED = "$CLIENT_ACCEPT$";
const CLIENT_DISCONNECT = "$CLIENT_DISCONNECT$";
const SEND_MESSAGE = "$SEND_MESSAGE$";
const RECIEVE_MESSAGE = "$RECIEVE_MESSAGE$"

const addClientToList = (client) => {
    const clientList = document.getElementById("list");
    const newClient = document.createElement("li");
    newClient.id = client;
    newClient.innerHTML = client;
    clientList.appendChild(newClient);
}

const handleClientDisconnect = (client) => {
    document.getElementById(client).remove();
    const disconnectMessage = document.createElement("p");
    disconnectMessage.innerHTML = client + " has disconnected";
    document.getElementById("chat").appendChild(disconnectMessage);
}

const addMessageToChat = (data) => {
    const sender = data.slice(1, 13);
    const message = data.slice(15);

    const newMessage = document.createElement("p");
    newMessage.innerHTML= sender + ": " + message;
    document.getElementById("chat").appendChild(newMessage);
}

const resolveData = (data) => {
    if(data.startsWith(NEW_CLIENT_CONNECT)){
        addClientToList(data.slice(NEW_CLIENT_CONNECT.length));
        return;
    }

    if(data.startsWith(CLIENT_ACCEPTED)){
        ownID = data.slice(CLIENT_ACCEPTED.length);
        return;
    }

    if(data.startsWith(CLIENT_DISCONNECT)){
        handleClientDisconnect(data.slice(CLIENT_DISCONNECT.length));
        return;
    }

    if(data.startsWith(RECIEVE_MESSAGE)){
        addMessageToChat(data.slice(RECIEVE_MESSAGE.length));
        return;
    }
}

var client = new W3CWebSocket('ws://localhost:8888/', 'echo-protocol');

client.onerror = function() {
    console.log('Connection Error');
};

client.onopen = function() {
    console.log('WebSocket Client Connected');
};

client.onclose = function() {
    console.log('echo-protocol Client Closed');
};

client.onmessage = function(e) {
    if (typeof e.data === 'string') {
        console.log("Received: '" + e.data + "'");
        resolveData(e.data);
    }
};

const sendMessage = () => {
    var input = document.getElementById("chatInput");
    var message = input.value;
    client.send(SEND_MESSAGE + "&" + ownID + "&" + message);
    input.value = "";
}

render(
    <div id="root">
        <h1>Hello World!</h1>
        <div>
            <p>Connected Clients</p>
            <ul id="list">
            </ul>
            <div id="chat">

            </div>
            <input id="chatInput"></input>
            <button id="chatButton" onClick={sendMessage}>Send</button>
        </div>
    </div>
    , rootElement //reference to index.html
    );
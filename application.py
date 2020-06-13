import os

from flask import Flask, jsonify, render_template, request, redirect
from flask_socketio import SocketIO, emit
from liao import *

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)




#Chat global variables
channels = {}
#Add default channel
default = Channel("main")
channels["main"] = default

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("log in")
def login(data):
    username = data["username"]
    #Username constraints
    if len(username) < 1:  #AT LEAST   ONE CHARACTER
        print("username was below 1")
        return
    for key in channels:   #UNIQE
        if username in channels[key].users:
            print("username was already there")
            return

    c = channels["main"]
    c.add_user(username)
    emit("logged in", {"username": username})
    print(f"{username} wants to log in")

@socketio.on("log out")
def logout(data):
    username = data["username"]
    channel = data["channel"]
    c = channels[channel]
    c.rem_user(username)


@socketio.on("new channel")
def newChannel(data):
    #Get data of new channel
    channel = data["channel"]
    #Channel name constraints
    if len(channel) < 1:  #AT LEAST   ONE CHARACTER
        return
    if channel in channels.keys():  #UNIQE
        return
    #Create new channel object and append
    c = Channel(channel)
    channels[channel] = c
    emit("add channel", {"channel": channel}, broadcast=True)


@socketio.on("submit message")
def message(data):
    print("OMAEWA")
    channel = data["channel"]
    username = data["username"]
    message = data["message"]
    #Message constraints
    if len(message) < 1:  #AT LEAST   ONE CHARACTER
        return

    m = Message(user = username, message = message)
    timestamp = m.timestamp
    c = channels[channel]
    c.add_message(m)
    emit("announce message", {"channel": channel, "username": username, "message": message, "timestamp": timestamp}, broadcast=True)

    print(channel)

@socketio.on("change channel")
def changeChannel(data):

    oldchannel = data["channel"]
    channel = data["selection"]
    username = data["username"]

    #Remove user from old channel
    c = channels[oldchannel]
    c.rem_user(username)

    #Add user to new channel
    c = channels[channel]
    c.add_user(username)
    #Get new channel messages
    messages = c.list_messages()
    print(messages)

    emit("join channel", {"channel": channel, "messages": messages})


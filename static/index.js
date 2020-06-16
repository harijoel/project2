//TEST TEST: SATURDAY
// localStorage.setItem('username': 'harios');
// localStorage.setItem('channel': 'main');
function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

function displayChannel(channel) {
   // Vainilla JS but using links and Bootstrap
    const a = document.createElement('a');
    a.innerHTML = channel;
    a.className = "list-group-item list-group-item-action joinChannel";
    a.dataset.channel = channel;
    document.querySelector('#chatboxChannels').append(a);
}

function displayMessage(msg) {
    const li = document.createElement('li');
    //Convert epoch to local time
    const timestamp = formatAMPM(new Date(msg['timestamp'] * 1000));
    li.innerHTML = `<div class="row">
                        <div class="col-6 text-left text-primary">${msg['username']}:</div>
                        <div class="col-6 text-right text-muted">${timestamp}</div>
                    </div>
                    <dvi class="text-left">${msg['message']}</dvi>`;
    li.className = "list-group-item";
    document.querySelector('#channelMessages').prepend(li);
}

document.addEventListener('DOMContentLoaded', () => {
    //localStorage.setItem('channel', 'main');
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    const updateDisplay = () => {
        // Ensure user is added
            const username = localStorage.getItem("username");
            const channel = localStorage.getItem("channel");

            if (!username)
            {
                document.querySelector("#chatbox").style.display = "none";
                document.querySelector("#loginbox").style.display = "block";  
                console.log('login is visible'); 

            } else {
                document.querySelector("#loginbox").style.display = "none";
                document.querySelector("#chatbox").style.display = "block";
                const showuser = document.querySelector("#showuser");
                showuser.innerHTML = username;
                const currentChannel = document.querySelector("#currentChannel");
                currentChannel.innerHTML = channel;
                console.log('chatbox is visible');

                socket.emit('chatbox state', {'username': username, 'channel': channel});

            }
            console.log('socket is connected'); 
        };

    socket.on('connect', () => {
        /* Connect socket */
        //load necesary components
        updateDisplay();

        // socket.on('disconnect', () => {
        //     /* Connect socket */
        //     //load necesary components
        //     const username = localStorage.getItem("username");
        //     const channel = localStorage.getItem("channel");
        //     socket.emit('disconnected', {'username': username, 'channel': channel});
    
        // });

    });

    window.onbeforeunload = function () {
        const username = localStorage.getItem("username");
        const channel = localStorage.getItem("channel");
        socket.emit('disconnected', {'username': username, 'channel': channel});
    };

    socket.on('disconnect', () => {
        /* Connect socket */
        //load necesary components
        const username = localStorage.getItem("username");
        const channel = localStorage.getItem("channel");
        socket.emit('disconnected', {'username': username, 'channel': channel});

    });

    socket.on('load state', data => {
        const channels = data.channels;
        const selection = data.channel;
        const channel = localStorage.getItem("channel"); 
        const username = localStorage.getItem("username");
        const messages = data.messages;
        const users = data.users;
        //const users = data.users;

        // console.log('users online:');
        // console.log(users);

            //Hide old channel messages
        document.querySelector('#channelMessages').innerHTML = '';
        console.log(messages)
            //Display new channel messages
        messages.forEach(msg => {
            displayMessage(msg);
        });

            //Hide old channels
        document.querySelector('#chatboxChannels').innerHTML = '';
            //Display current channels
        channels.forEach(channel => {
            displayChannel(channel);

        });

            //Display current channel online users
        document.querySelector('#chatboxUsers').innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.id = `user-${user}`;
            li.className = "channelUser";
            li.innerHTML = user;
            document.querySelector('#chatboxUsers').append(li);
        });

        //socket.emit('user step', {'username': data.username, 'channel': channel, 'step': 'enter'});   //NEW LINE 6/15

        console.log('state is loaded');
    });

    socket.on('alert', data => {
        const message = data.message;
        alert(`Oops! ${message}`);
    });


    document.querySelector('#login').onsubmit = () => {
        const username = document.querySelector("#username").value;
        socket.emit('log in', {'username': username});
        document.querySelector("#username").value = '';
        console.log(`${username} wants to log in`);
        return false;
    };

    socket.on('logged in', data => {
        localStorage.setItem('username', data.username);
        localStorage.setItem('channel', 'main');
        updateDisplay();
        socket.emit('user step', {'username': data.username, 'channel': 'main', 'step': 'enter'});
        console.log(`${data.username} logged in`);
    });

    document.querySelector('#logout').onclick = () => {
        const username = localStorage.getItem("username");
        const channel = localStorage.getItem("channel");
        socket.emit('log out', {'username': username, 'channel': channel});
        //socket.emit('user step', {'username': username, 'channel': channel, 'step': 'leave'});
        localStorage.clear();
        //updateDisplay();
    }

    socket.on('logged out', data => {
        
        updateDisplay();
        console.log(`${data.username} logged out and left ${data.channel}`);
        socket.emit('user step', {'username': username, 'channel': channel, 'step': 'leave'});
    })

        // Send button should emit a "submit message" event
    document.querySelector('#sendMessage').onsubmit = () => {
        const channel = localStorage.getItem("channel");
        const username = localStorage.getItem("username");
        const message = document.querySelector('#msg').value;
        // Send: channel, username, text message
        socket.emit('submit message', {'channel': channel, 'username': username, 'message': message});
        // Clear input field
        document.querySelector('#msg').value = '';
        console.log(`${username} said: --${message}-- from ${channel}`);
        return false;
    };

        // When a new message is announced, add to the unordered list
    socket.on('announce message', data => {
        const channel = data.channel;
        if (localStorage.getItem("channel") === channel) {
            displayMessage(data);
        } else {
            console.log("you DON'T SEE this message");
        };
    });

        //Request a new channel to be created
    document.querySelector('#addChannel').onsubmit = () => {
        const channel = document.querySelector('#channelName').value;
        socket.emit('new channel', {'channel': channel});
        // Clear input field
        document.querySelector('#channelName').value = '';
        console.log(`${channel} channel wants to be added`);
        return false;
    };
        // When a new channel is created, add to the unordered list
    socket.on('add channel', data => {
        displayChannel(data.channel);

        console.log(`${data.channel} channel was added`);
    });

    socket.on('addrem user', data => {
        const step = data.step;
        const channel = data.channel;
        const username = data.username;
        console.log(`${username} has ${step} the channel ${channel}`);

        if ( localStorage.getItem("channel") === channel && username !== localStorage.getItem("username") )  {
            if (step == "enter") {
                //add user to online list
                const li = document.createElement('li');
                li.innerHTML = username;
                li.className = "channelUser";
                li.dataset.channel = username;
                li.id = `user-${username}`;
                document.querySelector('#chatboxUsers').append(li);
            } else {
                // //remove user from online list
                // document.querySelector(`#user-${username}`).style.display = "none";
                const users = document.querySelectorAll('.channelUser')
                users.forEach(user => {
                    if (user.id === `user-${username}`) {
                        user.style.display = "none";
                    };
                });
            };
        };

        // if ( localStorage.getItem("channel") === channel && localStorage.getItem("username") !== username ) {
        //     console.log("UPDATE DISPLAY");
        //     updateDisplay();
        // };

        // updateDisplay();     
    });

        //  Add event to dynamicaly generated elements
    document.addEventListener('click', function(e){
        if (e.target && e.target.classList.contains("joinChannel")) {
            console.log(`${e.target.dataset.channel} was clicked`);
            const selection = e.target.dataset.channel;  //new channel
            const username = localStorage.getItem("username");
            const channel = localStorage.getItem("channel");  //old current channel
            socket.emit('change channel', {'username': username, 'channel': channel, 'selection': selection});
            
            console.log(`${username} wants to join ${selection} channel from ${channel} channel`);
        };
    });
    
        //  Change current channel and update
    socket.on('join channel', data => {
        const channel = data.channel;
        const username = data.username;
        const oldchannel = data.oldchannel;
        
        //Replace or current channel value
        localStorage.setItem('channel', channel);
        updateDisplay();
        socket.emit('user step', {'username': username, 'channel': oldchannel, 'step': 'leave'});
        socket.emit('user step', {'username': username, 'channel': channel, 'step': 'enter'});
        console.log(`you joined ${channel} channel`);        
    });



});
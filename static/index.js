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

                console.log("WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW");
                socket.emit('chatbox state', {'username': username, 'channel': channel});

                // //Display current channels
                // messages.forEach(msg => {
                //     const li = document.createElement('li');
                //     li.innerHTML = `${msg['username']} said: ${msg['message']} at ${msg['timestamp']}`;
                //     document.querySelector('#channelMessages').append(li);
                // });

                // // Join a channel if a user was in that particular channel before leaving & display channel messages
                // const username = localStorage.getItem("username");
                // const channel = localStorage.getItem("channel");
                // const selection = localStorage.getItem("channel");
                // socket.emit('change channel', {'username': username, 'channel': channel, 'selection': selection});
            }
            console.log('socket is connected'); 
        };

    socket.on('connect', () => {
        /* Connect socket */
        //load necesary components
        updateDisplay();

    });

    socket.on('load state', data => {
        const channels = data.channels;
        const selection = data.channel;
        const channel = localStorage.getItem("channel"); //WW
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
            const li = document.createElement('li');
            //Convert epoch to local time
            const timestamp = formatAMPM(new Date(msg['timestamp'] * 1000));

            li.innerHTML = `${msg['username']} said: ${msg['message']} at ${timestamp}`;
            document.querySelector('#channelMessages').append(li);
        });


            //Display current channels
        document.querySelector('#chatboxChannels').innerHTML = '';
        channels.forEach(channel => {
            const li = document.createElement('li');
            li.innerHTML = channel;
            li.className = "joinChannel";
            li.dataset.channel = channel;
            document.querySelector('#chatboxChannels').append(li);
        });

            //Display current channel online users
        document.querySelector('#chatboxUsers').innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.id = `user-${user}`;
            li.innerHTML = user;
            document.querySelector('#chatboxUsers').append(li);
        });

        console.log('state is loaded');
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
        socket.emit('user step', {'username': data.username, 'channel': 'main', 'step': 'enter'});
        updateDisplay();
        console.log(`${data.username} logged in`);
    });

    document.querySelector('#logout').onclick = () => {
        const username = localStorage.getItem("username");
        const channel = localStorage.getItem("channel");
        localStorage.clear();
        socket.emit('log out', {'username': username, 'channel': channel});
        socket.emit('user step', {'username': username, 'channel': channel, 'step': 'leave'});
        updateDisplay();
        console.log(`${username} logged out and left ${channel}`);
    }

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
            const li = document.createElement('li');
            //Convert epoch to local time
            const timestamp = formatAMPM(new Date(data.timestamp * 1000));

            li.innerHTML = `${data.username} said: ${data.message} at ${timestamp}`;
            document.querySelector('#channelMessages').append(li);
            console.log("you SEE this message");
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
        
          // Vainilla JS implemantation
        const li = document.createElement('li');
        li.innerHTML = data.channel;
        li.className = "joinChannel";
        li.dataset.channel = data.channel;
        document.querySelector('#chatboxChannels').append(li);

        //   Handlebars implementation
        // const template = Handlebars.compile(document.querySelector('#channelTemp').innerHTML);
        // const content = template({'channelName': data.channel});
        // document.querySelector('#chatboxChannels').innerHTML += content;
        // console.log("channel was ever added 2")

        console.log(`${data.channel} channel was added`);
    });

    socket.on('addrem user', data => {
        const step = data.step;
        const channel = data.channel;
        const username = data.username;

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
                //remove user from online list
                document.querySelector(`#user-${username}`).style.display = "none";
            };
        };
        
        
    })

        //  Add event to dynamicaly generated elements
    document.addEventListener('click', function(e){
        if (e.target && e.target.classList.contains("joinChannel")) {
            console.log(`${e.target.dataset.channel} was clicked`);
            const selection = e.target.dataset.channel;  //new channel
            const username = localStorage.getItem("username");
            const channel = localStorage.getItem("channel");  //old current channel
            socket.emit('change channel', {'username': username, 'channel': channel, 'selection': selection});
            socket.emit('user step', {'username': username, 'channel': channel, 'step': 'leave'});
            console.log(`${username} wants to join ${selection} channel from ${channel} channel`);
        };
    });
    
        //  Change current channel and update
    socket.on('join channel', data => {
        const channel = data.channel;
        const username = data.username;
        
        //Replace or current channel value
        localStorage.setItem('channel', channel);
        socket.emit('user step', {'username': username, 'channel': channel, 'step': 'enter'});
        updateDisplay();
        console.log(`you joined ${channel} channel`);        
    });



});


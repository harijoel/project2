const updateDisplay = () => {
        // Ensure user is added
    if (!localStorage.getItem("username"))
    {
        document.querySelector("#chatbox").style.display = "none";
        document.querySelector("#loginbox").style.display = "block";  
        console.log('chatbox is not visible'); 

    } else {
        document.querySelector("#loginbox").style.display = "none";
        document.querySelector("#chatbox").style.display = "block";
        const showuser = document.querySelector("#showuser");
        showuser.innerHTML = localStorage.getItem("username");
        console.log('loginbox is not visible');

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



document.addEventListener('DOMContentLoaded', () => {
    updateDisplay();
    //This is project2 Friday
    // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // socket.on('connect', () => {
    //     /* Connect socket */
    //     //request channels to load
    //     socket.emit('load channels')

    // });

    document.querySelector('#login').onsubmit = () => {
        console.log('username is being submited');
        const username = document.querySelector("#username").value;
        localStorage.setItem('username', username);
        localStorage.setItem('channel', 'main');
        socket.emit('log in', {'username': username});
        updateDisplay();
        return false;
    };

    document.querySelector('#logout').onclick = () => {
        const username = localStorage.getItem("username");
        const channel = localStorage.getItem("channel");
        localStorage.removeItem("username");
        localStorage.removeItem("channel");
        socket.emit('log out', {'username': username, 'channel': channel});
        updateDisplay();
    }

        // Send button should emit a "submit message" event
    document.querySelector('#sendMessage').onsubmit = () => {
        const channel = localStorage.getItem("channel");
        console.log(channel);
        const username = localStorage.getItem("username");
        console.log(username);
        const message = document.querySelector('#msg').value;
        console.log(message);
        // Send: channel, username, text message
        socket.emit('submit message', {'channel': channel, 'username': username, 'message': message});
        // Clear input field
        document.querySelector('#msg').value = '';
        console.log('message sent')

        return false;
    };

        // When a new message is announced, add to the unordered list
    socket.on('announce message', data => {
        const channel = data.channel
        if (localStorage.getItem("channel") === channel) {
            console.log(data.channel);
            const li = document.createElement('li');
            li.innerHTML = `${data.username} said: ${data.message} at ${data.timestamp}`;
            document.querySelector('#channelMessages').append(li);
        }
        
    });

        //Request a new channel to be created
    document.querySelector('#addChannel').onsubmit = () => {
        const channel = document.querySelector('#channelName').value;
        socket.emit('new channel', {'channel': channel});
        // Clear input field
        document.querySelector('#channelName').value = '';
        console.log("addChannel");

        return false;
    };
        // When a new channel is created, add to the unordered list
    socket.on('add channel', data => {
        console.log("channel was ever added 1")
        const li = document.createElement('li');
        li.innerHTML = data.channel;
        li.className = "joinChannel";
        li.dataset.channel = data.channel;
        document.querySelector('#chatboxChannels').append(li);
          // Handlebars implementation
        // const template = Handlebars.compile(document.querySelector('#channelTemp').innerHTML);
        // const content = template({'channelName': data.channel});
        // document.querySelector('#chatboxChannels') += content;
        // console.log("channel was ever added 2")
    });

    document.addEventListener('click', function(e){
        if (e.target && e.target.classList.contains("joinChannel")){
            console.log(`${e.target.dataset.channel} was clicked`);
            const selection = e.target.dataset.channel;  //new channel
            const username = localStorage.getItem("username");
            const channel = localStorage.getItem("channel");  //old current channel
            console.log(`${username} wants to join ${selection} channel from ${channel} channel`);
            socket.emit('change channel', {'username': username, 'channel': channel, 'selection': selection});
        }
    });
    

    socket.on('join channel', data => {
        const channel = data.channel;
        const messages = data.messages;

        localStorage.setItem('channel', channel);

        //Hide old channel messages
        document.querySelector('#channelMessages').innerHTML = '';
        console.log(messages)

        //Display new channel messages
        messages.forEach(msg => {
            const li = document.createElement('li');
            li.innerHTML = `${msg['username']} said: ${msg['message']} at ${msg['timestamp']}`;
            document.querySelector('#channelMessages').append(li);
        });


        
    })



});


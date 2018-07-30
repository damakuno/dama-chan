const tmi = require('tmi.js');
const haikudos = require('haikudos');
const twiapi = require('./ext_api/twiapi.js');
const osuapi = require('./ext_api/osuapi.js');
const yamlhandler = require('./yamlhandler.js');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
const { app, BrowserWindow, ipcMain } = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800, height: 600,
    })
    // and load the index.html of the app.
    mainWindow.loadFile('index.html')
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})


let db = {
    polls: []
}
// Valid commands start with:
let commandPrefix = '!';
// Define configuration options:
let opts = {
    identity: {
        username: config.bot_username,
        password: 'oauth:' + config.bot_account_token
    },
    channels: config.default_channels
};

// These are the commands the bot knows (defined below):

let knownCommands = { echo, haiku, followers, latestfollower, osu }

// Function called when the "echo" command is issued:
function echo(target, context, params) {
    // If there's something to echo:
    if (params.length) {
        // Join the params into a string:
        const msg = params.join(' ')
        // Send it back to the correct place:
        sendMessage(target, context, msg)
    } else { // Nothing to echo
        console.log(`* Nothing to echo`)
    }
}

// Function called when the "haiku" command is issued:
function haiku(target, context) {
    // Generate a new haiku:
    haikudos((newHaiku) => {
        // Split it line-by-line:
        newHaiku.split('\n').forEach((h) => {
            // Send each line separately:
            sendMessage(target, context, h)
        })
    })
}

function followers(target, context) {
    twiapi.getFollowsCount('damakuno', (ret) => {
        let msg = `Follower count: ${ret}`;
        sendMessage(target, context, msg);
    });
}

function latestfollower(target, context) {
    twiapi.getFollowEvents('damakuno', (ret) => {
        twiapi.getUserById(ret[0].from_id, (ret) => {
            let msg = `ChocolaChamp Latest follower: ${ret.display_name} ChocolaChamp`;
            sendMessage(target, context, msg);
        });
    });
}

function osu(target, context, params) {
    let info = {};
    let username = 'damakuno'
    if (params.length) {
        username = params[0]
    }

    osuapi.getUserStats(username, 0, 'string', (user_info) => {
        if (user_info) {
            info = user_info;
            sendMessage(target, context, `${info.username}'s Osu stats:`);
            sendMessage(target, context, `Accuracy: ${parseFloat(info.accuracy).toFixed(2)}% :: Rank:${info.pp_rank}`);
            sendMessage(target, context, `Country: ${info.country} :: Rank:${info.pp_country_rank}`);
        }
    });
}

//poll handling variables
let pollActive = false;
let votedUsers = [];
let poll = { id: null, question: "", options: [] }
// Mod only commands
let modCommands = { votestart, voteend }

function votestart(target, context, params) {
    if (pollActive) {
        sendMessage(target, context, "Please end the current poll before starting a new one.");
        return;
    }
    if (params.length) {
        const input = params.join(' ');
        let questionMatch = /.+\?/g;
        //let optionMatches = /\s*(\w+);/g;
        let optionMatches = /\s*([^;?]+);/g;
        let question = questionMatch.exec(input)[0];
        let match = null;
        poll.id = db.polls.length + 1;
        poll.question = question;
        do {
            match = optionMatches.exec(input);
            if (match) {
                let name = match[1];
                poll.options.push({ name: name, result: 0 });
            }
        } while (match !== null)

        if (poll.options.length < 2) {
            sendMessage(target, context, "Please specify at least two options for the poll.");
            return;
        }
        sendMessage(target, context, `Start voting for:`);
        sendMessage(target, context, `${poll.question}`);
        poll.options.forEach((op, index) => {
            sendMessage(target, context, `Type ${index + 1} for \"${op.name}\"`);
        });
        pollActive = true;
        mainWindow.webContents.send('poll-start', poll);
    }
}

function capturevote(id, vote) {
    if (pollActive) {
        //don't count the vote if user exists: comment if testing
        // if (votedUsers.includes(id)) return;
        votedUsers.push(id);
        if (!isNaN(vote) && vote > 0 && vote <= poll.options.length) {
            poll.options[vote - 1].result++;
            mainWindow.webContents.send('poll-vote', poll.options);
        }
    }
}

function voteend(target, context) {
    if (pollActive) {
        sendMessage(target, context, `Voting ended for:`);
        sendMessage(target, config, `${poll.question}`);
        poll.options.forEach((op) => {
            sendMessage(target, context, `${op.name}: ${op.result}`);
        });
        db.polls.push(poll);
        yamlhandler.saveDatabase(db);
        pollActive = false;
        poll = { id: null, question: "", options: [] }
        votedUsers = [];
    } else {
        sendMessage(target, context, 'There is no on-going poll');
    }
}
// Helper function to send the correct type of message:
function sendMessage(target, context, message) {
    if (context['message-type'] === 'whisper') {
        client.whisper(target, message)
    } else {
        client.say(target, message)
    }
}

// Create a client with our options:
let client = new tmi.client(opts)

// Register our event handlers (defined below):
client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)
client.on('disconnected', onDisconnectedHandler)

// Connect to Twitch:
client.connect()

// Called every time a message comes in:
function onMessageHandler(target, context, msg, self) {
    if (self) { return } // Ignore messages from the bot

    if (pollActive) {
        capturevote(context['user-id'], msg.trim());
    }
    // This isn't a command since it has no prefix:
    if (msg.substr(0, 1) !== commandPrefix) {
        console.log(`[${target} (${context['message-type']})] ${context.username}: ${msg}`)
        return
    }
    // Split the message into individual words:
    const parse = msg.slice(1).split(' ')
    // The command name is the first (0th) one:
    const commandName = parse[0]
    // The rest (if any) are the parameters:
    const params = parse.splice(1)

    // If the command is known, let's execute it:
    if (commandName in knownCommands) {
        // Retrieve the function by its name:
        const command = knownCommands[commandName]
        // Then call the command with parameters:
        command(target, context, params)
        console.log(`* Executed ${commandName} command for ${context.username}`)
    } else if (commandName in modCommands) {
        if (context.mod || context.username === 'damakuno') {
            const command = modCommands[commandName]
            command(target, context, params)
            console.log(`* Executed ${commandName} command for ${context.username}`)
        } else {
            console.log(`* User ${context.username} is not a mod, unable to execute command`)
        }
    } else {
        console.log(`* Unknown command ${commandName} from ${context.username}`)
    }
}

// Called every time the bot connects to Twitch chat:
function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
    db = yamlhandler.loadDatabase();
    // mainWindow.webContents.send('info', { msg: 'info from app.js' });
}

// Called every time the bot disconnects from Twitch:
function onDisconnectedHandler(reason) {
    console.log(`Womp womp, disconnected: ${reason}`)
    process.exit(1)
}

exports.checkPollActive = () => {
    return pollActive;
}

exports.getActivePoll = () => {
    return poll;
}
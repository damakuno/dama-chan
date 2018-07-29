const axios = require('axios').default;
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const AUTH_CONFIG = {
    'Authorization': 'Bearer ' + config.client_token,
    'Client-ID': config.client_id
}

const _getUser = (userName, callback) => {
    axios.get(
        'https://api.twitch.tv/helix/users', {
            headers: AUTH_CONFIG,
            params: {
                login: userName
            }
        }).then((res) => {
            let user = res.data;
            callback(user.data[0]);
        }).catch((err) => {
            console.log(err);
            callback(null);
        });
}

const _getUserById = (Id, callback) => {
    axios.get(
        'https://api.twitch.tv/helix/users', {
            headers: AUTH_CONFIG,
            params: {
                id: Id
            }
        }).then((res) => {
            let user = res.data;
            callback(user.data[0]);
        }).catch((err) => {
            console.log(err);
            callback(null);
        });
}

exports.getFollowEvents = (userName, callback) => {
    _getUser(userName, (user) => {
        axios.get(
            'https://api.twitch.tv/helix/users/follows', {
                headers: AUTH_CONFIG,
                params: {
                    to_id: user.id
                }
            }).then((res) => {
                let follows = res.data;
                callback(follows.data);
            }).catch((err) => {
                console.log(err);
                callback(null);
            });
    });
}

exports.getFollowsCount = (userName, callback) => {
    _getUser(userName, (user) => {
        axios.get(
            'https://api.twitch.tv/helix/users/follows', {
                headers: AUTH_CONFIG,
                params: {
                    to_id: user.id
                }
            }).then((res) => {
                let follows = res.data;
                let total = follows.total;
                callback(total);
            }).catch((err) => {
                console.log(err);
                callback(null);
            });
    });
}

exports.getUser = _getUser;
exports.getUserById = _getUserById;
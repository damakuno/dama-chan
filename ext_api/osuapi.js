const axios = require('axios').default;
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const URL = config.osu_api.url;
const API_KEY = config.osu_api.api_key;

const _getUser = (user_id, mode, type, event_days, callback) => {
    axios.get(`${URL}get_user`, {
        params: {
            k: API_KEY,
            u: user_id,
            m: mode,
            type: type,
            event_days: event_days
        }
    }).then(
        (res) => {
            callback(res.data[0]);
        }).catch((err) => {
            callback(null);
        })
}

exports.getUserStats = (user_id, mode, type, callback) => {
    _getUser(user_id, mode, type, 1, (user_info) => {
        callback(user_info);
    });
}
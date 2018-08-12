const axios = require('axios').default;
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

const URL = config.brawhalla_api.url;
const API_KEY = config.brawhalla_api.api_key;
const MY_STEAM_ID = '76561198082424941'

const _getUserFromSteamId = (steam_id) => {
    return new Promise((resolve, reject) => {
        axios.get(`${URL}search`, {
            params: {
                steamid: steam_id,
                api_key: API_KEY
            }
        }).then((res) => {
            resolve(res.data.brawlhalla_id);
        }).catch((err) => {
            reject(err);
        });
    });
}

const _getUserStats = (brawlhalla_id) => {
    return new Promise((resolve, reject) => {
        axios.get(`${URL}player/${brawlhalla_id}/stats`, {
            params: {
                api_key: API_KEY
            }
        }).then((res) => {
            resolve(res.data);
        }).catch((err) => {
            reject(err);
        });
    });
}

const _getMyStats = () => {
    return new Promise((resolve, reject) => {
        _getUserFromSteamId(MY_STEAM_ID).then((id) => {
            _getUserStats(id).then((data) => {
                resolve(data);
            }).catch(err => reject(err));
        }).catch(err => reject(err));
    });
}

module.exports.getUserStats = _getUserStats;
module.exports.getMyStats = _getMyStats;
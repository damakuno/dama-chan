# Dama-chan
General purpose twitch chat bot with a UI layer built on ElectronJS. 
# Setup Instructions

1. Rename `config.Config` to `config.json` with the values replaced accordingly.
2. To get your `client_token` and `client_id` you need to register your application [here](https://glass.twitch.tv/console/apps/create). Be sure to store your `client_token` somewhere safe because it will not be shown again after you generate one.
3. To get your `bot_account_token` simply visit https://twitchapps.com/tmi/ to get it while logged in to your bot account. `bot_username` would be your bot account username.
4. `default_channels` is an array of twitch channels that you want your bot to join on start up.
5. `yaml_db_path` is the file path for the yaml file that is currently being used as a mock database. You need not create the yaml file.
6. `osu_api` contains the `url` which is the URL for the Osu! API which might be subject to change. You can request an API key from https://osu.ppy.sh/p/api. Fill in the `api_key` with it.

# Usage

```
npm start
```

# License
Dama-chan is currently licensed under the MIT License.

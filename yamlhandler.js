const yaml = require('js-yaml');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

exports.loadDatabase = () => {
    let readDatabase = null;
    if (fs.existsSync(config.yaml_db_path)) {
        readDatabase = yaml.safeLoad(fs.readFileSync(config.yaml_db_path, 'utf8'));
    } else {
        console.log(`${config.yaml_db_path} does not exist!`);
    }
    return readDatabase;
}

exports.saveDatabase = (db) => {
    fs.writeFileSync(config.yaml_db_path, yaml.safeDump(db));
}
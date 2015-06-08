var shell = require('shelljs');
console.log("Starting Hubot");
shell.exec('HUBOT_SLACK_TOKEN=xoxb-5131687015-hukyBIAns8TPDRPFi369ol94 ./bin/hubot --adapter slack');
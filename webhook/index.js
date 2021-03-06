const { createServer } = require('http');
const createHandler = require('github-webhook-handler');
const { runCommand, logMessage } = require('./command');
const { HOOK_PORT } = require('./plugins');

const handler = createHandler({ path: '/spider', secret: 'mytoken' });  // maybe there is no token;

createServer((req, res) => handler(req, res, e => {
    res.statusCode = 404;
    res.end('no such location');
  })
).listen(HOOK_PORT, () => console.log(`listening on port ${HOOK_PORT}`));

// 执行pull命令
// 执行
handler.on('error', err => console.error('Error:', err.message));
handler.on('push', event => {
  console.log(`Received a push event for ${event.payload.repository.name} to ${event.payload.ref}`);
  runCommand('sh', [`${__dirname}/cicd.sh`])
    .then(res => logMessage(res, '-----------切出子进程进行自动pull-----------'))
    .then(res => runCommand('sh', [`${__dirname}/install.sh`]))
    .then(res => logMessage(res, '-----------线上依赖安装完成-----------'))
    .then(res => runCommand('sh', [`${__dirname}/restart.sh`]))
    .then(res => logMessage(res, '-----------线上服务部署完成----------'))
    .catch(e => console.log(e));
  ;
});

// issue钩子
handler.on('issues', event => {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title);
});


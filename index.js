var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
const webSocket = require('ws');

// view engine setup
// 设置路由访问根目录
app.set('views', path.join(__dirname, 'views'));
// 设置模板引擎为 ejs
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// 这个是设置静态资源路径，这里用不上
app.use(express.static(path.join(__dirname, 'public')));
// express 路由
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'webSocket测试' });
});
app.use('/', router);
// 使用 node 内置的 http 创建服务
var server = http.createServer(app);

// 这部分是处理 webSocket 在node服务端的代码
var wsServer = null;
var keepAlive = null;
var aliveCount = 0;

var wsService = {
    connection (ws) {
        // 连上一个添加一个在线人数
        aliveCount++;

        ws.on('message', function incoming(message) {
            wsServer.clients.forEach(function(client) {
                // 发送给自已
                // if(client == ws) {
                //     client.send("你刚才给服务端发送了数据：" + message)
                // }
                // 发送给其它人
                if(client != ws) {
                    var mo = JSON.parse(message);
                    mo.aliveCount = aliveCount;
                    client.send(JSON.stringify(mo))
                }
            })
        });

        // 客户端断开在线数减一
        ws.on('close', function() {
            aliveCount--
        })

        // 所有客户端的 onmessage 监听都会收到 这个是不是可以当作心跳保持呢
        keepAlive = setInterval(function() {
            // WebSocket.CONNECTING = 0;
            // WebSocket.OPEN = 1;
            // WebSocket.CLOSING = 2;
            // WebSocket.CLOSED = 3;
            if(ws.readyState === 1) {
                ws.send(JSON.stringify({keepAlive: 1}))
            } else {
                clearInterval(keepAlive)
            }
        }, 5000)
    },
    setWss (wss) {
        wsServer = wss
    }
};

const wss = new webSocket.Server({server});
// 监听客户端websocket连接
wss.on('connection', wsService.connection)
wsService.setWss(wss)

var port = 4000;
// 监听 4000 端口
server.listen(port);
server.on('error', function(err){});
server.on('listening', function() {
    console.log('listening on:' + port)
});
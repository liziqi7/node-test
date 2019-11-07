const Koa = require('koa');
const session = require('koa-session');
const redisStore = require('koa-redis');
const redis = require('redis');
const client = redis.createClient(6379, 'localhost');

const app = new Koa();

app.keys = ['im a newer secret', 'i like turtle'];

// 错误处理中间件写在最上面
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    // 系统日志
    console.log(error);
    // 给用户显示信息
    // ctx.status = error.statusCode || error.status || 500;
    // ctx.type = "json";
    ctx.type = 'text';
    if (error.expose) {
      ctx.body = error.message;
    } else {
      ctx.body = error.stack;
    }

    // 全局错误处理
    // ctx.app.emit('error', error);
  }
});

// session配置
const SESS_CONFIG = {
  key: 'kkb:sess', // 设置cookie中的key名字 sid koa:sess
  maxAge: 86400000, // 有效期：默认一天
  httpOnly: true, // 仅服务端修改
  signed: true, // 签名cookie
  store: redisStore({ client }) // 使用redis存储session数据
};

app.use(session(SESS_CONFIG, app));
app.use(async ctx => {
  if (ctx.path === '/favicon.ico') return;
  //   // 访问
  let n = ctx.session.count || 0;
  //   console.log(n);

  //   // 设置
  //   ctx.session.set('count', 5);
  ctx.session.count = 2;

  ctx.body = 'Hello World2' + n;
  //   ctx.body = '第' + n + '次访问';
  //   // 查询redis数据
  //   client.keys('*', (err, keys) => {
  //     console.log(keys);
  //     keys.forEach(key => {
  //       client.get(key, (err, val) => {
  //         console.log(val);
  //       });
  //     });
  //   });
});

// logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// response

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);

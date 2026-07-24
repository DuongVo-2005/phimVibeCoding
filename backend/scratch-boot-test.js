const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('rophim');
  process.env.JWT_ACCESS_SECRET = 'test_access_secret';
  process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  process.env.OPHIM_API_BASE_URL = 'https://ophim1.com';
  process.env.OPHIM_CRAWLER_ENABLED = 'false';
  process.env.PORT = '3099';

  console.log('Mongo URI:', process.env.MONGODB_URI);

  const { NestFactory } = require('@nestjs/core');
  const { AppModule } = require('./dist/app.module');
  const { ValidationPipe } = require('@nestjs/common');

  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(3099);
  console.log('APP_LISTENING_OK');

  const http = require('http');
  const req = http.get('http://localhost:3099/api/v1/health', (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', async () => {
      console.log('HEALTH_STATUS', res.statusCode);
      console.log('HEALTH_BODY', body);
      await app.close();
      await mongod.stop();
      process.exit(0);
    });
  });
  req.on('error', async (err) => {
    console.error('HEALTH_REQUEST_ERROR', err);
    await app.close();
    await mongod.stop();
    process.exit(1);
  });
})().catch(async (err) => {
  console.error('BOOT_ERROR', err);
  process.exit(1);
});

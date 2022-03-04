import { INestApplication, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';

import { json, urlencoded } from 'body-parser';
import { Request } from 'express';

export interface RawBodyRequest extends Request {
  rawBody: string;
}

export function configureBodyParser(app: INestApplication) {
  const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };

  app.use(urlencoded({ verify: rawBodyBuffer, extended: true }));
  app.use(json({ verify: rawBodyBuffer }));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  configureBodyParser(app);

  const port = process.env.PORT || 3333;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();

import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { CommonModule } from './common/common.module'
import { ConfigModule } from './config/config.module'
import { AppController } from './app.controller'

@Module({
  imports: [
    ConfigModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src/static'),
      serveRoot: process.env['APP_PATH'] ? process.env['APP_PATH'] : '/',
      exclude: ['/api*']
    }),
    CommonModule
  ],
  controllers: [AppController]
})
export class AppModule {}

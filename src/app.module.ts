import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { ParticipantModule } from './modules/participant.module'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from './modules/common.module'
import { ServiceOfferingModule } from './modules/service-offering.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src/static'),
      exclude: ['/api*']
    }),
    CommonModule,
    ParticipantModule,
    ServiceOfferingModule
  ]
})
export class AppModule {}

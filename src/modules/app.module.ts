import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { ParticipantModule } from './participant.module'
import { ConfigModule } from '@nestjs/config'
import { CommonModule } from './common.module'
import { ServiceOfferingModule } from './service-offering.module'

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

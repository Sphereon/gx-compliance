import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'
import { ParticipantModule } from './participant/participant.module'
import { CommonModule } from './common/common.module'
import { ServiceOfferingModule } from './service-offering/service-offering.module'
import { ConfigModule } from './config/config.module'

@Module({
  imports: [
    ConfigModule,
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

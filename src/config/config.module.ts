import { Module } from '@nestjs/common'
import { ConfigModule as CModule } from '@nestjs/config'
import validationSchema from './validation.schema'

@Module({
  imports: [
    CModule.forRoot({
      cache: true,
      isGlobal: true,
      validationSchema
    })
  ]
})
export class ConfigModule {}

import { NestFactory } from '@nestjs/core'
import { AppModule } from './modules/app.module'
import { RequestMethod } from '@nestjs/common'
import { setupSwagger } from './swagger'
import { createDidDocument } from './utils/methods/did.util'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('/api/', {
    exclude: [{ path: '/', method: RequestMethod.GET }]
  })
  setupSwagger(app)

  createDidDocument()

  app.enableCors()
  await app.listen(process.env.PORT || 3000)
}
bootstrap()

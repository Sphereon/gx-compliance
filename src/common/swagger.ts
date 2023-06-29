import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import { description, name, version } from '../../package.json'
import { CommonModule } from './common.module'
import { writeFileSync } from 'fs'
import { join } from 'path'

export const SWAGGER_UI_PATH = 'docs'

const options = {
  tagsSorter: 'alpha',
  operationsSorter: 'alpha',
  customCss: `.curl-command { display: none } .swagger-ui .topbar { display: none }; `
}

const versions = [
  {
    number: version,
    latest: true,
    includedModules: [CommonModule]
  }
]

export function setupSwagger(app: INestApplication) {
  for (const version of versions) {
    const config = new DocumentBuilder().setTitle(name).setDescription(description).setVersion(version.number).build()

    const document = SwaggerModule.createDocument(app, config, {
      ignoreGlobalPrefix: false,
      include: version.includedModules
    })

    const appPath = process.env['APP_PATH'] ? process.env['APP_PATH'] : ''

    writeFileSync(join(__dirname, '../static/openapi.json'), JSON.stringify(document), { encoding: 'utf8' })

    SwaggerModule.setup(`${appPath}/${SWAGGER_UI_PATH}`, app, document, options)
  }
}

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { INestApplication } from '@nestjs/common'
import { name, description } from '../../package.json'
import { writeFileSync } from 'fs'
import * as path from 'path'
import { ParticipantModule } from '../participant/participant.module'
import { ServiceOfferingModule } from '../service-offering/service-offering.module'
import { CommonModule } from './common.module'

export const OPEN_API_DOC_PATH = path.resolve(process.cwd(), 'openapi.json')

export const SWAGGER_UI_PATH = 'docs'

const options = {
  tagsSorter: 'alpha',
  operationsSorter: 'alpha',
  customCss: `.curl-command { display: none } .swagger-ui .topbar { display: none }; `
}

const versions = [
  {
    number: 'latest',
    latest: true,
    includedModules: [CommonModule, ParticipantModule, ServiceOfferingModule]
  }
]

export function setupSwagger(app: INestApplication) {
  for (const version of versions) {
    const config = new DocumentBuilder().setTitle(name).setDescription(description).setVersion(version.number).build()

    const document = SwaggerModule.createDocument(app, config, { ignoreGlobalPrefix: false, include: version.includedModules })

    const versionPath = `v${version.number.split('.')[0]}`
    const appPath = process.env['APP_PATH'] ? process.env['APP_PATH'] : ''

    writeFileSync(version.latest ? OPEN_API_DOC_PATH : OPEN_API_DOC_PATH.replace('.json', `-${versionPath}.json`), JSON.stringify(document), {
      encoding: 'utf8'
    })

    SwaggerModule.setup(`${appPath}/${SWAGGER_UI_PATH}/${versionPath}`, app, document, options)

    if (version.latest) SwaggerModule.setup(`${appPath}/${SWAGGER_UI_PATH}`, app, document, options)
  }
}

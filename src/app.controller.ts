import { Controller, Get } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { bugs, description, name, repository, version } from '../package.json'

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  getDescription() {
    return {
      software: name,
      description,
      version,
      documentation: `${process.env.BASE_URL}/docs/`,
      repository,
      bugs
    }
  }
}

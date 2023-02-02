import { ApiProperty } from '@nestjs/swagger'

export class VerifyServiceOfferingDto {
  @ApiProperty({
    description: 'The HTTP location of the Service Offering Self Description to verify',
    example: 'https://compliance.gaia-x.eu/.well-known/serviceComplianceService.json'
  })
  public url: string
}

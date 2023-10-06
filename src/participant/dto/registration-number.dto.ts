import { ApiProperty } from '@nestjs/swagger'

export type RegistrationNumberTypes = 'EORI' | 'EUID' | 'leiCode' | 'local' | 'vatID'

export class RegistrationNumberDto {
  @ApiProperty({
    description: 'The type of the registrationNumber that is submitted',
    enum: ['EORI', 'EUID', 'leiCode', 'local', 'vatID']
  })

  public type: RegistrationNumberTypes

  @ApiProperty({
    description: 'The registrationNumber itself'
  })
  
  public number: string
}

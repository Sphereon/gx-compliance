import { ApiProperty } from '@nestjs/swagger'

export class VerifyParticipantDto {
  @ApiProperty({
    description: 'The HTTP location of the Participant Self Description to verify',
    example: 'https://compliance.gaia-x.eu/.well-known/participant.json'
  })
  public url: string
}

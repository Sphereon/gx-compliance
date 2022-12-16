import { ApiProperty } from '@nestjs/swagger'
import { SignatureDto } from './signature.dto'
import { IProof, IVerifiableCredential, IVerifiablePresentation, PresentationSubmission } from '@sphereon/ssi-types'

//TODO: refactor togi use for all credentials (compliance, sd)
export class VerifiablePresentationDto implements IVerifiablePresentation {
  @ApiProperty({
    description: 'The context to be used for the self description.'
  })
  public '@context': string[] | any

  @ApiProperty({
    description: 'The type of the VerifiablePresentation.'
  })
  public type: string[]

  @ApiProperty({
    description: 'verifiableCredentials of the presentation.',
    required: true
  })
  public verifiableCredential: IVerifiableCredential[]

  @ApiProperty({
    description: 'Holder of the presentation.'
  })
  public holder?: string

  @ApiProperty({
    description: 'The date of issuance of the credential.'
  })
  public domain: string

  @ApiProperty({
    description: 'The proof of the credential.'
  })
  public proof: IProof
}

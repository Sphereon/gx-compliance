import { SsiTypesParserPipe } from '../../../utils/pipes/ssi-types-parser.pipe'
import { Address2210vpDto } from '../../../@types/dto/common/address-2210vp.dto'

describe('SsiTypesParserPipe ', () => {
  it('should convert the address to a valid dto', async () => {
    const pipe = new SsiTypesParserPipe()
    const address = {
      '@type': 'vcard:Address',
      'vcard:country-name': {
        '@value': 'NL',
        '@type': 'xsd:string'
      },
      'vcard:gps': {
        '@value': '52.1352365,5.0280565',
        '@type': 'xsd:string'
      },
      'vcard:street-address': {
        '@value': 'Bisonspoor',
        '@type': 'xsd:string'
      },
      'vcard:postal-code': {
        '@value': '3605LB',
        '@type': 'xsd:string'
      },
      'vcard:locality': {
        '@value': 'Maarssen',
        '@type': 'xsd:string'
      }
    }
    const addressDto: Address2210vpDto = pipe.getAddressValues(address)
    expect(addressDto['street-address']).toBe('Bisonspoor')
    expect(addressDto['country-name']).toBe('NL')
  })
})

import fetch from 'cross-fetch'

import { extendContextLoader } from 'jsonld-signatures'
import jsonld from 'jsonld'
import * as fs from 'fs'

export class DocumentLoader {
  getLoader() {
    return extendContextLoader(async (url: string) => {
      // due to instability of registry.gaia-x.eu, we're caching this turtle file
      if (url === 'https://registry.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/trustframework') {
        return fs.readFileSync('src/contexts/trustframework.ttl')
      }
      if (url === 'https://www.w3.org/2018/credentials/v1') {
        return fs.readFileSync('src/contexts/credentials.jsonld')
      }
      const response = await fetch(url)
      if (response.status === 200) {
        const document = await response.json()
        return {
          contextUrl: null,
          documentUrl: url,
          document
        }
      }

      const { defaultDocumentLoader } = jsonld
      return defaultDocumentLoader(url)
    })
  }
}

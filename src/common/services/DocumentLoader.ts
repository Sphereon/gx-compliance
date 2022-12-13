import fetch from 'cross-fetch'

import { extendContextLoader } from 'jsonld-signatures'
import jsonld from 'jsonld'

export class DocumentLoader {
  getLoader() {
    return extendContextLoader(async (url: string) => {
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

import { Injectable } from '@nestjs/common'
import { soap } from 'strong-soap'

@Injectable()
export class SoapService {
  async getSoapClient(url: string, args = {}): Promise<any> {
    return new Promise((resolve, rejects) => {
      soap.createClient(url, args, (err, client) => {
        if (err) rejects(err)

        resolve(client)
      })
    })
  }

  async callClientMethod(client: any, method: string, args: any = {}): Promise<any> {
    return new Promise((resolve, rejects) => {
      client[method](args, (err, res) => {
        if (err) rejects(err)

        const { return: returned } = res
        resolve(returned)
      })
    })
  }
}

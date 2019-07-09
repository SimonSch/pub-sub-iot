import Command from '@oclif/command'
import {cli} from 'cli-ux'
import * as fs from 'fs'
import {Client, connect, IClientOptions} from 'mqtt'
import {Observable} from 'rxjs'

const Listr = require('listr')

export default class Connect extends Command {
  static description = 'Connect to MQTT server'
  static args = [
    {name: 'topic', required: true},
    {name: 'broker', required: false}
  ]
  broker = ''
  topic = ''

  async run() {
    const {args} = this.parse(Connect)
    const opts: IClientOptions = {}
    this.broker = args.broker || ''
    this.topic = args.topic
    const client: Client = connect(`mqtt://${this.broker}`, opts)
    const tasks = new Listr([
      {
        title: 'Checking Credentials',
        task: (ctx: any) => {
          return new Observable(observer => {
            fs.readFile('creds.json', 'utf8', (err, data) => {
              if (err) {
                ctx.loggedIn = false
                observer.error('Please login first')
              } else {
                let _data = JSON.parse(data)
                if (_data.username && _data.password) {
                  ctx.loggedIn = true
                  observer.next(false)
                  observer.complete()
                } else {
                  ctx.loggedIn = false
                  observer.error('Error with username or password please login again')
                }
              }
            })
          })
        }
      },
      {
        title: `Connecting to ${this.broker ? this.broker : 'default broker'}`,
        enabled: (ctx: any) => ctx.loggedIn === true,
        task: () => {
          client.on('connect', () => {
            return new Observable(observer => {
              observer.next(true)
              observer.complete()
            })
          })
        }
      },
      {
        title: 'Listening',
        enabled: (ctx: any) => ctx.loggedIn === true,
        task: () => {
          return new Observable(observer => {
            client.subscribe({['/' + this.topic]: {qos: 2}}, () => {
            }).on('message', (topic: string, payload: Buffer) => {
              observer.next(`message from ${topic}: ${payload}`)
            })
          })
        }
      }
    ])

    tasks.run().catch((err: any) => {
      cli.error(err)
    })
  }

}

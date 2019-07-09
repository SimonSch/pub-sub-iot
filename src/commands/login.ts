import Command from '@oclif/command'
import {cli} from 'cli-ux'
import * as fs from 'fs'

export default class Login extends Command {
  static description = 'Login'

  static args = [
    {name: 'username', required: true}
  ]

  async run() {
    const {args} = this.parse(Login)
    let password = await cli.prompt('Please enter your password', {type: 'hide'})

    if (password && args.username) {
      let data = {
        username: args.username,
        password
      }
      fs.writeFileSync('creds.json', JSON.stringify(data))
    }
  }
}

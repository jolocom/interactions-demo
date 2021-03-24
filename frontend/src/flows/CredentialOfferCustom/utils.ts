import { renderAsForType } from "./config"
import { ICredential } from "./types"

export const getPreparedCredentials = (credential: ICredential) => {
    const {name, type, inputs, id} = credential
    const claims: Record<string, string> = {}
    const display = {
      properties: inputs.map(inp => {
        claims[inp.key] = inp.value
        return {
          path: [`$.${inp.key}`],
          label: inp.label,
          value: inp.value || 'Not specified',
        }
      }),
    }
    return {
      id,
      renderAs: renderAsForType[type],
      name,
      type,
      claims,
      display,
    }
}
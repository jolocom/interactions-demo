import React from 'react'
import './reset.css'
import './App.css'
import { InteractionContainer } from './ui/interaction'
const jolocomLogo = require('./images/JO_icon.svg')

interface State {
  loading: boolean
  qrCode: {
    source: string
  }
}

class App extends React.Component<{ jwtCommand: string}> {
  render() {
    return (
      <React.Fragment>
        <header className="c-header" style={{textAlign: 'center'}}>
          <h1><img src={jolocomLogo} alt="Jolocom Logo" />&nbsp;Jolocom</h1>
          <h1>Interactions Demo</h1>
        </header>
        <main className="main">
          <article className="c-qrcode-container">
            <InteractionContainer jwtCommand={this.props.jwtCommand} />
          </article>
        </main>
      </React.Fragment>
    )
  }
}

export default App

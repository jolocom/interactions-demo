import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'

const jwtCommand = process.env.JWT_COMMAND || 'cd rpc_agent;\nyarn start'
ReactDOM.render(<App jwtCommand={jwtCommand}/>, document.getElementById('root'))

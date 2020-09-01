import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'

const jwtCommand = process.env.REACT_APP_JWT_COMMAND || 'cd rpc_agent;\nyarn start'
const hostport = process.env.REACT_APP_SERVICE_HOSTPORT || 'localhost:9000'
const tls = !!process.env.REACT_APP_SERVICE_TLS || false
const serviceAPI = new JolocomWebServiceClient(hostport, '/jolo', tls)

ReactDOM.render(<App serviceAPI={serviceAPI} jwtCommand={jwtCommand}/>, document.getElementById('root'))

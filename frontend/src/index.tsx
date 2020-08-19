import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import { JolocomWebServiceClient } from '@jolocom/web-service-client'

const jwtCommand = process.env.JWT_COMMAND || 'cd rpc_agent;\nyarn start'
const hostport = process.env.SERVICE_HOSTPORT || 'localhost:9000'
const serviceAPI = new JolocomWebServiceClient(hostport, '/jolo', false)
ReactDOM.render(<App serviceAPI={serviceAPI} jwtCommand={jwtCommand}/>, document.getElementById('root'))

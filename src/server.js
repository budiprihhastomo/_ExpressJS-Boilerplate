require('module-alias/register')
const App = require('./app')
const { getAllController } = require('./utils/helper')

const controllers = getAllController()

new App(controllers).listenServer()

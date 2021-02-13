require('dotenv/config')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const errorMiddleware = require('@/http/middlewares/error.middleware')

class App {
    constructor(controllers) {
        this.app = express();
        this.port = process.env.PORT

        this.initializeMiddleware()
        this.initializeController(controllers)
        this.initializeErrorHandling()
    }

    initializeMiddleware() {
        this.app.use(cors())
        this.app.use(bodyParser.urlencoded({ extended: true }))
        this.app.use(bodyParser.json())
        this.app.use(cookieParser())
    }

    initializeController(controllers = []) {
        controllers.map(controller => {
            this.app.use('/api/v' + process.env.VERSION, controller.route)
        })
    }

    initializeErrorHandling() {
        this.app.use(errorMiddleware)
    }

    listenServer() {
        this.app.listen(this.port, () => console.log("Server Running at Port : " + this.port))
    }
}

module.exports = App
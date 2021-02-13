const HttpException = require('@utils/http_exception')

class BadRequestException extends HttpException {
    constructor(error) {
        super(400, error)
    }
}

module.exports = BadRequestException
const HttpException = require('@utils/http_exception')

class TokenNotValidException extends HttpException {
    constructor() {
        super(403, "Token tidak valid.")
    }
}

module.exports = TokenNotValidException
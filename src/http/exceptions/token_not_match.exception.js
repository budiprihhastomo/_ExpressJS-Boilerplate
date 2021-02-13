const HttpException = require('@utils/http_exception')

class TokenNotMatchException extends HttpException {
    constructor() {
        super(403, "Token tidak ditemukan.")
    }
}

module.exports = TokenNotMatchException
const HttpException = require('@utils/http_exception')

class TokenExpiredException extends HttpException {
    constructor() {
        super(401, "Token sudah kadaluwarsa.")
    }
}

module.exports = TokenExpiredException
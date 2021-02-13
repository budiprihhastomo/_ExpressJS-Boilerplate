const HttpException = require('@utils/http_exception')

class AuthorizationFailedException extends HttpException {
    constructor() {
        super(401, "username atau password salah.")
    }
}

module.exports = AuthorizationFailedException
const HttpException = require('@utils/http_exception')

class UnauthorizedException extends HttpException {
    constructor() {
        super(403, "Tidak diizinkan mengakses.")
    }
}

module.exports = UnauthorizedException
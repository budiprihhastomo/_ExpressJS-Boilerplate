const HttpException = require('@utils/http_exception')

class NotFoundException extends HttpException {
    constructor() {
        super(404, "Data tidak ditemukan.")
    }
}

module.exports = NotFoundException
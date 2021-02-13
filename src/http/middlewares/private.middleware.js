const { TokenNotValidException, TokenExpiredException, UnauthorizedException, TokenNotMatchException } = require("@exceptions")
const { verify, TokenExpiredError, JsonWebTokenError } = require("jsonwebtoken")
const client = require('@utils/redis')


module.exports = (req, res, next) => {
    const accessToken = req.cookies.access_token || req.headers['authorization'].split(" ")[1]
    
    if (!accessToken) return next(new TokenNotValidException())

    try {
        const isTokenActive = verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY)

        const { id } = isTokenActive || {}

        return client.GET(id, (err, value) => {
            value = JSON.parse(value) || {}

            if (value && isTokenActive && !err && value.access_token === accessToken) return next()

            else return next(new UnauthorizedException())
        })

    }
    catch (err) {
        if (err instanceof TokenExpiredError) return next(new TokenExpiredException())

        else if (err instanceof JsonWebTokenError) return next(new TokenNotMatchException())
        
        return next(new Error("Kesalahan dalam server."))
    }
}
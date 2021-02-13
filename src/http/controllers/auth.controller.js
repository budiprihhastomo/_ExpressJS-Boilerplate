const { Router } = require('express')
const { User: user } = require('@models')
const { response, validate, validateAuthorization } = require('@/utils/helper')
const { AuthorizationFailedException, TokenExpiredException, TokenNotMatchException, TokenNotValidException } = require('@exceptions')
const { body } = require('express-validator')
const { compareSync } = require('bcrypt')
const { sign, verify, JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken')
const client = require('@/utils/redis')

class Auth {
    constructor() {
        this.path = '/auth'
        this.route = Router()
        this.initializeRoute()
    }

    validateRequestLogin() {
        return [
            body('username').notEmpty().withMessage('username tidak boleh kosong.'),
            body('password').notEmpty().withMessage('password tidak boleh kosong.')
        ]
    }

    initializeRoute() {
        this.route
            .post(this.path + '/login', this.validateRequestLogin(), validate, this.login)
            .post(this.path + '/token', validateAuthorization(1), validate, this.token)
            .delete(this.path + '/destroy', validateAuthorization(1), validate, this.destroy)
    }

    async login(req, res, next) {
        const { username, password } = req.body
        try {
            const data = await user.findOne({ where: { username } })
            if (data) {
                const isPasswordVerified = compareSync(password, data.password)
                const payload = data.toJSON()

                delete payload.password
                delete payload.remember_token

                if (isPasswordVerified) {
                    const accessToken = sign(payload, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: "1d" })
                    const refreshToken = sign({ id: payload.id }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: "3d" })

                    client.SETEX(payload.id, 3600 * 24 * 3, JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }))

                    res.cookie('access_token', accessToken, { httpOnly: true })
                    res.cookie('refresh_token', refreshToken, { httpOnly: true })

                    return response.action(null, res, "Authentikasi berhasil!", { accessToken, refreshToken })
                }
                return next(new AuthorizationFailedException())
            }
            return next(new AuthorizationFailedException())

        }
        catch (err) {
            next(new Error("Kesalahan pada server."))
        }
    }

    async token(req, res, next) {
        const refreshToken = req.cookies.refresh_token || req.body.refresh_token

        try {
            const { id: idFromRefreshToken } = verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY)

            client.GET(idFromRefreshToken, (async (err, value) => {
                if (value && JSON.parse(value).refresh_token === refreshToken) {
                    const data = await user.scope('withoutSensitiveData').findByPk(idFromRefreshToken)
                    const payload = data.toJSON()
                    const newAccessToken = sign(payload, process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: "1d" })
                    const newRefreshToken = sign({ id: payload.id }, process.env.REFRESH_TOKEN_SECRET_KEY, { expiresIn: "3d" })

                    client.SETEX(payload.id, 3600 * 24 * 3, JSON.stringify({ access_token: newAccessToken, refresh_token: newRefreshToken }))

                    res.cookie('access_token', newAccessToken, { httpOnly: true })
                    res.cookie('refresh_token', newRefreshToken, { httpOnly: true })

                    return response.action(null, res, "Authentikasi berhasil diperbarui!", { access_token: newAccessToken, refresh_token: newRefreshToken })
                }

                return next(new TokenNotValidException())
            }))

        }
        catch (err) {
            if (err instanceof TokenExpiredError) return next(new TokenExpiredException())
            else if (err instanceof JsonWebTokenError) return next(new TokenNotMatchException())

            return next(new Error("Kesalahan pada server."))
        }
    }

    async destroy(req, res, next) {
        const refreshToken = req.cookies.refresh_token || req.body.refresh_token

        try {

            const { id: idFromRefreshToken } = verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY)

            return client.GET(idFromRefreshToken, ((err, value) => {
                if (value && JSON.parse(value).refresh_token === refreshToken) {
                    client.DEL(idFromRefreshToken)

                    return response.action(null, res, null, {}, 204)
                }
                return next(new TokenNotValidException())
            }))
        }
        catch (err) {
            if (err instanceof TokenExpiredError) return next(new TokenExpiredException())
            else if (err instanceof JsonWebTokenError) return next(new TokenNotMatchException())

            next(new Error("Kesalahan pada server."))
        }

    }
}

module.exports = Auth

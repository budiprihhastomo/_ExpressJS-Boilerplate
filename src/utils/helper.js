const fs = require('fs')
const { Op } = require('sequelize')
const { validationResult } = require('express-validator')
const BadRequestException = require('../http/exceptions/bad_request.exception')
const { query, header, body, cookie } = require('express-validator')
const { verify } = require('jsonwebtoken')

module.exports = {
    getAllController: () => {
        const pathController = __dirname + '/../http/controllers/'

        const getAllController = fs.readdirSync(pathController)

        const controllers = getAllController.reduce((acc, curr) => {
            const initialController = require(pathController + curr)
            acc = [...acc, new initialController()]
            return acc
        }, [])

        return controllers
    },
    paginationFormatter: (query, searchAndSort = [[], []]) => {
        const { page, size } = query
        const limit = parseInt(size) || 10
        const offset = ((page - 1) * limit) || 0

        const where = searchAndSort[0].reduce((acc, curr) => {
            if (query.hasOwnProperty(curr)) {
                acc[Op.and] = { ...acc[Op.and], [curr]: { [Op.substring]: query[curr] } }
            }
            return acc;
        }, {})

        let order = [];
        if (query.hasOwnProperty('sortBy')) {
            const encodedURI = encodeURIComponent(query.sortBy)
            const withoutChar = encodedURI.replace(/\-|\%20/g, "").split('%2C')
            const formatSorting = encodedURI.replace(/\%20/g, '+').split('%2C')

            order = withoutChar.reduce((acc, curr, index) => {
                const isKeywordExist = searchAndSort[1].find(item => item[0] === curr)
                if (isKeywordExist) {
                    const signType = formatSorting[index].charAt(0) == "+" ? "DESC" : "ASC";
                    acc = [...acc, [isKeywordExist[0], signType]]
                }
                return acc
            }, [])
        }
        else {
            order = searchAndSort[1]
        }

        return [{ limit, offset, where, order }, { currentPage: page || 1 }]
    },
    response: {
        paginate: (res, data, paginate) => {
            const { count: total, rows: items } = data
            const { limit } = paginate[0]
            const { currentPage } = paginate[1]
            const totalPages = Math.ceil(total / limit)
            res.status(200).json({ total, totalPages, currentPage, items })
        },
        action: (action, res, customMessage = null, customResponse = {}, code = 200) => {
            const message = action ? (action === 'POST' || action === 'PUT') ? "Data berhasil disimpan!" : (action === 'DELETE_PERMANENTLY' ? 'Data berhasil dihapus permanen dari database!' : 'Data berhasil dihapus sementara dari database!') : customMessage
            return res.status(code).json({ status: code, message, ...customResponse })
        }
    },
    validate: (req, res, next) => {
        const errors = validationResult(req)

        if (errors.isEmpty()) return next()

        const extractedErrors = errors.array().reduce((acc, { param, msg }) => {
            acc = { ...acc, [param]: msg }
            return acc
        }, {})

        return next(new BadRequestException(extractedErrors))
    },
    validatePagination: () => ([
        query('size').optional().isInt({ min: 1 }).withMessage("Bilangan harus lebih besar dari 0."),
        query('page').optional().isInt({ min: 1 }).withMessage("Bilangan harus lebih besar dari 0.")
    ]),
    validateAuthorization: (refreshToken = 0) => {
        const verif = [
            header('authorization').notEmpty().withMessage('authorization tidak boleh kosong.').optional({ checkFalsy: true }),
            cookie('access_token').notEmpty().withMessage('authorization tidak boleh kosong.').optional({ checkFalsy: true }),
        ]
        if (refreshToken) verif.push(body('refresh_token').notEmpty().withMessage('refresh token tidak boleh kosong.').optional({ checkFalsy: true }))

        return verif
    },
    getUserIDFromCurrentUser: ({ headers }) => {
        const [type, token] = headers['authorization'].split(" ")
        const { id } = verify(token, process.env.ACCESS_TOKEN_SECRET_KEY)
        return id
    }
}
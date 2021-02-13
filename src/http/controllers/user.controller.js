const { Router } = require('express')
const { User: user } = require('@models')
const { paginationFormatter, response, validate, validatePagination, validateAuthorization } = require('@utils/helper')
const NotFoundException = require('@exceptions/not_found.exception')
const privateRoute = require('@middlewares/private.middleware')
const { body } = require('express-validator')
const { hashSync } = require('bcrypt')

class User {
    constructor() {
        this.path = '/user'
        this.route = Router()
        this.initializeRoute()
    }

    initializeRoute() {
        this.route
            .get(this.path, validateAuthorization(), validate, privateRoute, validatePagination(), this.index)
            .get(this.path + '/:id', validateAuthorization(), validate, privateRoute, this.show)
            .post(this.path, validateAuthorization(), validate, privateRoute, this.store)
            .put(this.path + '/:id', validateAuthorization(), validate, privateRoute, this.store)
            .delete(this.path + '/:id', validateAuthorization(), validate, privateRoute, this.destroy)
    }

    async index(req, res, next) {
        const searchAndSortField = [['username', 'first_name', 'last_name'], [['first_name', 'DESC'], ['last_name', 'DESC']]]

        try {
            const paginate = paginationFormatter(req.query, searchAndSortField)
            const data = await user.scope('withoutSensitiveData').findAndCountAll(paginate[0])

            return response.paginate(res, data, paginate)
        }
        catch (err) {
            next(new Error(err))
        }
    }

    async show(req, res, next) {
        const { id } = req.params
        try {
            const data = await user.scope('withoutSensitiveData').findOne({ where: { id } })

            return data ? res.status(200).json({ data }) : next(new NotFoundException())
        }
        catch (err) {
            next(new Error(err))
        }
    }

    async store(req, res, next) {
        const requestData = req.body

        try {
            requestData.password = hashSync(requestData.password, 10);

            if (req.method === "POST") {
                await user.create(requestData)
            }
            else if (req.method === "PUT") {
                const { id } = req.params

                const isExistData = await user.findOne({ where: { id } })

                if (isExistData) await user.update(requestData, { where: { id } })

                else return next(new NotFoundException())
            }

            return response.action(req.method, res)
        }
        catch (err) {
            next(new Error(err))
        }

    }

    async destroy(req, res, next) {
        const { id } = req.params
        const { force } = req.query

        try {
            const isExistData = await user.findOne({ where: { id }, paranoid: !force || false })
            if (isExistData) {
                await user.destroy({ where: { id }, force: force })
            }
            else {
                return next(new NotFoundException())
            }
        }
        catch (err) {
            next(new Error(err))
        }

        return response.action(force ? 'DELETE_PERMANENTLY' : 'DELETE_TEMPORARY', res)
    }
}

module.exports = User

module.exports = (error, req, res, next) => {
    const status = error.status || 500
    const message = error.message || "Kesalahan dari server."

    return res.status(status).json({ status, message })
}
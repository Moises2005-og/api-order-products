import jwt from "jsonwebtoken"

const jwtCode = process.env.JWT_SECRET

const auth = (req, res, next) => {
    const token = req.headers["authorization"]
    if (!token) {
        return res.status(403).json({ message: "No token provided!" })
    }

    jwt.verify(token.replace("Bearer ", ""), jwtCode, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Unauthorized!" })
        }
        req.userId = decoded.id
        next()
    })
}

export default auth
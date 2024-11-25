import jwt from 'jsonwebtoken'

export const validateToken = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
        const decoded = jwt.verify(token, 'xyz')
        // console.log("🚀 ~ validateToken ~ decoded:", decoded)
        req.user = decoded
        
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
}


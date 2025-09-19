import jwt from 'jsonwebtoken'

export const validateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: 'No authorization header provided' })
    }
    
    let token = authHeader
    // Check if token follows Bearer format and extract actual token
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7) // Remove 'Bearer ' prefix
    }
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' })
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xyz') as any
        req.user = { id: decoded.userId }
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' })
    }
}

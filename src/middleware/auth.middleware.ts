import jwt from 'jsonwebtoken'
import { FailureResponse } from '../helpers/api-response'

export const validateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json(FailureResponse('No authorization header provided', '4010'))
    }
    
    let token = authHeader
    // Check if token follows Bearer format and extract actual token
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7) // Remove 'Bearer ' prefix
    }
    
    if (!token) {
        return res.status(401).json(FailureResponse('No token provided', '4011'))
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'xyz') as any
        req.user = { id: decoded.userId }
        next()
    } catch (error) {
        return res.status(401).json(FailureResponse('Invalid or expired token', '4012'))
    }
}

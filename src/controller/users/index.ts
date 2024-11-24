import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { SuccessResponse } from '../../helpers/api-response'


const prisma = new PrismaClient()

const signUp = async (req: any, res: any) => {
    console.log(req.body)
    let jwtSecret = 'xyz'
    const { name, email } = req.body

    const user = await prisma.user.create({
        data: {
            name,
            email,
        },
    })
    const token = jwt.sign(user, jwtSecret);
    res.json(SuccessResponse('User created successfully', {token , ...user}))
}

const deleteUser = async (req: any, res: any) => {
    const { id } = req.body
    const user = await prisma.user.delete({
        where: {
            id: id,
        },
    })
    res.json(SuccessResponse('User deleted successfully', user))
}

const getUsers = async (req: any, res: any) => {
    const users = await prisma.user.findMany()
    res.json(users)
}


export { signUp, getUsers, deleteUser }
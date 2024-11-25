import express, {Router} from "express"
import { signUp , getUsers, deleteUser, signIn } from "../controller/users"
import { validateToken } from "../middleware/auth.middleware"

const router = Router()

router.post('/signup', signUp) 
router.post('/signin', signIn)
router.get('/all',validateToken ,getUsers)
router.get('/delete' , deleteUser)


export default router
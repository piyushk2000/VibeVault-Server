import express, {Router} from "express"
import { signUp , getUsers, deleteUser } from "../controller/users"
import { validateToken } from "../middleware/auth.middleware"

const router = Router()

router.post('/signup', signUp) 
router.get('/all',validateToken ,getUsers)
router.get('/delete' , deleteUser)


export default router
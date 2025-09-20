import express, { Router } from "express";
import { fetchBooks, fetchBookById } from "../controller/books";

const router = Router();

router.get('/', fetchBooks);
router.get('/:id', fetchBookById);

export default router;
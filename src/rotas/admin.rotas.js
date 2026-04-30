import { Router } from "express";
import adminControlador from "../controladores/admin.controlador.js";

const router = Router();

router.post("/login", adminControlador.login);

export default router;
import { Router } from "express";
import adminControlador from "../controladores/admin.controlador.js";
import usuarioAdminControlador from "../controladores/usuarioAdmin.controlador.js";
import { autenticarAdmin } from "../middlewares/autenticacaoAdmin.middleware.js";

const router = Router();

router.post("/login", adminControlador.login);
router.get("/usuarios", autenticarAdmin, usuarioAdminControlador.listar);
router.patch("/usuarios/:id", autenticarAdmin, usuarioAdminControlador.atualizar);

export default router;
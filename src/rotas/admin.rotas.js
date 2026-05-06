import { Router } from "express";
import adminControlador from "../controladores/admin.controlador.js";
import usuarioAdminControlador from "../controladores/usuarioAdmin.controlador.js";
import { autenticarAdmin } from "../middlewares/autenticacaoAdmin.middleware.js";

const router = Router();

router.post("/login", adminControlador.login);
router.get("/usuarios", autenticarAdmin, usuarioAdminControlador.listar);
router.get(
  "/usuarios/sem-inscricao",
  autenticarAdmin,
  usuarioAdminControlador.listarSemInscricao
);
router.patch("/usuarios/:id", autenticarAdmin, usuarioAdminControlador.atualizar);
router.delete("/usuarios/:id", autenticarAdmin, usuarioAdminControlador.excluir);

export default router;
import { Router } from "express";
import resumoControlador from "../controladores/resumo.controlador.js";
import { autenticarAdmin } from "../middlewares/autenticacaoAdmin.middleware.js";

const router = Router();

router.get("/:id/resumo", autenticarAdmin, resumoControlador.buscarResumoAdmin);
router.get("/:id/resumo-publico", resumoControlador.buscarResumoPublico);

export default router;
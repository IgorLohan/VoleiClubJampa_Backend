import { Router } from "express";
import campeonatoControlador from "../controladores/campeonato.controlador.js";
import { autenticarAdmin } from "../middlewares/autenticacaoAdmin.middleware.js";

const router = Router();

router.post("/", autenticarAdmin, campeonatoControlador.criar);
router.get("/", campeonatoControlador.listar);
router.get("/meus", autenticarAdmin, campeonatoControlador.listarMeus);
router.get("/publicos", campeonatoControlador.listarPublicos);
router.get("/:id", campeonatoControlador.buscarPorId);
router.put("/:id", autenticarAdmin, campeonatoControlador.atualizar);
router.delete("/:id", autenticarAdmin, campeonatoControlador.excluir);

export default router;
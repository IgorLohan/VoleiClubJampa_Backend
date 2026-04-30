import { Router } from "express";
import placarControlador from "../controladores/placar.controlador.js";
import { autenticarAdmin } from "../middlewares/autenticacaoAdmin.middleware.js";

const router = Router();

router.get("/jogos/:id", placarControlador.buscarJogoPorId);
router.patch("/jogos/:id/placar", autenticarAdmin, placarControlador.registrarPlacar);

export default router;
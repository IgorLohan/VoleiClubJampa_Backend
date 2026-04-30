import { Router } from "express";
import podioControlador from "../controladores/podio.controlador.js";

const router = Router();

router.get("/:id/podio", podioControlador.buscarPodio);

export default router;
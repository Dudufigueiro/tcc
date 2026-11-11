function createCrudController(service) {
  return {
    async listar(req, res) {
      res.json(await service.listar(req.valid?.query ?? {}));
    },
    async buscar(req, res) {
      res.json(await service.buscar(req.valid.params.id));
    },
    async criar(req, res) {
      res.status(201).json(await service.criar(req.valid.body));
    },
    async atualizar(req, res) {
      res.json(await service.atualizar(req.valid.params.id, req.valid.body));
    },
    async remover(req, res) {
      await service.remover(req.valid.params.id);
      res.status(204).end();
    },
  };
}

module.exports = createCrudController;
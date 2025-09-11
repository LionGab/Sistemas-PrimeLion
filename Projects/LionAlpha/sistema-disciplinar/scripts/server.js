const express = require('express');
const { db } = require('./firebase-admin');

const app = express();
app.use(express.json());

// Lista todos os alunos
app.get('/alunos', async (req, res) => {
  try {
    const snapshot = await db.collection('alunos').get();
    const alunos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.nome || '',
        turma: data.turma || '',
        nascimento: data.nascimento || '',
        responsavel: data.responsavel || '',
        cpf: data.cpf || ''
      };
    });
    res.json(alunos);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao listar alunos', detalhe: err.message });
  }
});

// Lista medidas de um aluno ordenadas por data decrescente
app.get('/medidas', async (req, res) => {
  try {
    const { alunoId } = req.query;
    if (!alunoId) {
      return res.status(400).json({ error: 'alunoId é obrigatório' });
    }
    const snapshot = await db.collection('medidas')
      .where('alunoId', '==', alunoId)
      .orderBy('data', 'desc')
      .get();

    const medidas = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        peso: data.peso,
        altura: data.altura,
        imc: data.imc,
        cintura: data.cintura,
        quadril: data.quadril,
        observacoes: data.observacoes,
        data: data.data
      };
    });
    res.json(medidas);
  } catch (err) {
    res.status(500).json({ error: 'Falha ao listar medidas', detalhe: err.message });
  }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
}

module.exports = app;

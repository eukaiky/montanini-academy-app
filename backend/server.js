const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// --- Configuração do Banco de Dados PostgreSQL ---
const connectionString = 'postgresql://fitplan_owner:npg_iZt1Sqnc9LNp@ep-divine-smoke-acie32pm-pooler.sa-east-1.aws.neon.tech/fitplan?sslmode=require';

const pool = new Pool({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Rota de Login SEM bcrypt ---
app.post('/api/login', async (req, res) => {
    console.log('\n--- NOVA TENTATIVA DE LOGIN ---');
    console.log('1. Rota de login atingida.');

    try {
        const { email, senha } = req.body;
        console.log(`2. Dados recebidos do app -> Email: ${email} | Senha: ${senha}`);

        if (!email || !senha) {
            console.log('ERRO: Email ou senha em falta.');
            return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
        }

        const queryText = 'SELECT * FROM "Student" WHERE email = $1';
        console.log('3. A executar a consulta na base de dados...');
        const result = await pool.query(queryText, [email]);
        console.log('4. Consulta executada.');

        if (result.rows.length === 0) {
            console.log('ERRO: Utilizador não encontrado na base de dados.');
            return res.status(404).json({ mensagem: 'Utilizador não encontrado.' });
        }

        const usuario = result.rows[0];
        console.log('5. Utilizador encontrado:', usuario);

        console.log('6. A comparar as senhas diretamente...');
        if (senha !== usuario.password) {
            console.log('ERRO: Senhas não correspondem.');
            return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
        }

        console.log('✅ SUCESSO: Login bem-sucedido!');
        res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            usuario: { id: usuario.id, name: usuario.name, email: usuario.email }
        });

    } catch (error) {
        console.error('⚠️  ERRO CRÍTICO NO SERVIDOR:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor. Verifique o console.' });
    }
});

// --- Inicialização do Servidor ---
app.listen(port, () => {
    console.log(`✅ Servidor rodando com sucesso na porta ${port}`);
    console.log('Conectado ao banco de dados PostgreSQL na nuvem.');
});

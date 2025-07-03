const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// --- Configuração do Banco de Dados PostgreSQL ---
// IMPORTANTE: Use a sua string de conexão completa que você me enviou anteriormente.
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

// --- Rota de Login COM DEPURADOR ---
app.post('/api/login', async (req, res) => {
    console.log('\n--- NOVA TENTATIVA DE LOGIN ---');
    console.log('1. Rota de login atingida.');

    try {
        const { email, senha } = req.body;
        console.log(`2. Dados recebidos do app -> Email: ${email} | Senha: ${senha}`);

        // Validação
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

        const senhaRecebida = senha;
        const hashDoBanco = usuario.password;
        console.log('6. A comparar as senhas com bcrypt...');
        console.log('   - Senha recebida do app:', senhaRecebida);
        console.log('   - Hash guardado no banco:', hashDoBanco);

        const senhaCorreta = await bcrypt.compare(senhaRecebida, hashDoBanco);
        console.log('7. Resultado da comparação (bcrypt.compare):', senhaCorreta);

        if (!senhaCorreta) {
            console.log('ERRO: As senhas não correspondem. Login inválido.');
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
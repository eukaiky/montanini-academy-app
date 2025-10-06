const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config();

// Carrega as variáveis de ambiente do arquivo .env
const config = {
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME
};

const app = express();
const port = process.env.PORT || 3000;

// Constante para a chave secreta do JWT
const JWT_SECRET = config.JWT_SECRET;

// --- Configuração da AWS ---
// Cria uma instância do cliente S3 usando as credenciais do .env
const s3 = new AWS.S3({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    region: config.AWS_REGION
});

// Configuração do pool de conexão com o PostgreSQL
const pool = new Pool({
    connectionString: config.DATABASE_URL,
    // Necessário para conexões seguras (SSL) com o Heroku ou serviços de cloud
    ssl: { rejectUnauthorized: false }
});

// Configuração do Multer para armazenar arquivos em memória (antes de enviar para o S3)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- CONFIGURAÇÃO DE CORS APRIMORADA ---
// Lista de origens permitidas (URLs do seu ambiente Expo)
const allowedOrigins = [
    'http://localhost:8081', // Expo Web
    'http://localhost:19006', // Expo Go
];
const corsOptions = {
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (como apps móveis) ou de origens permitidas
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // Rejeita a requisição se a origem não for permitida
            callback(new Error('Not allowed by CORS'));
        }
    },
    // Métodos e cabeçalhos permitidos
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Aplica o CORS para todas as rotas
app.use(cors(corsOptions));
// Habilita as requisições OPTIONS (pre-flight) para navegadores
app.options('*', cors(corsOptions));

// --- MIDDLEWARES ---
// Habilita o Express a processar JSON bodies (substitui o body-parser)
app.use(express.json());
// Habilita o Express a processar dados de formulário
app.use(express.urlencoded({ extended: true }));


// Middleware para autenticar o token JWT em rotas protegidas
const authenticateToken = (req, res, next) => {
    // Pega o header 'Authorization'
    const authHeader = req.headers['authorization'];
    // Extrai o token (ignora o 'Bearer ')
    const token = authHeader && authHeader.split(' ')[1];
    // Se não houver token, retorna 401
    if (token == null) return res.status(401).json({ message: 'Token não fornecido.' });

    // Verifica a validade do token usando a chave secreta
    jwt.verify(token, JWT_SECRET, (err, user) => {
        // Se houver erro (token expirado ou inválido), retorna 403
        if (err) return res.status(403).json({ message: 'Token inválido.' });
        // Se for válido, anexa os dados do usuário ao objeto req
        req.user = user;
        // Continua para o próximo middleware ou rota
        next();
    });
};

// --- ROTA DE LOGIN ---
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
    }
    try {
        // Busca o usuário pelo email, incluindo a senha hash/texto plano (para comparação) e dados de perfil
        const result = await pool.query('SELECT id, name, email, avatar, height, weight, "bodyFat", password FROM "Student" WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ mensagem: 'Utilizador não encontrado.' });

        const usuario = result.rows[0];
        // Compara a senha (Atenção: em produção, deve-se usar bcrypt para hash)
        if (senha !== usuario.password) return res.status(401).json({ mensagem: 'Credenciais inválidas.' });

        // Gera um token JWT que expira em 7 dias
        const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '7d' });

        // Retorna o token e os dados do usuário para o frontend
        res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            token,
            usuario: {
                uid: usuario.id, name: usuario.name, email: usuario.email, avatar: usuario.avatar,
                height: usuario.height, weight: usuario.weight, bodyFat: usuario.bodyFat
            }
        });
    } catch (error) {
        console.error('⚠️ ERRO NO LOGIN:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});

// --- ROTA DE ALTERAÇÃO DE SENHA ---
app.post('/api/students/change-password', authenticateToken, async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    // Checagem de segurança: garante que o usuário só possa mudar a própria senha
    if (userId !== req.user.id) {
        return res.status(403).json({ message: "Operação não autorizada." });
    }
    try {
        // Busca a senha atual no banco de dados
        const userResult = await pool.query('SELECT password FROM "Student" WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });

        // Compara a senha atual fornecida com a salva no banco
        if (currentPassword !== userResult.rows[0].password) {
            return res.status(400).json({ message: 'A senha atual está incorreta.' });
        }
        // Atualiza a senha no banco de dados
        await pool.query('UPDATE "Student" SET password = $1 WHERE id = $2', [newPassword, userId]);
        res.status(200).json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error('⚠️ ERRO AO ALTERAR SENHA:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// --- ROTA DE BUSCA DE PERFIL (GET) ---
app.get('/api/students/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        // Busca os dados de perfil do usuário logado
        const { rows } = await pool.query('SELECT id, name, email, avatar, height, weight, "bodyFat" FROM "Student" WHERE id = $1', [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
        // Retorna os dados formatados
        res.status(200).json({
            usuario: {
                uid: rows[0].id, name: rows[0].name, email: rows[0].email, avatar: rows[0].avatar,
                height: rows[0].height, weight: rows[0].weight, bodyFat: rows[0].bodyFat
            }
        });
    } catch (error) {
        console.error('⚠️ ERRO AO BUSCAR PERFIL:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao buscar perfil.' });
    }
});


// --- ROTA DE ATUALIZAÇÃO DE PERFIL (POST) ---
// Usa o middleware 'upload.single('avatar')' para lidar com o arquivo de imagem
app.post('/api/students/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
    const userId = req.user.id;
    // Desestrutura os campos de texto do body
    const { name, height, weight } = req.body;
    try {
        let avatarPath = null;
        // Verifica se um arquivo de avatar foi enviado
        if (req.file) {
            // Configura os parâmetros para o upload no S3
            const params = {
                Bucket: config.S3_BUCKET_NAME,
                // Cria um nome de arquivo único para evitar colisões
                Key: `uploads/${userId}-${Date.now()}${path.extname(req.file.originalname)}`,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };
            // Executa o upload e obtém a URL do arquivo
            const data = await s3.upload(params).promise();
            avatarPath = data.Location; // A URL pública do arquivo
        }

        // Lógica dinâmica para construir a query SQL de UPDATE
        const fieldsToUpdate = [];
        const values = [];
        let queryIndex = 1;

        // Adiciona campos e valores apenas se eles existirem no body
        if (name) { fieldsToUpdate.push(`name = $${queryIndex++}`); values.push(name); }
        if (height) { fieldsToUpdate.push(`height = $${queryIndex++}`); values.push(parseFloat(height)); }
        if (weight) { fieldsToUpdate.push(`weight = $${queryIndex++}`); values.push(parseFloat(weight)); }
        if (avatarPath) {
            fieldsToUpdate.push(`avatar = $${queryIndex++}`);
            values.push(avatarPath);
        }

        if (fieldsToUpdate.length === 0) return res.status(400).json({ message: "Nenhum dado para atualizar." });

        // Adiciona o ID do usuário como último valor para a cláusula WHERE
        values.push(userId);

        // Executa a query de UPDATE e retorna os dados atualizados
        const { rows } = await pool.query(
            `UPDATE "Student" SET ${fieldsToUpdate.join(', ')} WHERE id = $${queryIndex} RETURNING id, name, email, avatar, height, weight, "bodyFat"`,
            values
        );

        if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
        // Retorna a resposta de sucesso com os dados atualizados
        res.status(200).json({
            message: 'Perfil atualizado com sucesso!',
            usuario: {
                uid: rows[0].id, name: rows[0].name, email: rows[0].email, avatar: rows[0].avatar,
                height: rows[0].height, weight: rows[0].weight, bodyFat: rows[0].bodyFat
            }
        });
    } catch (error) {
        console.error('⚠️ ERRO AO ATUALIZAR PERFIL (S3):', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// --- ROTA DE BUSCA DE TREINOS ---
app.get('/api/workouts/:studentId', authenticateToken, async (req, res) => {
    const { studentId } = req.params;

    // Checagem de segurança: garante que o usuário só busque os próprios treinos
    if (studentId !== req.user.id) {
        return res.status(403).json({ message: "Operação não autorizada." });
    }

    // Query SQL complexa que faz:
    // 1. Busca os treinos ativos de um aluno (StudentWorkout -> Workout).
    // 2. Agrupa os exercícios de cada treino em um array JSON (json_agg).
    // 3. Pega uma imagem de destaque (image) do primeiro exercício encontrado para o card principal.
    // 4. Ordena tudo pelo dia da semana.
    const query = `
        SELECT
            sw."dayOfWeek", w.id, w.title, w.description AS focus,
            (SELECT e."imageUrl" FROM "WorkoutExercise" we_img JOIN "Exercise" e ON we_img."exerciseId" = e.id WHERE we_img."workoutId" = w.id AND e."imageUrl" IS NOT NULL LIMIT 1) AS image,
            json_agg(json_build_object('name', e.name, 'sets', we.sets, 'reps', we.reps, 'weight', we.weight, 'image', e."imageUrl") ORDER BY we.order) FILTER (WHERE e.id IS NOT NULL) AS exercises
        FROM "StudentWorkout" sw JOIN "Workout" w ON sw."workoutId" = w.id LEFT JOIN "WorkoutExercise" we ON w.id = we."workoutId" LEFT JOIN "Exercise" e ON we."exerciseId" = e.id
        WHERE sw."studentId" = $1 AND sw."isActive" = true
        GROUP BY sw."dayOfWeek", w.id, w.title, w.description ORDER BY sw."dayOfWeek";
    `;
    try {
        const { rows } = await pool.query(query, [studentId]);

        // Formatação final dos dados para adicionar campos mockados (duration, difficulty) e tratar imagens
        const formattedWorkouts = rows.map(workout => ({
            ...workout,
            id: workout.id,
            duration: '60 min',
            difficulty: 'Intermediário',
            exercises: workout.exercises || [],
            // URL de fallback se não encontrar a imagem do treino
            image: workout.image || 'https://images.unsplash.com/photo-15710196p13454-1cb2f99b2d8b?q=80&w=2070&auto.format&fit=crop'
        }));
        res.status(200).json(formattedWorkouts);
    } catch (error) {
        console.error('⚠️ ERRO AO BUSCAR TREINOS:', error);
        res.status(500).json({ mensagem: 'Erro interno ao buscar treinos.' });
    }
});


// Inicia o servidor e escuta a porta definida
app.listen(port, () => {
    console.log(`✅ Servidor rodando na porta ${port}`);
});
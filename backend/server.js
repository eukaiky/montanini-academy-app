const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

// Carrega as variáveis de ambiente
require('dotenv').config();

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

const JWT_SECRET = config.JWT_SECRET;

// --- Configuração da AWS ---
const s3 = new AWS.S3({
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    region: config.AWS_REGION
});

const pool = new Pool({
    connectionString: config.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- ✅ CONFIGURAÇÃO DE CORS APRIMORADA ---
// Lista de origens permitidas
const allowedOrigins = [
    'http://localhost:8081', // Expo Web
    'http://localhost:19006', // Expo Go
    // Adicione aqui a URL do seu app em produção, se tiver uma
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (ex: mobile apps, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'A política de CORS para este site não permite acesso da origem especificada.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
// Habilita o pre-flight para todas as rotas
app.options('*', cors(corsOptions));


app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ message: 'Token não fornecido.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido.' });
        req.user = user;
        next();
    });
};

// ROTA DE LOGIN
app.post('/api/login', async (req, res) => {
    console.log('\n--- TENTATIVA DE LOGIN ---');
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
    }
    try {
        const result = await pool.query('SELECT id, name, email, avatar, height, weight, "bodyFat", password FROM "Student" WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ mensagem: 'Utilizador não encontrado.' });

        const usuario = result.rows[0];
        if (senha !== usuario.password) return res.status(401).json({ mensagem: 'Credenciais inválidas.' });

        const token = jwt.sign({ id: usuario.id, email: usuario.email }, JWT_SECRET, { expiresIn: '7d' });
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

// ROTA DE ALTERAÇÃO DE SENHA
app.post('/api/students/change-password', authenticateToken, async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    if (userId !== req.user.id) {
        return res.status(403).json({ message: "Operação não autorizada." });
    }
    try {
        const userResult = await pool.query('SELECT password FROM "Student" WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });

        if (currentPassword !== userResult.rows[0].password) {
            return res.status(400).json({ message: 'A senha atual está incorreta.' });
        }
        await pool.query('UPDATE "Student" SET password = $1 WHERE id = $2', [newPassword, userId]);
        res.status(200).json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error('⚠️ ERRO AO ALTERAR SENHA:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA DE BUSCA DE PERFIL
app.get('/api/students/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const { rows } = await pool.query('SELECT id, name, email, avatar, height, weight, "bodyFat" FROM "Student" WHERE id = $1', [userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
        res.status(200).json({
            usuario: {
                uid: rows[0].id, name: rows[0].name, email: rows[0].email, avatar: rows[0].avatar,
                height: rows[0].height, weight: rows[0].weight, bodyFat: rows[0].bodyFat
            }
        });
    } catch (error) {
        console.error('⚠️ ERRO AO BUSCAR PERFIL:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA DE ATUALIZAÇÃO DE PERFIL
app.post('/api/students/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
    const userId = req.user.id;
    const { name, height, weight } = req.body;
    try {
        let avatarPath = null;
        if (req.file) {
            const params = {
                Bucket: config.S3_BUCKET_NAME,
                Key: `uploads/${userId}-${Date.now()}${path.extname(req.file.originalname)}`,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            };
            const data = await s3.upload(params).promise();
            avatarPath = data.Location;
        }

        const fieldsToUpdate = [];
        const values = [];
        let queryIndex = 1;

        if (name) { fieldsToUpdate.push(`name = $${queryIndex++}`); values.push(name); }
        if (height) { fieldsToUpdate.push(`height = $${queryIndex++}`); values.push(parseFloat(height)); }
        if (weight) { fieldsToUpdate.push(`weight = $${queryIndex++}`); values.push(parseFloat(weight)); }
        if (avatarPath) { fieldsToUpdate.push(`avatar = $${queryIndex++}`); values.push(avatarPath); }

        if (fieldsToUpdate.length === 0) return res.status(400).json({ message: "Nenhum dado para atualizar." });

        values.push(userId);
        const { rows } = await pool.query(
            `UPDATE "Student" SET ${fieldsToUpdate.join(', ')} WHERE id = $${queryIndex} RETURNING id, name, email, avatar, height, weight, "bodyFat"`,
            values
        );

        if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
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

// ROTA DE BUSCA DE TREINOS
app.get('/api/workouts/:studentId', authenticateToken, async (req, res) => {
    const { studentId } = req.params;
    if (studentId !== req.user.id) {
        return res.status(403).json({ message: "Operação não autorizada." });
    }
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
        const formattedWorkouts = rows.map(workout => ({
            ...workout,
            id: workout.id,
            duration: '60 min',
            difficulty: 'Intermediário',
            exercises: workout.exercises || [],
            image: workout.image || 'https://images.unsplash.com/photo-15710196p13454-1cb2f99b2d8b?q=80&w=2070&auto.format&fit=crop'
        }));
        res.status(200).json(formattedWorkouts);
    } catch (error) {
        console.error('⚠️ ERRO AO BUSCAR TREINOS:', error);
        res.status(500).json({ mensagem: 'Erro interno ao buscar treinos.' });
    }
});


app.listen(port, () => {
    console.log(`✅ Servidor rodando na porta ${port}`);
});
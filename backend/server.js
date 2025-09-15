const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Módulo File System para verificar pastas

const app = express();
const port = 3000;

const JWT_SECRET = 'sua-chave-secreta-super-segura-e-longa';

// --- VERIFICAÇÃO DE PASTA DE UPLOADS ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    console.log(`Diretório '${uploadsDir}' não encontrado. Criando...`);
    fs.mkdirSync(uploadsDir);
}
// --- FIM DA VERIFICAÇÃO ---

const connectionString = 'postgresql://fitplan_owner:npg_7GblqtsQv9Oy@ep-divine-smoke-acie32pm-pooler.sa-east-1.aws.neon.tech/fitplan?sslmode=require';
const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, 'uploads/'); },
    filename: function (req, file, cb) { cb(null, 'avatar-' + Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

app.post('/api/login', async (req, res) => {
    console.log('\n--- TENTATIVA DE LOGIN ---');
    try {
        const { email, senha } = req.body;
        if (!email || !senha) return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });

        const result = await pool.query('SELECT * FROM "Student" WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(404).json({ mensagem: 'Utilizador não encontrado.' });

        const usuario = result.rows[0];
        if (senha !== usuario.password) return res.status(401).json({ mensagem: 'Credenciais inválidas.' });

        const tokenPayload = { id: usuario.id, email: usuario.email };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

        console.log('✅ SUCESSO: Login bem-sucedido!');
        res.status(200).json({
            mensagem: 'Login realizado com sucesso!',
            token,
            usuario: { uid: usuario.id, name: usuario.name, email: usuario.email, avatar: usuario.avatar, height: usuario.height, weight: usuario.weight }
        });
    } catch (error) {
        console.error('⚠️ ERRO NO LOGIN:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor.' });
    }
});

app.post('/api/students/change-password', authenticateToken, async (req, res) => {
    console.log('\n--- TENTATIVA DE ALTERAÇÃO DE SENHA ---');
    const { userId, currentPassword, newPassword } = req.body;
    const authenticatedUserId = req.user.id;

    if (userId !== authenticatedUserId) {
        return res.status(403).json({ message: "Operação não autorizada." });
    }

    try {
        const userResult = await pool.query('SELECT password FROM "Student" WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });

        const user = userResult.rows[0];
        if (currentPassword !== user.password) {
            return res.status(400).json({ message: 'A senha atual está incorreta.' });
        }

        await pool.query('UPDATE "Student" SET password = $1 WHERE id = $2', [newPassword, userId]);

        console.log(`✅ Senha do usuário ${userId} alterada com sucesso.`);
        res.status(200).json({ message: 'Senha alterada com sucesso!' });

    } catch (error) {
        console.error('⚠️ ERRO AO ALTERAR SENHA:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA DE ATUALIZAÇÃO DE PERFIL USANDO POST
app.post('/api/students/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
    // --- LOGS DE DIAGNÓSTICO ADICIONADOS ---
    console.log('\n--- TENTATIVA DE ATUALIZAÇÃO DE PERFIL (POST) ---');
    console.log('ID do usuário autenticado:', req.user.id);
    console.log('Dados recebidos (corpo):', req.body);
    console.log('Arquivo recebido (imagem):', req.file);
    // --- FIM DOS LOGS DE DIAGNÓSTICO ---

    const userId = req.user.id;
    const { name, height, weight } = req.body;

    try {
        const fieldsToUpdate = [];
        const values = [];
        let queryIndex = 1;

        if (name) { fieldsToUpdate.push(`name = $${queryIndex++}`); values.push(name); }
        if (height) { fieldsToUpdate.push(`height = $${queryIndex++}`); values.push(parseFloat(height)); }
        if (weight) { fieldsToUpdate.push(`weight = $${queryIndex++}`); values.push(parseFloat(weight)); }

        if (req.file) {
            const avatarPath = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            fieldsToUpdate.push(`avatar = $${queryIndex++}`);
            values.push(avatarPath);
            console.log(`Nova imagem de avatar: ${avatarPath}`);
        }

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ message: "Nenhum dado para atualizar." });
        }

        values.push(userId);

        const updateQuery = `UPDATE "Student" SET ${fieldsToUpdate.join(', ')} WHERE id = $${queryIndex} RETURNING *`;

        const { rows } = await pool.query(updateQuery, values);

        if (rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });

        const updatedUser = rows[0];
        console.log(`✅ Perfil do usuário ${userId} atualizado com sucesso.`);

        res.status(200).json({
            message: 'Perfil atualizado com sucesso!',
            usuario: {
                uid: updatedUser.id, name: updatedUser.name, email: updatedUser.email,
                avatar: updatedUser.avatar, height: updatedUser.height, weight: updatedUser.weight
            }
        });

    } catch (error) {
        console.error('⚠️  ERRO AO ATUALIZAR PERFIL:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

app.get('/api/workouts/:studentId', async (req, res) => {
    const { studentId } = req.params;
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
        const dayOfWeekMap = { 1: 'Domingo', 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta', 7: 'Sábado' };
        const formattedWorkouts = rows.map(workout => ({
            ...workout, id: workout.id, dayOfWeek: dayOfWeekMap[workout.dayOfWeek], duration: '60 min', difficulty: 'Intermediário', exercises: workout.exercises || [],
            image: workout.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto.format&fit=crop'
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


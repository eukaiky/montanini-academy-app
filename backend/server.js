const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// --- Configuração do Banco de Dados PostgreSQL ---
const connectionString = 'postgresql://fitplan_owner:npg_7GblqtsQv9Oy@ep-divine-smoke-acie32pm-pooler.sa-east-1.aws.neon.tech/fitplan?sslmode=require';

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
            // IMPORTANT: Send user data to the frontend
            usuario: { id: usuario.id, name: usuario.name, email: usuario.email }
        });

    } catch (error) {
        console.error('⚠️  ERRO CRÍTICO NO SERVIDOR:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor. Verifique o console.' });
    }
});

// --- ROTA PARA BUSCAR TREINOS DO ALUNO ---
app.get('/api/workouts/:studentId', async (req, res) => {
    const { studentId } = req.params;
    console.log(`\n--- BUSCANDO TREINOS PARA O ALUNO ID: ${studentId} ---`);

    // This complex query joins all necessary tables to get the workouts and their
    // corresponding exercises in a single database hit.
    const query = `
        SELECT
            sw."dayOfWeek",
            w.id,
            w.title,
            w.description AS focus,
            (
                SELECT e."imageUrl"
                FROM "WorkoutExercise" we_img
                JOIN "Exercise" e ON we_img."exerciseId" = e.id
                WHERE we_img."workoutId" = w.id AND e."imageUrl" IS NOT NULL
                LIMIT 1
            ) AS image,
            json_agg(
                json_build_object(
                    'name', e.name,
                    'sets', we.sets,
                    'reps', we.reps,
                    'weight', we.weight,
                    'image', e."imageUrl"
                ) ORDER BY we.order
            ) FILTER (WHERE e.id IS NOT NULL) AS exercises
        FROM "StudentWorkout" sw
        JOIN "Workout" w ON sw."workoutId" = w.id
        LEFT JOIN "WorkoutExercise" we ON w.id = we."workoutId"
        LEFT JOIN "Exercise" e ON we."exerciseId" = e.id
        WHERE sw."studentId" = $1 AND sw."isActive" = true
        GROUP BY sw."dayOfWeek", w.id, w.title, w.description
        ORDER BY sw."dayOfWeek";
    `;

    try {
        const { rows } = await pool.query(query, [studentId]);
        console.log(`✅ Treinos encontrados: ${rows.length}`);

        // Helper to convert numeric day of week to string
        const dayOfWeekMap = { 1: 'Domingo', 2: 'Segunda', 3: 'Terça', 4: 'Quarta', 5: 'Quinta', 6: 'Sexta', 7: 'Sábado' };

        const formattedWorkouts = rows.map(workout => ({
            ...workout,
            id: workout.id, // Ensure id is a string for React keys
            dayOfWeek: dayOfWeekMap[workout.dayOfWeek],
            // Add fallback values for fields not in the DB
            duration: '60 min',
            difficulty: 'Intermediário',
            exercises: workout.exercises || [], // Ensure exercises is always an array
            image: workout.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' // Fallback image
        }));

        res.status(200).json(formattedWorkouts);
    } catch (error) {
        console.error('⚠️  ERRO AO BUSCAR TREINOS:', error);
        res.status(500).json({ mensagem: 'Erro interno no servidor ao buscar treinos.' });
    }
});


// --- Inicialização do Servidor ---
app.listen(port, () => {
    console.log(`✅ Servidor rodando com sucesso na porta ${port}`);
    console.log('Conectado ao banco de dados PostgreSQL na nuvem.');
});

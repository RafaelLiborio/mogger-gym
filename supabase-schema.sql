-- ==============================================================================
-- MOGGER GYM — SCHEMA DO BANCO DE DADOS SUPABASE
-- ==============================================================================
-- Execute este script no SQL Editor do seu projeto Supabase (https://app.supabase.com)
-- Ele cria as tabelas de treinos e logs com Row Level Security (RLS) habilitada,
-- garantindo que cada usuário só acesse e gerencie seus próprios dados.
-- ==============================================================================

-- 1. TABELA DE TREINOS (workouts)
CREATE TABLE IF NOT EXISTS public.workouts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    focus TEXT DEFAULT 'Hipertrofia',
    days INTEGER DEFAULT 4,
    notes TEXT DEFAULT '',
    exercises JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para a tabela workouts:
-- Permite que usuários autenticados (inclusive via Google OAuth) façam CRUD em seus treinos
CREATE POLICY "Usuários podem visualizar seus próprios treinos"
ON public.workouts
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Usuários podem criar seus próprios treinos"
ON public.workouts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios treinos"
ON public.workouts
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Usuários podem excluir seus próprios treinos"
ON public.workouts
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Índices para buscas ultra-rápidas
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_updated_at ON public.workouts(updated_at DESC);


-- 2. TABELA DE HISTÓRICO / SESSÕES CONCLUÍDAS (workout_logs)
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    workout_id TEXT,
    workout_title TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 45,
    exercises_completed INTEGER DEFAULT 0,
    note TEXT DEFAULT '',
    completed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para a tabela workout_logs
CREATE POLICY "Usuários podem visualizar seus próprios logs"
ON public.workout_logs
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Usuários podem registrar seus próprios logs"
ON public.workout_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios logs"
ON public.workout_logs
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Usuários podem excluir seus próprios logs"
ON public.workout_logs
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_completed_at ON public.workout_logs(completed_at DESC);


-- 3. PERMISSÕES DE ACESSO PÚBLICO ANÔNIMO (opcional para testes se RLS estiver flexível)
-- As políticas acima cobrem authenticated (usuários logados pelo Supabase Google Auth).

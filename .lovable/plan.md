

# Plano: Redesign Airtm + Transferencias Internas + Seguranca Completa

## Visao Geral

Redesenhar o dashboard no estilo **Airtm** (cartao de saldo em vidro fosco, botoes "Adicionar / Sacar / Transferir", historico limpo) com efeito **liquid glass iOS**. Implementar transferencias internas entre contas, seguranca com 2FA via app autenticador (TOTP), e corrigir erros de build.

---

## 1. Corrigir Build Errors (Stripe edge functions)

Adicionar tipagem `(error as Error)` nos ficheiros `create-checkout/index.ts` e `stripe-webhook/index.ts` para resolver os erros TS18046. Esses edge functions ficam como legado mas precisam compilar.

---

## 2. Redesign Dashboard estilo Airtm + Liquid Glass

**Ficheiros**: `Dashboard.tsx`, `VirtualCard.tsx`, `QuickActions.tsx`, `StatsCards.tsx`, `index.css`

- **Cartao de saldo principal**: Estilo Airtm com fundo em gradiente verde translucido (liquid glass / backdrop-blur), saldo grande centralizado em AOA, nome do utilizador, eye toggle
- **Efeito Liquid Glass iOS**: Classes CSS com `backdrop-filter: blur(40px)`, `background: rgba(255,255,255,0.15)`, bordas sutis com `border: 1px solid rgba(255,255,255,0.2)`, sombras suaves
- **Botoes de acao**: 3-4 botoes arredondados abaixo do cartao: **Receber** | **Transferir** | **Sacar** | **Historico**
- **Cartao virtual**: Manter o cartao fisico com chip mas aplicar liquid glass no fundo, mover para secao secundaria
- **Historico de transacoes**: Lista limpa com icones por tipo (doacao recebida, transferencia enviada, transferencia recebida, saque)

---

## 3. Transferencias Internas entre Contas

### 3.1 Backend (Migration SQL)

Criar tabela `transfers`:
```
transfers (
  id uuid PK,
  sender_id uuid NOT NULL -> profiles(id),
  receiver_id uuid NOT NULL -> profiles(id),
  amount integer NOT NULL,
  note text DEFAULT '',
  status text DEFAULT 'completed',
  created_at timestamptz
)
```

RLS: utilizadores podem ver transferencias onde sao sender ou receiver. Insert apenas autenticado com `sender_id = auth.uid()`.

Habilitar realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.transfers;`

### 3.2 Edge Function `internal-transfer`

- Validar: sender autenticado, receiver existe (buscar por @username ou UUID), saldo suficiente, valor minimo 100 AOA
- Limite diario: 500.000 AOA (consultar transfers do dia)
- Atomicidade: decrementar saldo do sender, incrementar saldo do receiver, inserir registro na transfers
- Usar service role para updates nos wallets

### 3.3 Frontend - Modal de Transferencia

Novo componente `TransferModal.tsx`:
- Campo para destinatario (@username ou UUID) com busca em tempo real
- Campo de valor com botoes rapidos
- Campo de nota opcional
- Confirmacao antes de enviar
- Feedback de sucesso/erro

Adicionar botao "Transferir" no `QuickActions.tsx`.

---

## 4. Seguranca e 2FA (App Autenticador / TOTP)

### 4.1 Edge Function `totp-setup` e `totp-verify`

- `totp-setup`: Gera secret TOTP, retorna QR code URI para o utilizador escanear com Google Authenticator
- `totp-verify`: Valida codigo TOTP de 6 digitos

### 4.2 Tabela `user_security`

```
user_security (
  user_id uuid PK -> profiles(id),
  totp_secret text (encriptado),
  totp_enabled boolean DEFAULT false,
  daily_transfer_limit integer DEFAULT 500000,
  failed_attempts integer DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz
)
```

RLS: apenas o proprio utilizador pode SELECT. Sem INSERT/UPDATE direto (service role).

### 4.3 Fluxo de seguranca

- **Ativar 2FA**: Settings > Seguranca > Ativar 2FA > Escanear QR > Confirmar codigo
- **Saques e transferencias**: Se 2FA ativo, pedir codigo TOTP antes de confirmar
- **Bloqueio**: Apos 5 tentativas falhadas, bloquear por 30 minutos
- **Historico**: Dashboard mostra todas transacoes (doacoes, transferencias, saques) com status (Pendente, Confirmado, Cancelado)

---

## 5. Valor minimo de doacao: 1.000 AOA

Atualizar `plinqpay-checkout` (zod schema min de 100 para 1000) e `UserProfile.tsx` (min="1000", quickAmounts ajustados: [1000, 2500, 5000, 10000, 25000]).

---

## 6. Historico Completo de Transacoes

Novo componente `TransactionHistory.tsx` que unifica:
- Doacoes recebidas (tabela `donations`)
- Transferencias enviadas/recebidas (tabela `transfers`)
- Saques (tabela `withdrawals`)

Ordenado por data, com filtros por tipo e status.

---

## Secao Tecnica - Ordem de Implementacao

1. Fix build errors (Stripe files - tipagem de error)
2. Migration: criar tabelas `transfers` e `user_security`
3. Edge functions: `internal-transfer`, `totp-setup`, `totp-verify`
4. CSS: classes liquid glass no `index.css`
5. Redesign `Dashboard.tsx` + sub-componentes estilo Airtm
6. `TransferModal.tsx` com busca de destinatario
7. `TransactionHistory.tsx` unificado
8. Pagina de seguranca com setup 2FA
9. Atualizar minimo de doacao para 1.000 AOA
10. Deploy e teste


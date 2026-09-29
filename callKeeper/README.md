# CallKeeper

O **CallKeeper** é um plugin para Equicord/Vencord projetado para manter a sua conexão na chamada ativa, transferindo-a automaticamente do celular para o PC/Desktop quando a outra pessoa sair da call.

## Objetivo e Funcionamento

Quando você estiver em uma chamada privada (**DM**) ou em grupo (**Group DM**) pelo celular com um usuário monitorado:
- Se a **outra pessoa sair da chamada**, o plugin detecta que foi ela quem desconectou (e não você).
- O plugin conecta a sua conta automaticamente pelo **PC/Desktop** à mesma chamada, mantendo você conectado.
- Se **você sair** da chamada por vontade própria, o plugin não executa nenhuma ação.
- Se você **já estiver em uma chamada pelo PC**, o plugin não executa nenhuma ação.
- Chamadas de canais de voz de **servidores (Guilds)** são ignoradas propositalmente.

## Como usar?

1. Clique com o botão direito no usuário desejado.
2. Ative a opção **"CallKeeper"**.
3. Enquanto você estiver conectado à call pelo celular com esse usuário, caso ele desconecte, o seu Discord no Desktop assumirá a conexão instantaneamente.

## Regras de Segurança e Validação

Antes de realizar a transferência para o PC, o plugin valida rigorosamente:
1. O CallKeeper está ativado para o usuário em questão.
2. A outra pessoa foi quem saiu da chamada (não você).
3. A chamada é uma **DM** ou **Group DM** (não servidores).
4. Você ainda continua conectado à chamada pelo celular.
5. Você **não** está em nenhuma chamada ativa pelo PC/Desktop.

## Configurações

- **Tempo de espera antes da transferência:** Tempo (em segundos) que o plugin aguarda após a pessoa sair da call antes de conectar o PC. Se configurado como `0`, a troca é **instantânea**. Caso a pessoa reconecte durante esse período de espera, a transferência é automaticamente cancelada.
- **Exibir notificação quando a chamada for transferida para o PC:** Exibe um aviso (toast) visual no canto da tela informando que a conexão foi assumida com sucesso pelo PC.
- **Apenas transferir chamadas de DMs e Grupos:** Filtra a ação para DMs e Group DMs, ignorando servidores.

---

<p align="center">Feito com ❤️ por <b>Guih</b></p>

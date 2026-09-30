<h1 align="center">Guihzzy Plugins</h1>

<p align="center">
  <b>Coleção de plugins personalizados para o Equicord / Vencord desenvolvidos por Guih.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Equicord-Plugin_Pack-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Equicord" />
  <img src="https://img.shields.io/badge/Author-Guih-FF4500?style=for-the-badge" alt="Author" />
  <img src="https://img.shields.io/badge/Language-TypeScript_%26_TSX-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## 📦 Plugins Inclusos

Esta pasta reúne ferramentas exclusivas focadas em utilidades de chat, voz, notificações, monitoramento e produtividade no Discord.

| Plugin | Descrição | Categoria | Status |
| :--- | :--- | :--- | :---: |
| **MultiForward** | Permite selecionar múltiplas mensagens no chat (inclusive mensagens agrupadas em sequência) e encaminhá-las todas de uma só vez para qualquer canal, amigo ou servidor com barra flutuante, busca rápida e ordenação personalizada. | `Chat` `Utility` | **Atualizado** |
| **MentionNotifier** | Exibe notificações elegantes em card (toasts) para menções diretas e `@everyone`/`@here` em Grupos e Servidores, com modal completo de histórico de logs (filtrável por servidor/grupo e com atalho para a mensagem). | `Notifications` `Chat` `Utility` | **Atualizado** |
| **FakeDeafen** | Permite simular no servidor e na chamada que você está surdo, mutado, ambos os ícones cortados simultaneamente ou totalmente invisível, enquanto você continua falando e ouvindo 100% normal. Conta com alertas em popup toast. | `Voice` `Utility` | **Atualizado** |
| **VoiceRejoin** | Reconecta você de forma confiável à última chamada de voz (DM, Grupo ou Servidor) automaticamente após fechar ou reiniciar o Discord, com verificação de canais vazios e timeout configurável. | `Voice` `Utility` | **Atualizado** |
| **CallTimer** | Exibe no topo da chamada o tempo decorrido em tempo real para DMs, Grupos e Canais de Voz (buscando o início exato em DMs e identificando quem iniciou). | `Voice` `Appearance` `Utility` | — |
| **QuickEdit** | Edita mensagens próprias ou abre configurações de canais (texto, voz, categorias, tópicos) com duplo clique esquerdo ágil. | `Chat` `Shortcuts` `Utility` | — |
| **VoiceChannelLog** | Registra histórico detalhado de voz (entradas, saídas, microfone mutado/desmutado, fone ensurdecido, câmeras, telas, soundboard e exportação em `.json`). | `Voice` `Utility` | — |
| **CallKeeper** | Transfere automaticamente a chamada do celular para o PC quando a outra pessoa sair de uma DM ou Group DM, evitando que a call caia. | `Voice` `Utility` | — |
| **VoiceHandoff** | Conecta o PC automaticamente na call de um usuário marcado assim que você se desconecta do celular. | `Voice` `Utility` | — |
| **FollowUser** | Segue e acompanha automaticamente amigos selecionados entre canais de voz. | `Voice` `Utility` | — |
| **ColeriaUser** | Ferramenta complementar para monitoramento e acompanhamento em chamadas. | `Voice` `Utility` | — |
| **MessageSearch** | Interface otimizada e recursos extras para busca rápida de mensagens em chats. | `Chat` `Utility` | — |

---

## 🛠️ Como Instalar e Utilizar

1. **Localização**: Certifique-se de que os plugins estejam dentro da pasta de plugins do Equicord (`src/equicordplugins/`).
2. **Build**: Compile ou execute o cliente em modo de desenvolvimento (`pnpm build` ou `pnpm dev`).
3. **Ativação**: No Discord, abra as **Configurações de Usuário** → **Plugins** e ative os plugins desejados.
4. **Configuração**: Os plugins possuem opções detalhadas de personalização na engrenagem de configurações, barras de ferramentas superiores ou botões de atalho no rodapé do cliente.

---

## 🔒 Boas Práticas & Segurança

- **Compatibilidade**: Desenvolvidos seguindo as convenções nativas e stores do Equicord (`VoiceStateStore`, `ChannelStore`, `UserStore`, `GuildStore`, etc.).
- **Desempenho**: Ouvintes leves com limpeza adequada de eventos no ciclo de vida (`start` / `stop`).
- **Resiliência**: Tratamento de rate-limits com delays assíncronos e fallbacks inteligentes para evitar falhas de envio ou travamentos.

---

<p align="center">Feito com ❤️ por <b>Guih</b></p>
